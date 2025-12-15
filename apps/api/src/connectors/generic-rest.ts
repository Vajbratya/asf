/**
 * S23 - Generic REST Connector
 *
 * Configurable REST API connector supporting multiple authentication types
 * and request/response transformations.
 */

import axios, { AxiosInstance, AxiosRequestConfig, Method } from "axios";
import { BaseConnector, BaseConnectorConfig } from "./base.js";
import type {
  GenericRestConfig,
  RestAuthConfig,
  RestEndpointConfig,
  ConnectorMessage,
} from "../types/connector.js";

interface GenericRestConnectorConfig extends BaseConnectorConfig {
  config: GenericRestConfig;
}

interface OAuth2Token {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  expires_at?: number;
}

export class GenericRestConnector extends BaseConnector {
  private restConfig: GenericRestConfig;
  private httpClient: AxiosInstance;
  private oauth2Token?: OAuth2Token;

  constructor(config: GenericRestConnectorConfig) {
    super(config);
    this.restConfig = config.config;

    // Create HTTP client
    this.httpClient = this.createHttpClient();

    this.logger.info(
      { baseUrl: this.restConfig.baseUrl },
      "Generic REST connector initialized",
    );
  }

  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.restConfig.baseUrl,
      timeout: this.restConfig.defaultTimeout || 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Add request interceptor for authentication
    client.interceptors.request.use(
      async (config) => {
        await this.addAuthentication(config);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Add response interceptor for error handling
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Handle OAuth2 token refresh on 401
        if (
          error.response?.status === 401 &&
          this.restConfig.auth.type === "oauth2" &&
          this.oauth2Token?.refresh_token
        ) {
          try {
            await this.refreshOAuth2Token();
            // Retry the original request
            return this.httpClient.request(error.config);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      },
    );

    return client;
  }

  protected validateConfig(): void {
    super.validateConfig();

    if (!this.restConfig.baseUrl) {
      throw this.createError("Base URL is required", "INVALID_CONFIG", false);
    }

    if (!this.restConfig.auth) {
      throw this.createError(
        "Authentication configuration is required",
        "INVALID_CONFIG",
        false,
      );
    }
  }

  async connect(): Promise<void> {
    this.setStatus("connecting");
    this.logger.info(
      { baseUrl: this.restConfig.baseUrl },
      "Connecting to REST API",
    );

    try {
      // For OAuth2, get initial token
      if (this.restConfig.auth.type === "oauth2") {
        await this.getOAuth2Token();
      }

      // Test connection with a simple request
      await this.testConnection();

      this.setStatus("connected");
      this.logger.info("Connected to REST API");
    } catch (error) {
      this.setStatus("error");
      this.recordError(error as Error);
      throw this.createError(
        `Failed to connect to REST API: ${(error as Error).message}`,
        "CONNECTION_FAILED",
        true,
      );
    }
  }

  async disconnect(): Promise<void> {
    this.logger.info("Disconnecting from REST API");
    this.oauth2Token = undefined;
    this.setStatus("disconnected");
    this.logger.info("Disconnected from REST API");
  }

  async send(message: ConnectorMessage): Promise<void> {
    const startTime = Date.now();

    try {
      // Get endpoint configuration
      const endpointConfig = this.restConfig.endpoints[message.type];
      if (!endpointConfig) {
        throw this.createError(
          `No endpoint configuration found for message type: ${message.type}`,
          "ENDPOINT_NOT_FOUND",
          false,
        );
      }

      // Transform request if configured
      const transformedPayload = this.transformRequest(
        message.payload,
        endpointConfig,
      );

      // Build request config
      const requestConfig: AxiosRequestConfig = {
        url: endpointConfig.url,
        method: endpointConfig.method as Method,
        data: transformedPayload,
        headers: endpointConfig.headers || {},
        timeout: endpointConfig.timeout || this.restConfig.defaultTimeout,
      };

      // Send request with retry
      const response = await this.retry(
        () => this.httpClient.request(requestConfig),
        `send-${message.type}`,
      );

      // Transform response if configured
      const transformedResponse = this.transformResponse(
        response.data,
        endpointConfig,
      );

      this.recordMessageSent();
      this.recordLatency(Date.now() - startTime);

      this.logger.debug(
        {
          messageId: message.id,
          endpoint: endpointConfig.url,
          latency: Date.now() - startTime,
        },
        "REST request sent successfully",
      );

      // Emit response event
      this.emit("response", {
        messageId: message.id,
        data: transformedResponse,
      });
    } catch (error) {
      this.recordError(error as Error);
      throw error;
    }
  }

  /**
   * Execute a custom endpoint request
   */
  async request(
    endpointName: string,
    params?: any,
    options?: Partial<RestEndpointConfig>,
  ): Promise<any> {
    const endpointConfig = this.restConfig.endpoints[endpointName];
    if (!endpointConfig) {
      throw this.createError(
        `Endpoint not found: ${endpointName}`,
        "ENDPOINT_NOT_FOUND",
        false,
      );
    }

    // Merge with options
    const config = { ...endpointConfig, ...options };

    // Build URL with params
    let url = config.url;
    if (params && config.method === "GET") {
      const query = new URLSearchParams(params).toString();
      url = `${url}?${query}`;
    }

    const requestConfig: AxiosRequestConfig = {
      url,
      method: config.method as Method,
      data: params && config.method !== "GET" ? params : undefined,
      headers: config.headers || {},
      timeout: config.timeout || this.restConfig.defaultTimeout,
    };

    const response = await this.retry(
      () => this.httpClient.request(requestConfig),
      `request-${endpointName}`,
    );

    return this.transformResponse(response.data, config);
  }

  /**
   * Add authentication to request
   */
  private async addAuthentication(config: AxiosRequestConfig): Promise<void> {
    const auth = this.restConfig.auth;

    switch (auth.type) {
      case "apikey":
        if (auth.apiKey) {
          config.headers = config.headers || {};
          config.headers[auth.apiKey.header] = auth.apiKey.value;
        }
        break;

      case "basic":
        if (auth.basic) {
          const token = Buffer.from(
            `${auth.basic.username}:${auth.basic.password}`,
          ).toString("base64");
          config.headers = config.headers || {};
          config.headers.Authorization = `Basic ${token}`;
        }
        break;

      case "bearer":
        if (auth.bearer) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${auth.bearer.token}`;
        }
        break;

      case "oauth2":
        if (this.oauth2Token) {
          // Check if token is expired
          if (this.isTokenExpired()) {
            await this.refreshOAuth2Token();
          }
          config.headers = config.headers || {};
          config.headers.Authorization = `${this.oauth2Token.token_type} ${this.oauth2Token.access_token}`;
        }
        break;
    }
  }

  /**
   * Get OAuth2 token
   */
  private async getOAuth2Token(): Promise<void> {
    const oauth2 = this.restConfig.auth.oauth2;
    if (!oauth2) {
      throw this.createError(
        "OAuth2 configuration not found",
        "INVALID_CONFIG",
        false,
      );
    }

    try {
      this.logger.debug("Getting OAuth2 token");

      const response = await axios.post(
        oauth2.tokenUrl,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: oauth2.clientId,
          client_secret: oauth2.clientSecret,
          scope: oauth2.scope || "",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      this.oauth2Token = response.data;
      this.oauth2Token!.expires_at =
        Date.now() + response.data.expires_in * 1000;

      this.logger.debug("OAuth2 token acquired");
    } catch (error) {
      throw this.createError(
        `Failed to get OAuth2 token: ${(error as Error).message}`,
        "AUTH_ERROR",
        false,
      );
    }
  }

  /**
   * Refresh OAuth2 token
   */
  private async refreshOAuth2Token(): Promise<void> {
    const oauth2 = this.restConfig.auth.oauth2;
    if (!oauth2 || !this.oauth2Token?.refresh_token) {
      throw this.createError(
        "Cannot refresh token: no refresh token available",
        "AUTH_ERROR",
        false,
      );
    }

    try {
      this.logger.debug("Refreshing OAuth2 token");

      const response = await axios.post(
        oauth2.tokenUrl,
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.oauth2Token.refresh_token,
          client_id: oauth2.clientId,
          client_secret: oauth2.clientSecret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      this.oauth2Token = response.data;
      this.oauth2Token!.expires_at =
        Date.now() + response.data.expires_in * 1000;

      this.logger.debug("OAuth2 token refreshed");
    } catch (error) {
      throw this.createError(
        `Failed to refresh OAuth2 token: ${(error as Error).message}`,
        "AUTH_ERROR",
        false,
      );
    }
  }

  /**
   * Check if OAuth2 token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.oauth2Token || !this.oauth2Token.expires_at) {
      return true;
    }
    // Consider token expired 1 minute before actual expiration
    return Date.now() >= this.oauth2Token.expires_at - 60000;
  }

  /**
   * Test connection to API
   */
  private async testConnection(): Promise<void> {
    // Try to make a simple request to verify connectivity
    try {
      await this.httpClient.get("/");
    } catch (error) {
      // Ignore 404 errors - just testing connectivity
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return;
      }
      throw error;
    }
  }

  /**
   * Transform request payload
   */
  private transformRequest(payload: any, config: RestEndpointConfig): any {
    if (!this.restConfig.transform?.request) {
      return payload;
    }

    const transform = this.restConfig.transform.request;

    // Apply template transformation
    if (transform.template) {
      return this.applyTemplate(transform.template, payload);
    }

    // Apply field mapping
    if (transform.mapping) {
      return this.applyMapping(payload, transform.mapping);
    }

    return payload;
  }

  /**
   * Transform response data
   */
  private transformResponse(data: any, config: RestEndpointConfig): any {
    if (!this.restConfig.transform?.response) {
      return data;
    }

    const transform = this.restConfig.transform.response;

    // Extract specific field
    if (transform.extract) {
      const fields = transform.extract.split(".");
      let result = data;
      for (const field of fields) {
        result = result?.[field];
      }
      return result;
    }

    // Apply field mapping
    if (transform.mapping) {
      return this.applyMapping(data, transform.mapping);
    }

    return data;
  }

  /**
   * Apply field mapping
   */
  private applyMapping(data: any, mapping: Record<string, string>): any {
    const result: any = {};

    for (const [targetField, sourceField] of Object.entries(mapping)) {
      const fields = sourceField.split(".");
      let value = data;
      for (const field of fields) {
        value = value?.[field];
      }
      result[targetField] = value;
    }

    return result;
  }

  /**
   * Apply template transformation
   */
  private applyTemplate(template: string, data: any): any {
    // Simple template replacement: {field.path}
    let result = template;
    const matches = template.match(/\{([^}]+)\}/g);

    if (matches) {
      for (const match of matches) {
        const field = match.slice(1, -1);
        const fields = field.split(".");
        let value = data;
        for (const f of fields) {
          value = value?.[f];
        }
        result = result.replace(match, String(value || ""));
      }
    }

    return JSON.parse(result);
  }
}

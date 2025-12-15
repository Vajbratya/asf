/**
 * S18 - Base Connector
 *
 * Abstract base class for all connectors in IntegraSaúde.
 * Provides standard interface, metrics collection, and retry logic.
 */

import { EventEmitter } from "events";
import pino from "pino";
import type {
  ConnectorConfig,
  ConnectorStatus,
  ConnectorMetrics,
  HealthCheckResult,
  RetryConfig,
  ConnectorMessage,
  ConnectorError,
} from "../types/connector.js";

export interface BaseConnectorConfig extends ConnectorConfig {
  retry?: RetryConfig;
}

export abstract class BaseConnector extends EventEmitter {
  protected config: BaseConnectorConfig;
  protected status: ConnectorStatus;
  protected metrics: ConnectorMetrics;
  protected logger: pino.Logger;
  protected retryConfig: RetryConfig;
  protected connectedAt?: Date;
  private metricsStartTime: number;

  constructor(config: BaseConnectorConfig) {
    super();
    this.config = config;
    this.status = "disconnected" as ConnectorStatus;
    this.logger = pino({
      name: `connector:${config.type}:${config.orgId}`,
      level: process.env.LOG_LEVEL || "info",
    });

    // Initialize metrics
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      connectionUptime: 0,
      averageLatency: 0,
    };

    // Default retry configuration
    this.retryConfig = config.retry || {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
    };

    this.metricsStartTime = Date.now();
  }

  /**
   * Connect to the remote system
   */
  abstract connect(): Promise<void>;

  /**
   * Send a message to the remote system
   */
  abstract send(message: ConnectorMessage): Promise<void>;

  /**
   * Disconnect from the remote system
   */
  abstract disconnect(): Promise<void>;

  /**
   * Health check implementation
   */
  async healthCheck(): Promise<HealthCheckResult> {
    // Update uptime if connected
    if (this.connectedAt) {
      this.metrics.connectionUptime = Date.now() - this.connectedAt.getTime();
    }

    return {
      healthy: this.status === "connected",
      status: this.status,
      message: this.getStatusMessage(),
      metrics: { ...this.metrics },
      timestamp: new Date(),
    };
  }

  /**
   * Get current connector status
   */
  getStatus(): ConnectorStatus {
    return this.status;
  }

  /**
   * Get current metrics
   */
  getMetrics(): ConnectorMetrics {
    return { ...this.metrics };
  }

  /**
   * Set connector status and emit event
   */
  protected setStatus(status: ConnectorStatus): void {
    const previousStatus = this.status;
    this.status = status;

    if (status === "connected" && previousStatus !== "connected") {
      this.connectedAt = new Date();
    } else if (status === "disconnected") {
      this.connectedAt = undefined;
    }

    this.emit("status-change", { from: previousStatus, to: status });
    this.logger.info({ status, previousStatus }, "Connector status changed");
  }

  /**
   * Record a sent message in metrics
   */
  protected recordMessageSent(): void {
    this.metrics.messagesSent++;
    this.metrics.lastMessageAt = new Date();
    this.emit("message-sent", { count: this.metrics.messagesSent });
  }

  /**
   * Record a received message in metrics
   */
  protected recordMessageReceived(): void {
    this.metrics.messagesReceived++;
    this.metrics.lastMessageAt = new Date();
    this.emit("message-received", { count: this.metrics.messagesReceived });
  }

  /**
   * Record an error in metrics
   */
  protected recordError(error: Error | ConnectorError): void {
    this.metrics.errors++;
    this.metrics.lastErrorAt = new Date();
    this.emit("error", error);
    this.logger.error({ err: error }, "Connector error recorded");
  }

  /**
   * Update average latency metric
   */
  protected recordLatency(latencyMs: number): void {
    // Exponential moving average
    const alpha = 0.2;
    this.metrics.averageLatency =
      alpha * latencyMs + (1 - alpha) * this.metrics.averageLatency;
  }

  /**
   * Retry logic with exponential backoff
   */
  protected async retry<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.info({ attempt, delay, context }, "Retrying operation");
          await this.sleep(delay);
          delay = Math.min(
            delay * this.retryConfig.backoffMultiplier,
            this.retryConfig.maxDelayMs,
          );
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          { attempt, error, context },
          "Operation failed, will retry",
        );

        // Don't retry if it's not a retryable error
        if (this.isConnectorError(error) && !error.retryable) {
          throw error;
        }

        // Don't retry if we've exhausted attempts
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }
      }
    }

    // All retries exhausted
    this.recordError(lastError!);
    throw lastError;
  }

  /**
   * Sleep utility for retry delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Type guard for ConnectorError
   */
  protected isConnectorError(error: unknown): error is ConnectorError {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "connector" in error &&
      "retryable" in error
    );
  }

  /**
   * Create a ConnectorError
   */
  protected createError(
    message: string,
    code: string,
    retryable: boolean = true,
    details?: Record<string, any>,
  ): ConnectorError {
    const error = new Error(message) as ConnectorError;
    error.code = code;
    error.connector = this.config.type;
    error.retryable = retryable;
    error.details = details;
    return error;
  }

  /**
   * Get human-readable status message
   */
  protected getStatusMessage(): string {
    switch (this.status) {
      case "connected":
        return `Connected to ${this.config.name}`;
      case "connecting":
        return `Connecting to ${this.config.name}...`;
      case "disconnected":
        return `Disconnected from ${this.config.name}`;
      case "error":
        return `Error connecting to ${this.config.name}`;
      default:
        return "Unknown status";
    }
  }

  /**
   * Validate configuration (to be overridden by subclasses)
   */
  protected validateConfig(): void {
    if (!this.config.orgId) {
      throw this.createError(
        "Organization ID is required",
        "INVALID_CONFIG",
        false,
      );
    }
    if (!this.config.name) {
      throw this.createError(
        "Connector name is required",
        "INVALID_CONFIG",
        false,
      );
    }
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    try {
      await this.disconnect();
      this.removeAllListeners();
      this.logger.info("Connector destroyed");
    } catch (error) {
      this.logger.error({ err: error }, "Error destroying connector");
      throw error;
    }
  }
}

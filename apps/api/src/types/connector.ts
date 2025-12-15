/**
 * Type definitions for IntegraSaúde connectors
 */

export interface ConnectorConfig {
  type: ConnectorType;
  orgId: string;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

export enum ConnectorType {
  GENERIC_HL7 = "generic-hl7",
  TASY = "tasy",
  MV_SOUL = "mv-soul",
  PIXEON = "pixeon",
  GENERIC_REST = "generic-rest",
}

export enum ConnectorStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}

export interface ConnectorMetrics {
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  lastMessageAt?: Date;
  lastErrorAt?: Date;
  connectionUptime: number;
  averageLatency: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  status: ConnectorStatus;
  message?: string;
  metrics: ConnectorMetrics;
  timestamp: Date;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface HL7Config {
  host: string;
  port: number;
  timeout: number;
  keepAlive: boolean;
  encoding: string;
  mllp: {
    startByte: number;
    endByte1: number;
    endByte2: number;
  };
  poolSize?: number;
}

export interface TasyConfig extends HL7Config {
  apiUrl?: string;
  apiKey?: string;
  enableZSegments: boolean;
  segments: {
    ZPD?: boolean; // Patient Data
    ZPV?: boolean; // Visit Data
    ZIN?: boolean; // Insurance Data
    ZOR?: boolean; // Order Data
  };
  tussMapping?: Record<string, string>;
}

export interface MVSoulConfig extends HL7Config {
  xmlEndpoint?: string;
  xmlFormat: "standard" | "custom";
  enableResultsIntegration: boolean;
}

export interface PixeonConfig extends HL7Config {
  dicomWeb: {
    baseUrl: string;
    qidoPath: string;
    wadoPath: string;
    stowPath: string;
  };
  auth?: {
    type: "basic" | "bearer" | "apikey";
    credentials: Record<string, string>;
  };
}

export interface RestAuthConfig {
  type: "apikey" | "oauth2" | "basic" | "bearer";
  apiKey?: {
    header: string;
    value: string;
  };
  basic?: {
    username: string;
    password: string;
  };
  bearer?: {
    token: string;
  };
  oauth2?: {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope?: string;
  };
}

export interface RestEndpointConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface RestTransformConfig {
  request?: {
    template?: string;
    mapping?: Record<string, string>;
  };
  response?: {
    mapping?: Record<string, string>;
    extract?: string;
  };
}

export interface GenericRestConfig {
  baseUrl: string;
  auth: RestAuthConfig;
  endpoints: {
    [key: string]: RestEndpointConfig;
  };
  transform?: RestTransformConfig;
  defaultTimeout: number;
  defaultRetries: number;
}

export interface ConnectorMessage {
  id: string;
  timestamp: Date;
  source: string;
  destination: string;
  type: string;
  payload: any;
  metadata?: Record<string, any>;
}

export interface ConnectorError extends Error {
  code: string;
  connector: string;
  retryable: boolean;
  details?: Record<string, any>;
}

import { z } from 'zod';
import * as schemas from './schemas';

// Organization types
export type Organization = z.infer<typeof schemas.organizationSchema>;
export type CreateOrganizationInput = z.infer<typeof schemas.createOrganizationSchema>;
export type OrganizationType = 'HOSPITAL' | 'CLINIC' | 'LAB' | 'PHARMACY' | 'OTHER';

// User types
export type User = z.infer<typeof schemas.userSchema>;
export type CreateUserInput = z.infer<typeof schemas.createUserSchema>;
export type UserRole = 'ADMIN' | 'USER' | 'VIEWER';

// Connector types
export type Connector = z.infer<typeof schemas.connectorSchema>;
export type CreateConnectorInput = z.infer<typeof schemas.createConnectorSchema>;
export type ConnectorType = 'FHIR_REST' | 'HL7_V2' | 'DICOM' | 'CUSTOM';
export type ConnectorStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING';

// Message types
export type Message = z.infer<typeof schemas.messageSchema>;
export type CreateMessageInput = z.infer<typeof schemas.createMessageSchema>;
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'RETRY';

// FHIR Resource types
export type FhirResource = z.infer<typeof schemas.fhirResourceSchema>;
export type CreateFhirResourceInput = z.infer<typeof schemas.createFhirResourceSchema>;

// FHIR Resource Type (subset of FHIR R4 resources)
export type FhirResourceType =
  | 'Patient'
  | 'Practitioner'
  | 'Organization'
  | 'Location'
  | 'Observation'
  | 'Condition'
  | 'Procedure'
  | 'MedicationRequest'
  | 'AllergyIntolerance'
  | 'Immunization'
  | 'DiagnosticReport'
  | 'Encounter'
  | 'Appointment'
  | 'CarePlan';

// Audit Log types
export type AuditLog = z.infer<typeof schemas.auditLogSchema>;
export type CreateAuditLogInput = z.infer<typeof schemas.createAuditLogSchema>;

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication types
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  organizationId?: string;
  role: UserRole;
}

// Job Queue types
export interface QueueJob {
  id: string;
  type: string;
  payload: unknown;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

// Cache types
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  ttl?: number;
}

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

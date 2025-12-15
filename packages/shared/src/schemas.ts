import { z } from 'zod';

// Organization schemas
export const organizationSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  cnpj: z.string().optional().nullable(),
  type: z.enum(['HOSPITAL', 'CLINIC', 'LAB', 'PHARMACY', 'OTHER']),
  metadata: z.record(z.unknown()).optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  cnpj: z.string().optional(),
  type: z.enum(['HOSPITAL', 'CLINIC', 'LAB', 'PHARMACY', 'OTHER']),
  metadata: z.record(z.unknown()).optional(),
});

// User schemas
export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'USER', 'VIEWER']),
  workosId: z.string().optional().nullable(),
  organizationId: z.string(),
  metadata: z.record(z.unknown()).optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'USER', 'VIEWER']).default('USER'),
  workosId: z.string().optional(),
  organizationId: z.string().cuid('Valid organization ID is required'),
  metadata: z.record(z.unknown()).optional(),
});

// Connector schemas
export const connectorSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  type: z.enum(['FHIR_REST', 'HL7_V2', 'DICOM', 'CUSTOM']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR', 'PENDING']),
  organizationId: z.string(),
  config: z.record(z.unknown()),
  credentials: z.record(z.unknown()).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  lastSyncAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createConnectorSchema = z.object({
  name: z.string().min(1, 'Connector name is required'),
  type: z.enum(['FHIR_REST', 'HL7_V2', 'DICOM', 'CUSTOM']),
  organizationId: z.string().cuid('Valid organization ID is required'),
  config: z.record(z.unknown()),
  credentials: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Message schemas
export const messageSchema = z.object({
  id: z.string().cuid(),
  connectorId: z.string(),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  status: z.enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'RETRY']),
  payload: z.record(z.unknown()),
  headers: z.record(z.unknown()).optional().nullable(),
  error: z.string().optional().nullable(),
  retryCount: z.number().int().min(0),
  processedAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createMessageSchema = z.object({
  connectorId: z.string().cuid('Valid connector ID is required'),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  payload: z.record(z.unknown()),
  headers: z.record(z.unknown()).optional(),
});

// FHIR Resource schemas
export const fhirResourceSchema = z.object({
  id: z.string().cuid(),
  connectorId: z.string(),
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  data: z.record(z.unknown()),
  version: z.number().int().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createFhirResourceSchema = z.object({
  connectorId: z.string().cuid('Valid connector ID is required'),
  resourceType: z.string().min(1, 'Resource type is required'),
  resourceId: z.string().min(1, 'Resource ID is required'),
  data: z.record(z.unknown()),
});

// Audit Log schemas
export const auditLogSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().optional().nullable(),
  action: z.string().min(1),
  resource: z.string().min(1),
  details: z.record(z.unknown()).optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  createdAt: z.date(),
});

export const createAuditLogSchema = z.object({
  userId: z.string().optional(),
  action: z.string().min(1, 'Action is required'),
  resource: z.string().min(1, 'Resource is required'),
  details: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// API Request/Response schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  field: z.string(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// FHIR-specific schemas
export const fhirBundleSchema = z.object({
  resourceType: z.literal('Bundle'),
  type: z.enum(['searchset', 'collection', 'transaction', 'batch']),
  total: z.number().optional(),
  entry: z
    .array(
      z.object({
        resource: z.record(z.unknown()),
        fullUrl: z.string().optional(),
      })
    )
    .optional(),
});

export const fhirPatientSchema = z.object({
  resourceType: z.literal('Patient'),
  id: z.string(),
  identifier: z
    .array(
      z.object({
        system: z.string().optional(),
        value: z.string(),
      })
    )
    .optional(),
  name: z
    .array(
      z.object({
        use: z.string().optional(),
        family: z.string().optional(),
        given: z.array(z.string()).optional(),
      })
    )
    .optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  birthDate: z.string().optional(),
});

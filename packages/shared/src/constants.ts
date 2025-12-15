// API Constants
export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

// Job retry configuration
export const JOB_RETRY = {
  MAX_ATTEMPTS: 3,
  BACKOFF_DELAY: 60000, // 1 minute in ms
};

// Session configuration
export const SESSION = {
  COOKIE_NAME: 'integrasaude-session',
  MAX_AGE: 7 * 24 * 60 * 60, // 7 days in seconds
};

// Rate limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
};

// FHIR Configuration
export const FHIR = {
  VERSION: '4.0.1',
  SUPPORTED_RESOURCES: [
    'Patient',
    'Practitioner',
    'Organization',
    'Location',
    'Observation',
    'Condition',
    'Procedure',
    'MedicationRequest',
    'AllergyIntolerance',
    'Immunization',
    'DiagnosticReport',
    'Encounter',
    'Appointment',
    'CarePlan',
  ] as const,
};

// Organization types
export const ORGANIZATION_TYPES = {
  HOSPITAL: 'Hospital',
  CLINIC: 'Clínica',
  LAB: 'Laboratório',
  PHARMACY: 'Farmácia',
  OTHER: 'Outro',
} as const;

// Connector types
export const CONNECTOR_TYPES = {
  FHIR_REST: 'FHIR REST API',
  HL7_V2: 'HL7 v2',
  DICOM: 'DICOM',
  CUSTOM: 'Custom Integration',
} as const;

// Message statuses
export const MESSAGE_STATUSES = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  SUCCESS: 'Sucesso',
  FAILED: 'Falhou',
  RETRY: 'Tentando novamente',
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'Administrator',
  USER: 'User',
  VIEWER: 'Viewer',
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

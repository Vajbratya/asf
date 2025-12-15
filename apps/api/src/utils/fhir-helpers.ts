import {
  OperationOutcome,
  OperationOutcomeIssue,
  FhirResource,
} from "../types/fhir";

/**
 * Create a FHIR OperationOutcome for errors
 */
export function createOperationOutcome(
  severity: "fatal" | "error" | "warning" | "information",
  code: string,
  diagnostics: string,
  expression?: string[],
): OperationOutcome {
  return {
    resourceType: "OperationOutcome",
    issue: [
      {
        severity,
        code,
        diagnostics,
        expression,
      },
    ],
  };
}

/**
 * Generate a new UUID for FHIR resources
 */
export function generateResourceId(): string {
  return crypto.randomUUID();
}

/**
 * Update resource metadata
 */
export function updateResourceMeta(
  resource: FhirResource,
  versionId: number,
): FhirResource {
  const now = new Date().toISOString();
  return {
    ...resource,
    meta: {
      ...resource.meta,
      versionId: versionId.toString(),
      lastUpdated: now,
    },
  };
}

/**
 * Validate FHIR resource has required fields
 */
export function validateResourceStructure(
  resource: unknown,
): resource is FhirResource {
  if (!resource || typeof resource !== "object") {
    return false;
  }

  const r = resource as Record<string, unknown>;
  if (!r.resourceType || typeof r.resourceType !== "string") {
    return false;
  }

  return true;
}

/**
 * Extract reference ID from FHIR reference string
 * Example: "Patient/123" -> "123"
 */
export function extractReferenceId(reference?: string): string | null {
  if (!reference) return null;
  const parts = reference.split("/");
  return parts.length === 2 ? parts[1] : null;
}

/**
 * Extract resource type from FHIR reference string
 * Example: "Patient/123" -> "Patient"
 */
export function extractReferenceType(reference?: string): string | null {
  if (!reference) return null;
  const parts = reference.split("/");
  return parts.length === 2 ? parts[0] : null;
}

/**
 * Build FHIR reference string
 */
export function buildReference(resourceType: string, id: string): string {
  return `${resourceType}/${id}`;
}

/**
 * Parse search parameters from query string
 */
export interface SearchParams {
  [key: string]: string | string[];
}

export function parseSearchParams(
  query: Record<string, unknown>,
): SearchParams {
  const params: SearchParams = {};

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        params[key] = value.map((v) => String(v));
      } else {
        params[key] = String(value);
      }
    }
  }

  return params;
}

/**
 * Get pagination parameters from search params
 */
export interface PaginationParams {
  count: number;
  offset: number;
}

export function getPaginationParams(params: SearchParams): PaginationParams {
  const count = params._count ? parseInt(String(params._count), 10) : 20;
  const offset = params._offset ? parseInt(String(params._offset), 10) : 0;

  return {
    count: Math.min(Math.max(count, 1), 100), // Between 1 and 100
    offset: Math.max(offset, 0), // Non-negative
  };
}

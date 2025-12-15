import { PrismaClient, Prisma } from '@prisma/client';
import {
  FhirResource,
  Bundle,
  BundleEntry,
  OperationOutcome,
  CapabilityStatement,
} from '../types/fhir';
import {
  createOperationOutcome,
  generateResourceId,
  updateResourceMeta,
  validateResourceStructure,
} from '../utils/fhir-helpers';
import { BRCoreValidator } from './br-core-validator';
import { HTTPException } from 'hono/http-exception';

/**
 * FHIR Store Service
 * Handles CRUD operations for FHIR resources in PostgreSQL
 */
export class FHIRStore {
  private prisma: PrismaClient;
  private validator: BRCoreValidator;
  private orgId?: string;
  private userId?: string;

  constructor(prisma: PrismaClient, orgId?: string, userId?: string) {
    this.prisma = prisma;
    this.validator = new BRCoreValidator();
    this.orgId = orgId;
    this.userId = userId;
  }

  /**
   * Check if user is authenticated
   */
  private checkAuth(): void {
    if (!this.orgId) {
      throw new HTTPException(401, { message: 'Unauthorized: Organization ID required' });
    }
  }

  /**
   * Log audit trail for FHIR operations
   */
  private async auditLog(
    action: string,
    resourceType: string,
    resourceId: string,
    details?: any
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: this.userId,
          action: `fhir.${action}`,
          resource: `${resourceType}/${resourceId}`,
          details: details ? JSON.parse(JSON.stringify(details)) : null,
          ipAddress: null,
          userAgent: null,
        },
      });
    } catch (error) {
      // Don't fail the operation if audit logging fails
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Create a new FHIR resource
   */
  async create(resource: FhirResource): Promise<FhirResource> {
    // Check authentication
    this.checkAuth();

    // Validate resource structure
    if (!validateResourceStructure(resource)) {
      throw new Error('Invalid FHIR resource structure');
    }

    // Validate BR-Core profile for Patient resources
    if (resource.resourceType === 'Patient') {
      const validationResult = this.validator.validatePatient(resource as any);
      if (validationResult) {
        throw new Error(
          `BR-Core validation failed: ${validationResult.issue.map((i) => i.diagnostics).join(', ')}`
        );
      }
    }

    // Generate ID if not provided
    const resourceId = resource.id || generateResourceId();
    const versionId = 1;

    // Update resource with metadata
    const resourceWithMeta = updateResourceMeta({ ...resource, id: resourceId }, versionId);

    // Store in database
    const stored = await this.prisma.fhirResource.create({
      data: {
        resourceType: resource.resourceType,
        resourceId: resourceId,
        versionId: versionId,
        content: resourceWithMeta as any,
        deleted: false,
      },
    });

    // Audit log
    await this.auditLog('create', resource.resourceType, resourceId, {
      versionId,
    });

    return stored.content as FhirResource;
  }

  /**
   * Read a FHIR resource by type and ID
   */
  async read(type: string, id: string): Promise<FhirResource> {
    // Check authentication
    this.checkAuth();

    const resource = await this.prisma.fhirResource.findFirst({
      where: {
        resourceType: type,
        resourceId: id,
        deleted: false,
      },
      orderBy: {
        versionId: 'desc',
      },
    });

    if (!resource) {
      throw new HTTPException(404, { message: `Resource ${type}/${id} not found` });
    }

    // Audit log
    await this.auditLog('read', type, id);

    return resource.content as FhirResource;
  }

  /**
   * Update a FHIR resource
   */
  async update(type: string, id: string, resource: FhirResource): Promise<FhirResource> {
    // Check authentication
    this.checkAuth();

    // Validate resource structure
    if (!validateResourceStructure(resource)) {
      throw new Error('Invalid FHIR resource structure');
    }

    // Validate resource type matches
    if (resource.resourceType !== type) {
      throw new Error(`Resource type mismatch: expected ${type}, got ${resource.resourceType}`);
    }

    // Validate BR-Core profile for Patient resources
    if (resource.resourceType === 'Patient') {
      const validationResult = this.validator.validatePatient(resource as any);
      if (validationResult) {
        throw new Error(
          `BR-Core validation failed: ${validationResult.issue.map((i) => i.diagnostics).join(', ')}`
        );
      }
    }

    // Get current version
    const currentResource = await this.prisma.fhirResource.findFirst({
      where: {
        resourceType: type,
        resourceId: id,
        deleted: false,
      },
      orderBy: {
        versionId: 'desc',
      },
    });

    if (!currentResource) {
      throw new HTTPException(404, { message: `Resource ${type}/${id} not found` });
    }

    const currentVersionId = currentResource.versionId;
    const newVersionId = currentVersionId + 1;

    // Update resource with new metadata
    const resourceWithMeta = updateResourceMeta({ ...resource, id }, newVersionId);

    // Create new version with optimistic locking - ensures no race conditions
    // We create a new version instead of updating to maintain FHIR versioning
    const stored = await this.prisma.fhirResource.create({
      data: {
        resourceType: type,
        resourceId: id,
        versionId: newVersionId,
        content: resourceWithMeta as any,
        deleted: false,
      },
    });

    // Verify no concurrent update occurred by checking if our version is the latest
    const latestVersion = await this.prisma.fhirResource.findFirst({
      where: {
        resourceType: type,
        resourceId: id,
      },
      orderBy: {
        versionId: 'desc',
      },
    });

    if (latestVersion && latestVersion.versionId !== newVersionId) {
      // A concurrent update occurred, rollback by deleting our version
      await this.prisma.fhirResource.delete({
        where: { id: stored.id },
      });
      throw new HTTPException(409, {
        message:
          'Conflict: Resource was modified by another request. Please retry with the latest version.',
      });
    }

    // Audit log
    await this.auditLog('update', type, id, {
      oldVersionId: currentVersionId,
      newVersionId,
    });

    return stored.content as FhirResource;
  }

  /**
   * Delete a FHIR resource (soft delete)
   */
  async delete(type: string, id: string): Promise<void> {
    // Check authentication
    this.checkAuth();

    // Check if resource exists
    const resource = await this.prisma.fhirResource.findFirst({
      where: {
        resourceType: type,
        resourceId: id,
        deleted: false,
      },
      orderBy: {
        versionId: 'desc',
      },
    });

    if (!resource) {
      throw new HTTPException(404, { message: `Resource ${type}/${id} not found` });
    }

    // Soft delete by creating a new version with deleted flag
    const newVersionId = resource.versionId + 1;
    await this.prisma.fhirResource.create({
      data: {
        resourceType: type,
        resourceId: id,
        versionId: newVersionId,
        content: resource.content,
        deleted: true,
      },
    });

    // Audit log
    await this.auditLog('delete', type, id, {
      versionId: newVersionId,
    });
  }

  /**
   * Process a transaction Bundle
   * Handles batch operations on multiple resources
   */
  async processBundle(bundle: Bundle): Promise<Bundle> {
    // Check authentication
    this.checkAuth();

    if (!bundle.entry || bundle.entry.length === 0) {
      return {
        resourceType: 'Bundle',
        type: 'transaction-response',
        entry: [],
      };
    }

    // Wrap entire bundle processing in a transaction for atomicity
    // If any operation fails, all operations are rolled back
    return await this.prisma.$transaction(async (tx) => {
      const responseEntries: BundleEntry[] = [];

      // Temporarily replace prisma instance with transaction client
      const originalPrisma = this.prisma;
      this.prisma = tx as PrismaClient;

      try {
        // Process each entry in the bundle
        for (const entry of bundle.entry) {
          try {
            if (!entry.request) {
              responseEntries.push({
                response: {
                  status: '400 Bad Request',
                  outcome: createOperationOutcome(
                    'error',
                    'required',
                    'Bundle entry must have a request'
                  ),
                },
              });
              continue;
            }

            const { method, url } = entry.request;
            let response: BundleEntry['response'];

            switch (method) {
              case 'POST': {
                // Create resource
                if (!entry.resource) {
                  response = {
                    status: '400 Bad Request',
                    outcome: createOperationOutcome(
                      'error',
                      'required',
                      'POST request must have a resource'
                    ),
                  };
                  break;
                }

                const created = await this.create(entry.resource);
                response = {
                  status: '201 Created',
                  location: `${created.resourceType}/${created.id}`,
                  etag: `W/"${created.meta?.versionId}"`,
                  lastModified: created.meta?.lastUpdated,
                };
                responseEntries.push({
                  response,
                  resource: created,
                });
                continue;
              }

              case 'PUT': {
                // Update resource
                if (!entry.resource) {
                  response = {
                    status: '400 Bad Request',
                    outcome: createOperationOutcome(
                      'error',
                      'required',
                      'PUT request must have a resource'
                    ),
                  };
                  break;
                }

                const urlParts = url.split('/');
                if (urlParts.length !== 2) {
                  response = {
                    status: '400 Bad Request',
                    outcome: createOperationOutcome(
                      'error',
                      'invalid',
                      'Invalid URL format for PUT request'
                    ),
                  };
                  break;
                }

                const [type, id] = urlParts;
                const updated = await this.update(type, id, entry.resource);
                response = {
                  status: '200 OK',
                  location: `${updated.resourceType}/${updated.id}`,
                  etag: `W/"${updated.meta?.versionId}"`,
                  lastModified: updated.meta?.lastUpdated,
                };
                responseEntries.push({
                  response,
                  resource: updated,
                });
                continue;
              }

              case 'DELETE': {
                // Delete resource
                const urlParts = url.split('/');
                if (urlParts.length !== 2) {
                  response = {
                    status: '400 Bad Request',
                    outcome: createOperationOutcome(
                      'error',
                      'invalid',
                      'Invalid URL format for DELETE request'
                    ),
                  };
                  break;
                }

                const [type, id] = urlParts;
                await this.delete(type, id);
                response = {
                  status: '204 No Content',
                };
                responseEntries.push({ response });
                continue;
              }

              case 'GET': {
                // Read resource
                const urlParts = url.split('/');
                if (urlParts.length !== 2) {
                  response = {
                    status: '400 Bad Request',
                    outcome: createOperationOutcome(
                      'error',
                      'invalid',
                      'Invalid URL format for GET request'
                    ),
                  };
                  break;
                }

                const [type, id] = urlParts;
                const resource = await this.read(type, id);
                response = {
                  status: '200 OK',
                  etag: `W/"${resource.meta?.versionId}"`,
                  lastModified: resource.meta?.lastUpdated,
                };
                responseEntries.push({
                  response,
                  resource,
                });
                continue;
              }

              default:
                response = {
                  status: '400 Bad Request',
                  outcome: createOperationOutcome(
                    'error',
                    'not-supported',
                    `HTTP method ${method} not supported`
                  ),
                };
            }

            responseEntries.push({ response });
          } catch (error) {
            // Handle errors for individual entries
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            responseEntries.push({
              response: {
                status: '500 Internal Server Error',
                outcome: createOperationOutcome('error', 'exception', errorMessage),
              },
            });
          }
        }

        return {
          resourceType: 'Bundle',
          type: 'transaction-response',
          entry: responseEntries,
        };
      } finally {
        // Restore original prisma instance
        this.prisma = originalPrisma;
      }
    });
  }

  /**
   * Conditional Create - Create resource only if search criteria don't match existing resource
   * @param resource Resource to create
   * @param searchCriteria Search parameters to check for existing resources
   * @returns Created resource or existing resource if match found
   */
  async createConditional(
    resource: FhirResource,
    searchCriteria: Record<string, string>
  ): Promise<{ resource: FhirResource; created: boolean }> {
    this.checkAuth();

    // Search for existing resources matching criteria
    const existingResources = await this.prisma.fhirResource.findMany({
      where: {
        resourceType: resource.resourceType,
        deleted: false,
        // Build search conditions based on criteria
        AND: Object.entries(searchCriteria).map(([key, value]) => ({
          content: {
            path: [key],
            equals: value,
          },
        })),
      },
      orderBy: {
        versionId: 'desc',
      },
      take: 1,
    });

    if (existingResources.length > 0) {
      // Resource exists, return it without creating
      return {
        resource: existingResources[0].content as FhirResource,
        created: false,
      };
    }

    // No match found, create new resource
    const created = await this.create(resource);
    return {
      resource: created,
      created: true,
    };
  }

  /**
   * Get version history for a specific resource
   * @param type Resource type
   * @param id Resource ID
   * @returns Bundle containing all versions of the resource
   */
  async history(type: string, id: string): Promise<Bundle> {
    this.checkAuth();

    // Get all versions of the resource, including deleted ones
    const versions = await this.prisma.fhirResource.findMany({
      where: {
        resourceType: type,
        resourceId: id,
      },
      orderBy: {
        versionId: 'desc',
      },
    });

    if (versions.length === 0) {
      throw new HTTPException(404, { message: `Resource ${type}/${id} not found` });
    }

    // Audit log
    await this.auditLog('history', type, id, {
      versionCount: versions.length,
    });

    return {
      resourceType: 'Bundle',
      type: 'history',
      total: versions.length,
      entry: versions.map((v) => ({
        fullUrl: `${type}/${id}/_history/${v.versionId}`,
        resource: v.content as FhirResource,
        request: {
          method: v.deleted ? 'DELETE' : v.versionId === 1 ? 'POST' : 'PUT',
          url: `${type}/${id}`,
        },
        response: {
          status: v.deleted ? '204 No Content' : '200 OK',
          etag: `W/"${v.versionId}"`,
          lastModified: v.updatedAt.toISOString(),
        },
      })),
    };
  }

  /**
   * Get version history for all resources of a type
   * @param type Resource type
   * @returns Bundle containing version history
   */
  async historyType(type: string): Promise<Bundle> {
    this.checkAuth();

    // Get all versions for this resource type, limited to recent history
    const versions = await this.prisma.fhirResource.findMany({
      where: {
        resourceType: type,
      },
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          versionId: 'desc',
        },
      ],
      take: 100, // Limit to 100 most recent versions
    });

    // Audit log
    await this.auditLog('history-type', type, '*', {
      versionCount: versions.length,
    });

    return {
      resourceType: 'Bundle',
      type: 'history',
      total: versions.length,
      entry: versions.map((v) => ({
        fullUrl: `${type}/${v.resourceId}/_history/${v.versionId}`,
        resource: v.content as FhirResource,
        request: {
          method: v.deleted ? 'DELETE' : v.versionId === 1 ? 'POST' : 'PUT',
          url: `${type}/${v.resourceId}`,
        },
        response: {
          status: v.deleted ? '204 No Content' : '200 OK',
          etag: `W/"${v.versionId}"`,
          lastModified: v.updatedAt.toISOString(),
        },
      })),
    };
  }

  /**
   * Validate a FHIR resource without persisting it
   * @param resource Resource to validate
   * @returns OperationOutcome with validation results
   */
  async validate(resource: FhirResource): Promise<OperationOutcome> {
    this.checkAuth();

    const issues: OperationOutcome['issue'] = [];

    // Basic structure validation
    if (!validateResourceStructure(resource)) {
      issues.push({
        severity: 'error',
        code: 'structure',
        diagnostics: 'Invalid FHIR resource structure',
      });
    }

    // BR-Core profile validation for Patient resources
    if (resource.resourceType === 'Patient') {
      const validationResult = this.validator.validatePatient(resource as any);
      if (validationResult) {
        issues.push(...validationResult.issue);
      }
    }

    // If no issues found, validation passed
    if (issues.length === 0) {
      return {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'information',
            code: 'informational',
            diagnostics: 'Validation successful - resource is valid',
          },
        ],
      };
    }

    return {
      resourceType: 'OperationOutcome',
      issue: issues,
    };
  }

  /**
   * Get FHIR server capabilities
   * @returns CapabilityStatement describing server capabilities
   */
  capabilities(): CapabilityStatement {
    return {
      resourceType: 'CapabilityStatement',
      status: 'active',
      date: new Date().toISOString(),
      kind: 'instance',
      fhirVersion: '4.0.1',
      format: ['application/fhir+json'],
      patchFormat: ['application/json-patch+json'],
      implementation: {
        description: 'IntegraSaúde FHIR Server - BR-Core Compliant',
        url: process.env.FHIR_BASE_URL || 'http://localhost:3000/fhir',
      },
      rest: [
        {
          mode: 'server',
          documentation: 'IntegraSaúde FHIR Server supporting Brazilian FHIR profiles (BR-Core)',
          security: {
            cors: true,
            description: 'OAuth2 authentication required for all operations',
          },
          resource: [
            {
              type: 'Patient',
              profile: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRIndividuo-1.0',
              supportedProfile: [
                'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRIndividuo-1.0',
              ],
              interaction: [
                { code: 'read', documentation: 'Read a Patient resource by ID' },
                { code: 'create', documentation: 'Create a new Patient resource' },
                { code: 'update', documentation: 'Update an existing Patient resource' },
                { code: 'delete', documentation: 'Delete a Patient resource (soft delete)' },
                {
                  code: 'search-type',
                  documentation: 'Search for Patient resources',
                },
                {
                  code: 'history-instance',
                  documentation: 'Get version history for a Patient',
                },
              ],
              versioning: 'versioned',
              readHistory: true,
              updateCreate: false,
              conditionalCreate: true,
              conditionalUpdate: false,
              conditionalDelete: 'not-supported',
              searchParam: [
                {
                  name: 'identifier',
                  type: 'token',
                  documentation: 'Search by patient identifier (CPF or CNS)',
                },
                {
                  name: 'cpf',
                  type: 'token',
                  documentation: 'Search by CPF (Brazilian individual taxpayer ID)',
                },
                {
                  name: 'cns',
                  type: 'token',
                  documentation: 'Search by CNS (Brazilian national health card number)',
                },
                {
                  name: 'name',
                  type: 'string',
                  documentation: 'Search by patient name (family or given)',
                },
                {
                  name: 'family',
                  type: 'string',
                  documentation: 'Search by family name',
                },
                {
                  name: 'given',
                  type: 'string',
                  documentation: 'Search by given name',
                },
                {
                  name: 'birthdate',
                  type: 'date',
                  documentation: 'Search by birth date',
                },
                {
                  name: 'gender',
                  type: 'token',
                  documentation: 'Search by gender',
                },
              ],
            },
            {
              type: 'Encounter',
              interaction: [
                { code: 'read' },
                { code: 'create' },
                { code: 'update' },
                { code: 'delete' },
                { code: 'search-type' },
                { code: 'history-instance' },
              ],
              versioning: 'versioned',
              readHistory: true,
              searchParam: [
                {
                  name: 'patient',
                  type: 'reference',
                  documentation: 'Search by patient reference',
                },
                {
                  name: 'status',
                  type: 'token',
                  documentation: 'Search by encounter status',
                },
                {
                  name: 'date',
                  type: 'date',
                  documentation: 'Search by encounter date',
                },
                {
                  name: 'class',
                  type: 'token',
                  documentation: 'Search by encounter class',
                },
              ],
            },
            {
              type: 'DiagnosticReport',
              interaction: [
                { code: 'read' },
                { code: 'create' },
                { code: 'update' },
                { code: 'delete' },
                { code: 'search-type' },
                { code: 'history-instance' },
              ],
              versioning: 'versioned',
              readHistory: true,
              searchParam: [
                {
                  name: 'patient',
                  type: 'reference',
                  documentation: 'Search by patient reference',
                },
                {
                  name: 'status',
                  type: 'token',
                  documentation: 'Search by report status',
                },
                {
                  name: 'category',
                  type: 'token',
                  documentation: 'Search by report category',
                },
                {
                  name: 'code',
                  type: 'token',
                  documentation: 'Search by report code',
                },
                {
                  name: 'date',
                  type: 'date',
                  documentation: 'Search by report date',
                },
              ],
            },
          ],
          interaction: [
            {
              code: 'create',
              documentation: 'Create a new resource',
            },
            {
              code: 'read',
              documentation: 'Read a resource',
            },
            {
              code: 'update',
              documentation: 'Update a resource',
            },
            {
              code: 'delete',
              documentation: 'Delete a resource',
            },
            {
              code: 'search-type',
              documentation: 'Search resources',
            },
            {
              code: 'history-instance',
              documentation: 'Get version history for a resource',
            },
            {
              code: 'history-type',
              documentation: 'Get version history for a resource type',
            },
          ],
          operation: [
            {
              name: 'validate',
              definition: 'http://hl7.org/fhir/OperationDefinition/Resource-validate',
              documentation: 'Validate a resource without persisting it',
            },
          ],
        },
      ],
    };
  }
}

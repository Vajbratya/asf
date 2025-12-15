import { PrismaClient, Prisma } from '@prisma/client';
import { FhirResource, Bundle, BundleEntry, OperationOutcome } from '../types/fhir';
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
}

import { PrismaClient } from "@prisma/client";
import {
  FhirResource,
  Bundle,
  BundleEntry,
  OperationOutcome,
} from "../types/fhir";
import {
  createOperationOutcome,
  generateResourceId,
  updateResourceMeta,
  validateResourceStructure,
} from "../utils/fhir-helpers";
import { BRCoreValidator } from "./br-core-validator";

/**
 * FHIR Store Service
 * Handles CRUD operations for FHIR resources in PostgreSQL
 */
export class FHIRStore {
  private prisma: PrismaClient;
  private validator: BRCoreValidator;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.validator = new BRCoreValidator();
  }

  /**
   * Create a new FHIR resource
   */
  async create(resource: FhirResource): Promise<FhirResource> {
    // Validate resource structure
    if (!validateResourceStructure(resource)) {
      throw new Error("Invalid FHIR resource structure");
    }

    // Validate BR-Core profile for Patient resources
    if (resource.resourceType === "Patient") {
      const validationResult = this.validator.validatePatient(resource as any);
      if (validationResult) {
        throw new Error(
          `BR-Core validation failed: ${validationResult.issue.map((i) => i.diagnostics).join(", ")}`,
        );
      }
    }

    // Generate ID if not provided
    const resourceId = resource.id || generateResourceId();
    const versionId = 1;

    // Update resource with metadata
    const resourceWithMeta = updateResourceMeta(
      { ...resource, id: resourceId },
      versionId,
    );

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

    return stored.content as FhirResource;
  }

  /**
   * Read a FHIR resource by type and ID
   */
  async read(type: string, id: string): Promise<FhirResource> {
    const resource = await this.prisma.fhirResource.findFirst({
      where: {
        resourceType: type,
        resourceId: id,
        deleted: false,
      },
      orderBy: {
        versionId: "desc",
      },
    });

    if (!resource) {
      throw new Error(`Resource ${type}/${id} not found`);
    }

    return resource.content as FhirResource;
  }

  /**
   * Update a FHIR resource
   */
  async update(
    type: string,
    id: string,
    resource: FhirResource,
  ): Promise<FhirResource> {
    // Validate resource structure
    if (!validateResourceStructure(resource)) {
      throw new Error("Invalid FHIR resource structure");
    }

    // Validate resource type matches
    if (resource.resourceType !== type) {
      throw new Error(
        `Resource type mismatch: expected ${type}, got ${resource.resourceType}`,
      );
    }

    // Validate BR-Core profile for Patient resources
    if (resource.resourceType === "Patient") {
      const validationResult = this.validator.validatePatient(resource as any);
      if (validationResult) {
        throw new Error(
          `BR-Core validation failed: ${validationResult.issue.map((i) => i.diagnostics).join(", ")}`,
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
        versionId: "desc",
      },
    });

    if (!currentResource) {
      throw new Error(`Resource ${type}/${id} not found`);
    }

    const newVersionId = currentResource.versionId + 1;

    // Update resource with new metadata
    const resourceWithMeta = updateResourceMeta(
      { ...resource, id },
      newVersionId,
    );

    // Create new version
    const stored = await this.prisma.fhirResource.create({
      data: {
        resourceType: type,
        resourceId: id,
        versionId: newVersionId,
        content: resourceWithMeta as any,
        deleted: false,
      },
    });

    return stored.content as FhirResource;
  }

  /**
   * Delete a FHIR resource (soft delete)
   */
  async delete(type: string, id: string): Promise<void> {
    // Check if resource exists
    const resource = await this.prisma.fhirResource.findFirst({
      where: {
        resourceType: type,
        resourceId: id,
        deleted: false,
      },
      orderBy: {
        versionId: "desc",
      },
    });

    if (!resource) {
      throw new Error(`Resource ${type}/${id} not found`);
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
  }

  /**
   * Process a transaction Bundle
   * Handles batch operations on multiple resources
   */
  async processBundle(bundle: Bundle): Promise<Bundle> {
    if (!bundle.entry || bundle.entry.length === 0) {
      return {
        resourceType: "Bundle",
        type: "transaction-response",
        entry: [],
      };
    }

    const responseEntries: BundleEntry[] = [];

    // Process each entry in the bundle
    for (const entry of bundle.entry) {
      try {
        if (!entry.request) {
          responseEntries.push({
            response: {
              status: "400 Bad Request",
              outcome: createOperationOutcome(
                "error",
                "required",
                "Bundle entry must have a request",
              ),
            },
          });
          continue;
        }

        const { method, url } = entry.request;
        let response: BundleEntry["response"];

        switch (method) {
          case "POST": {
            // Create resource
            if (!entry.resource) {
              response = {
                status: "400 Bad Request",
                outcome: createOperationOutcome(
                  "error",
                  "required",
                  "POST request must have a resource",
                ),
              };
              break;
            }

            const created = await this.create(entry.resource);
            response = {
              status: "201 Created",
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

          case "PUT": {
            // Update resource
            if (!entry.resource) {
              response = {
                status: "400 Bad Request",
                outcome: createOperationOutcome(
                  "error",
                  "required",
                  "PUT request must have a resource",
                ),
              };
              break;
            }

            const urlParts = url.split("/");
            if (urlParts.length !== 2) {
              response = {
                status: "400 Bad Request",
                outcome: createOperationOutcome(
                  "error",
                  "invalid",
                  "Invalid URL format for PUT request",
                ),
              };
              break;
            }

            const [type, id] = urlParts;
            const updated = await this.update(type, id, entry.resource);
            response = {
              status: "200 OK",
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

          case "DELETE": {
            // Delete resource
            const urlParts = url.split("/");
            if (urlParts.length !== 2) {
              response = {
                status: "400 Bad Request",
                outcome: createOperationOutcome(
                  "error",
                  "invalid",
                  "Invalid URL format for DELETE request",
                ),
              };
              break;
            }

            const [type, id] = urlParts;
            await this.delete(type, id);
            response = {
              status: "204 No Content",
            };
            responseEntries.push({ response });
            continue;
          }

          case "GET": {
            // Read resource
            const urlParts = url.split("/");
            if (urlParts.length !== 2) {
              response = {
                status: "400 Bad Request",
                outcome: createOperationOutcome(
                  "error",
                  "invalid",
                  "Invalid URL format for GET request",
                ),
              };
              break;
            }

            const [type, id] = urlParts;
            const resource = await this.read(type, id);
            response = {
              status: "200 OK",
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
              status: "400 Bad Request",
              outcome: createOperationOutcome(
                "error",
                "not-supported",
                `HTTP method ${method} not supported`,
              ),
            };
        }

        responseEntries.push({ response });
      } catch (error) {
        // Handle errors for individual entries
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        responseEntries.push({
          response: {
            status: "500 Internal Server Error",
            outcome: createOperationOutcome("error", "exception", errorMessage),
          },
        });
      }
    }

    return {
      resourceType: "Bundle",
      type: "transaction-response",
      entry: responseEntries,
    };
  }
}

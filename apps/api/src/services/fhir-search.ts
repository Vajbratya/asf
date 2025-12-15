import { PrismaClient, Prisma } from "@prisma/client";
import { FhirResource, Bundle } from "../types/fhir";
import { SearchParams, getPaginationParams } from "../utils/fhir-helpers";

/**
 * FHIR Search Service
 * Handles FHIR search operations using JSONB queries
 */
export class FHIRSearch {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Search for FHIR resources by resource type and search parameters
   */
  async search(
    resourceType: string,
    searchParams: SearchParams,
  ): Promise<Bundle> {
    const { count, offset } = getPaginationParams(searchParams);

    // Build search conditions based on resource type
    const conditions = this.buildSearchConditions(resourceType, searchParams);

    // Execute search
    const [resources, total] = await Promise.all([
      this.prisma.fhirResource.findMany({
        where: {
          resourceType,
          deleted: false,
          ...conditions,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: count,
      }),
      this.prisma.fhirResource.count({
        where: {
          resourceType,
          deleted: false,
          ...conditions,
        },
      }),
    ]);

    // Handle _include parameter for references
    const includedResources = await this.handleInclude(
      resources,
      searchParams._include as string | undefined,
    );

    // Build Bundle response
    const entries = [
      ...resources.map((r) => ({
        fullUrl: `${r.resourceType}/${r.resourceId}`,
        resource: r.content as FhirResource,
        search: { mode: "match" as const },
      })),
      ...includedResources.map((r) => ({
        fullUrl: `${r.resourceType}/${r.resourceId}`,
        resource: r.content as FhirResource,
        search: { mode: "include" as const },
      })),
    ];

    return {
      resourceType: "Bundle",
      type: "searchset",
      total,
      entry: entries,
    };
  }

  /**
   * Build search conditions based on resource type and search parameters
   */
  private buildSearchConditions(
    resourceType: string,
    searchParams: SearchParams,
  ): Prisma.FhirResourceWhereInput {
    switch (resourceType) {
      case "Patient":
        return this.buildPatientSearch(searchParams);
      case "Encounter":
        return this.buildEncounterSearch(searchParams);
      case "DiagnosticReport":
        return this.buildDiagnosticReportSearch(searchParams);
      default:
        return {};
    }
  }

  /**
   * Build search conditions for Patient resources
   */
  private buildPatientSearch(
    searchParams: SearchParams,
  ): Prisma.FhirResourceWhereInput {
    const conditions: Prisma.FhirResourceWhereInput = {};
    const contentConditions: any[] = [];

    // Search by identifier (CPF or CNS)
    if (searchParams.identifier) {
      const identifier = String(searchParams.identifier);
      contentConditions.push({
        path: ["identifier"],
        array_contains: [
          {
            value: identifier,
          },
        ],
      });
    }

    // Search by CPF specifically
    if (searchParams.cpf) {
      const cpf = String(searchParams.cpf);
      contentConditions.push({
        path: ["identifier"],
        array_contains: [
          {
            system: "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
            value: cpf,
          },
        ],
      });
    }

    // Search by CNS specifically
    if (searchParams.cns) {
      const cns = String(searchParams.cns);
      contentConditions.push({
        path: ["identifier"],
        array_contains: [
          {
            system: "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns",
            value: cns,
          },
        ],
      });
    }

    // Search by name
    if (searchParams.name) {
      const name = String(searchParams.name).toLowerCase();
      contentConditions.push(
        Prisma.sql`content->'name' @> '[{"family": "${Prisma.raw(name)}"}]'::jsonb OR content->'name' @> '[{"given": ["${Prisma.raw(name)}"]}]'::jsonb`,
      );
    }

    // Search by family name
    if (searchParams.family) {
      const family = String(searchParams.family);
      contentConditions.push({
        path: ["name"],
        array_contains: [
          {
            family,
          },
        ],
      });
    }

    // Search by given name
    if (searchParams.given) {
      const given = String(searchParams.given);
      contentConditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM jsonb_array_elements(content->'name') AS name WHERE name->'given' @> '["${Prisma.raw(given)}"]'::jsonb)`,
      );
    }

    // Search by birthDate
    if (searchParams.birthdate) {
      const birthdate = String(searchParams.birthdate);
      contentConditions.push({
        path: ["birthDate"],
        equals: birthdate,
      });
    }

    // Search by gender
    if (searchParams.gender) {
      const gender = String(searchParams.gender);
      contentConditions.push({
        path: ["gender"],
        equals: gender,
      });
    }

    // Apply content conditions if any
    if (contentConditions.length > 0) {
      conditions.AND = contentConditions.map((cond) => ({
        content: cond,
      }));
    }

    return conditions;
  }

  /**
   * Build search conditions for Encounter resources
   */
  private buildEncounterSearch(
    searchParams: SearchParams,
  ): Prisma.FhirResourceWhereInput {
    const conditions: Prisma.FhirResourceWhereInput = {};
    const contentConditions: any[] = [];

    // Search by patient reference
    if (searchParams.patient) {
      const patient = String(searchParams.patient);
      contentConditions.push(
        Prisma.sql`content->'subject'->>'reference' = '${Prisma.raw(patient)}'`,
      );
    }

    // Search by status
    if (searchParams.status) {
      const status = String(searchParams.status);
      contentConditions.push({
        path: ["status"],
        equals: status,
      });
    }

    // Search by date (period.start)
    if (searchParams.date) {
      const date = String(searchParams.date);
      // Support date ranges with ge (greater or equal) and le (less or equal)
      if (date.startsWith("ge")) {
        const dateValue = date.substring(2);
        contentConditions.push(
          Prisma.sql`content->'period'->>'start' >= '${Prisma.raw(dateValue)}'`,
        );
      } else if (date.startsWith("le")) {
        const dateValue = date.substring(2);
        contentConditions.push(
          Prisma.sql`content->'period'->>'start' <= '${Prisma.raw(dateValue)}'`,
        );
      } else {
        contentConditions.push(
          Prisma.sql`content->'period'->>'start' = '${Prisma.raw(date)}'`,
        );
      }
    }

    // Search by class
    if (searchParams.class) {
      const classCode = String(searchParams.class);
      contentConditions.push(
        Prisma.sql`content->'class'->>'code' = '${Prisma.raw(classCode)}'`,
      );
    }

    // Apply content conditions if any
    if (contentConditions.length > 0) {
      conditions.AND = contentConditions.map((cond) => ({
        content: cond,
      }));
    }

    return conditions;
  }

  /**
   * Build search conditions for DiagnosticReport resources
   */
  private buildDiagnosticReportSearch(
    searchParams: SearchParams,
  ): Prisma.FhirResourceWhereInput {
    const conditions: Prisma.FhirResourceWhereInput = {};
    const contentConditions: any[] = [];

    // Search by patient reference
    if (searchParams.patient) {
      const patient = String(searchParams.patient);
      contentConditions.push(
        Prisma.sql`content->'subject'->>'reference' = '${Prisma.raw(patient)}'`,
      );
    }

    // Search by status
    if (searchParams.status) {
      const status = String(searchParams.status);
      contentConditions.push({
        path: ["status"],
        equals: status,
      });
    }

    // Search by category
    if (searchParams.category) {
      const category = String(searchParams.category);
      contentConditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM jsonb_array_elements(content->'category') AS cat WHERE cat->'coding' @> '[{"code": "${Prisma.raw(category)}"}]'::jsonb)`,
      );
    }

    // Search by code
    if (searchParams.code) {
      const code = String(searchParams.code);
      contentConditions.push(
        Prisma.sql`content->'code'->'coding' @> '[{"code": "${Prisma.raw(code)}"}]'::jsonb`,
      );
    }

    // Search by date (issued or effectiveDateTime)
    if (searchParams.date) {
      const date = String(searchParams.date);
      if (date.startsWith("ge")) {
        const dateValue = date.substring(2);
        contentConditions.push(
          Prisma.sql`(content->>'issued' >= '${Prisma.raw(dateValue)}' OR content->>'effectiveDateTime' >= '${Prisma.raw(dateValue)}')`,
        );
      } else if (date.startsWith("le")) {
        const dateValue = date.substring(2);
        contentConditions.push(
          Prisma.sql`(content->>'issued' <= '${Prisma.raw(dateValue)}' OR content->>'effectiveDateTime' <= '${Prisma.raw(dateValue)}')`,
        );
      } else {
        contentConditions.push(
          Prisma.sql`(content->>'issued' = '${Prisma.raw(date)}' OR content->>'effectiveDateTime' = '${Prisma.raw(date)}')`,
        );
      }
    }

    // Apply content conditions if any
    if (contentConditions.length > 0) {
      conditions.AND = contentConditions.map((cond) => ({
        content: cond,
      }));
    }

    return conditions;
  }

  /**
   * Handle _include parameter to fetch referenced resources
   */
  private async handleInclude(
    resources: any[],
    include?: string,
  ): Promise<any[]> {
    if (!include) {
      return [];
    }

    const includedResources: any[] = [];
    const references = new Set<string>();

    // Extract references from resources based on include parameter
    for (const resource of resources) {
      const content = resource.content as FhirResource;

      // Parse include parameter (e.g., "Encounter:patient", "DiagnosticReport:subject")
      const [sourceType, field] = include.split(":");

      if (content.resourceType === sourceType) {
        const reference = this.extractReference(content, field);
        if (reference) {
          references.add(reference);
        }
      }
    }

    // Fetch referenced resources
    for (const reference of references) {
      const [type, id] = reference.split("/");
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

      if (resource) {
        includedResources.push(resource);
      }
    }

    return includedResources;
  }

  /**
   * Extract reference value from a resource
   */
  private extractReference(resource: any, field: string): string | null {
    const fieldValue = resource[field];
    if (fieldValue && typeof fieldValue === "object" && fieldValue.reference) {
      return fieldValue.reference;
    }
    return null;
  }
}

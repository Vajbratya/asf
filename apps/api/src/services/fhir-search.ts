import { PrismaClient, Prisma } from '@prisma/client';
import { FhirResource, Bundle } from '../types/fhir';
import { SearchParams, getPaginationParams } from '../utils/fhir-helpers';
import { HTTPException } from 'hono/http-exception';

/**
 * FHIR Search Service
 * Handles FHIR search operations using JSONB queries
 */
export class FHIRSearch {
  private prisma: PrismaClient;
  private orgId?: string;

  constructor(prisma: PrismaClient, orgId?: string) {
    this.prisma = prisma;
    this.orgId = orgId;
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
   * Search for FHIR resources by resource type and search parameters
   */
  async search(resourceType: string, searchParams: SearchParams): Promise<Bundle> {
    // Check authentication
    this.checkAuth();

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
          createdAt: 'desc',
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
      searchParams._include as string | undefined
    );

    // Build Bundle response
    const entries = [
      ...resources.map((r) => ({
        fullUrl: `${r.resourceType}/${r.resourceId}`,
        resource: r.content as FhirResource,
        search: { mode: 'match' as const },
      })),
      ...includedResources.map((r) => ({
        fullUrl: `${r.resourceType}/${r.resourceId}`,
        resource: r.content as FhirResource,
        search: { mode: 'include' as const },
      })),
    ];

    return {
      resourceType: 'Bundle',
      type: 'searchset',
      total,
      entry: entries,
    };
  }

  /**
   * Build search conditions based on resource type and search parameters
   */
  private buildSearchConditions(
    resourceType: string,
    searchParams: SearchParams
  ): Prisma.FhirResourceWhereInput {
    switch (resourceType) {
      case 'Patient':
        return this.buildPatientSearch(searchParams);
      case 'Encounter':
        return this.buildEncounterSearch(searchParams);
      case 'DiagnosticReport':
        return this.buildDiagnosticReportSearch(searchParams);
      default:
        return {};
    }
  }

  /**
   * Build search conditions for Patient resources
   */
  private buildPatientSearch(searchParams: SearchParams): Prisma.FhirResourceWhereInput {
    const conditions: Prisma.FhirResourceWhereInput = {};
    const contentConditions: any[] = [];

    // Search by identifier (CPF or CNS)
    if (searchParams.identifier) {
      const identifier = String(searchParams.identifier);
      contentConditions.push({
        path: ['identifier'],
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
        path: ['identifier'],
        array_contains: [
          {
            system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
            value: cpf,
          },
        ],
      });
    }

    // Search by CNS specifically
    if (searchParams.cns) {
      const cns = String(searchParams.cns);
      contentConditions.push({
        path: ['identifier'],
        array_contains: [
          {
            system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
            value: cns,
          },
        ],
      });
    }

    // Search by name (using parameterized queries instead of raw SQL)
    if (searchParams.name) {
      const name = String(searchParams.name).toLowerCase();
      // Use OR condition for family or given name
      contentConditions.push({
        OR: [
          {
            path: ['name'],
            array_contains: [{ family: name }],
          },
          {
            path: ['name'],
            array_contains: [{ given: [name] }],
          },
        ],
      });
    }

    // Search by family name
    if (searchParams.family) {
      const family = String(searchParams.family);
      contentConditions.push({
        path: ['name'],
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
      contentConditions.push({
        path: ['name'],
        array_contains: [
          {
            given: [given],
          },
        ],
      });
    }

    // Search by birthDate
    if (searchParams.birthdate) {
      const birthdate = String(searchParams.birthdate);
      contentConditions.push({
        path: ['birthDate'],
        equals: birthdate,
      });
    }

    // Search by gender
    if (searchParams.gender) {
      const gender = String(searchParams.gender);
      contentConditions.push({
        path: ['gender'],
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
  private buildEncounterSearch(searchParams: SearchParams): Prisma.FhirResourceWhereInput {
    const conditions: Prisma.FhirResourceWhereInput = {};
    const contentConditions: any[] = [];

    // Search by patient reference (using parameterized queries)
    if (searchParams.patient) {
      const patient = String(searchParams.patient);
      contentConditions.push({
        path: ['subject', 'reference'],
        equals: patient,
      });
    }

    // Search by status
    if (searchParams.status) {
      const status = String(searchParams.status);
      contentConditions.push({
        path: ['status'],
        equals: status,
      });
    }

    // Search by date (period.start) using safe comparison
    if (searchParams.date) {
      const date = String(searchParams.date);
      // Support date ranges with ge (greater or equal) and le (less or equal)
      if (date.startsWith('ge')) {
        const dateValue = date.substring(2);
        contentConditions.push({
          path: ['period', 'start'],
          gte: dateValue,
        });
      } else if (date.startsWith('le')) {
        const dateValue = date.substring(2);
        contentConditions.push({
          path: ['period', 'start'],
          lte: dateValue,
        });
      } else {
        contentConditions.push({
          path: ['period', 'start'],
          equals: date,
        });
      }
    }

    // Search by class (using parameterized queries)
    if (searchParams.class) {
      const classCode = String(searchParams.class);
      contentConditions.push({
        path: ['class', 'code'],
        equals: classCode,
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
   * Build search conditions for DiagnosticReport resources
   */
  private buildDiagnosticReportSearch(searchParams: SearchParams): Prisma.FhirResourceWhereInput {
    const conditions: Prisma.FhirResourceWhereInput = {};
    const contentConditions: any[] = [];

    // Search by patient reference (using parameterized queries)
    if (searchParams.patient) {
      const patient = String(searchParams.patient);
      contentConditions.push({
        path: ['subject', 'reference'],
        equals: patient,
      });
    }

    // Search by status
    if (searchParams.status) {
      const status = String(searchParams.status);
      contentConditions.push({
        path: ['status'],
        equals: status,
      });
    }

    // Search by category (using parameterized queries)
    if (searchParams.category) {
      const category = String(searchParams.category);
      contentConditions.push({
        path: ['category'],
        array_contains: [
          {
            coding: [{ code: category }],
          },
        ],
      });
    }

    // Search by code (using parameterized queries)
    if (searchParams.code) {
      const code = String(searchParams.code);
      contentConditions.push({
        path: ['code', 'coding'],
        array_contains: [{ code }],
      });
    }

    // Search by date (issued or effectiveDateTime) using safe comparison
    if (searchParams.date) {
      const date = String(searchParams.date);
      if (date.startsWith('ge')) {
        const dateValue = date.substring(2);
        contentConditions.push({
          OR: [
            {
              path: ['issued'],
              gte: dateValue,
            },
            {
              path: ['effectiveDateTime'],
              gte: dateValue,
            },
          ],
        });
      } else if (date.startsWith('le')) {
        const dateValue = date.substring(2);
        contentConditions.push({
          OR: [
            {
              path: ['issued'],
              lte: dateValue,
            },
            {
              path: ['effectiveDateTime'],
              lte: dateValue,
            },
          ],
        });
      } else {
        contentConditions.push({
          OR: [
            {
              path: ['issued'],
              equals: date,
            },
            {
              path: ['effectiveDateTime'],
              equals: date,
            },
          ],
        });
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
  private async handleInclude(resources: any[], include?: string): Promise<any[]> {
    if (!include) {
      return [];
    }

    const includedResources: any[] = [];
    const references = new Set<string>();

    // Extract references from resources based on include parameter
    for (const resource of resources) {
      const content = resource.content as FhirResource;

      // Parse include parameter (e.g., "Encounter:patient", "DiagnosticReport:subject")
      const [sourceType, field] = include.split(':');

      if (content.resourceType === sourceType) {
        const reference = this.extractReference(content, field);
        if (reference) {
          references.add(reference);
        }
      }
    }

    // Fetch referenced resources
    for (const reference of references) {
      const [type, id] = reference.split('/');
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
    if (fieldValue && typeof fieldValue === 'object' && fieldValue.reference) {
      return fieldValue.reference;
    }
    return null;
  }
}

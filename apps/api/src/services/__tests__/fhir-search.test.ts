import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FHIRSearch } from '../fhir-search';
import { SearchParams } from '../../utils/fhir-helpers';
import { PrismaClient } from '@prisma/client';
import { HTTPException } from 'hono/http-exception';

// Mock Prisma Client
const mockPrisma = {
  fhirResource: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
  },
} as unknown as PrismaClient;

describe('FHIRSearch', () => {
  let search: FHIRSearch;
  const mockOrgId = 'org-123';

  beforeEach(() => {
    vi.clearAllMocks();
    search = new FHIRSearch(mockPrisma, mockOrgId);
  });

  describe('searchPatients', () => {
    it('should search by CPF identifier', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'Patient',
          resourceId: 'patient-123',
          versionId: 1,
          content: {
            resourceType: 'Patient',
            id: 'patient-123',
            identifier: [
              {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                value: '12345678909',
              },
            ],
            name: [{ family: 'Silva', given: ['João'] }],
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        cpf: '12345678909',
      };

      const result = await search.search('Patient', searchParams);

      expect(result.resourceType).toBe('Bundle');
      expect(result.type).toBe('searchset');
      expect(result.total).toBe(1);
      expect(result.entry).toHaveLength(1);
      expect(result.entry![0].resource?.resourceType).toBe('Patient');
      expect(result.entry![0].search?.mode).toBe('match');
    });

    it('should search by CNS identifier', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'Patient',
          resourceId: 'patient-456',
          versionId: 1,
          content: {
            resourceType: 'Patient',
            id: 'patient-456',
            identifier: [
              {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                value: '123456789012345',
              },
            ],
            name: [{ family: 'Santos', given: ['Maria'] }],
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        cns: '123456789012345',
      };

      const result = await search.search('Patient', searchParams);

      expect(result.total).toBe(1);
      expect(result.entry![0].resource?.id).toBe('patient-456');
    });

    it('should search by name with fuzzy matching', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'Patient',
          resourceId: 'patient-789',
          versionId: 1,
          content: {
            resourceType: 'Patient',
            id: 'patient-789',
            name: [{ family: 'Silva', given: ['João'] }],
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        name: 'silva',
      };

      const result = await search.search('Patient', searchParams);

      expect(result.total).toBe(1);
      expect(mockPrisma.fhirResource.findMany).toHaveBeenCalled();
    });

    it('should search by family name', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'Patient',
          resourceId: 'patient-101',
          versionId: 1,
          content: {
            resourceType: 'Patient',
            id: 'patient-101',
            name: [{ family: 'Silva', given: ['João'] }],
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        family: 'Silva',
      };

      const result = await search.search('Patient', searchParams);

      expect(result.total).toBe(1);
    });

    it('should search by given name', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'Patient',
          resourceId: 'patient-102',
          versionId: 1,
          content: {
            resourceType: 'Patient',
            id: 'patient-102',
            name: [{ family: 'Santos', given: ['Maria'] }],
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        given: 'Maria',
      };

      const result = await search.search('Patient', searchParams);

      expect(result.total).toBe(1);
    });

    it('should search by birthDate', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'Patient',
          resourceId: 'patient-103',
          versionId: 1,
          content: {
            resourceType: 'Patient',
            id: 'patient-103',
            birthDate: '1990-01-01',
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        birthdate: '1990-01-01',
      };

      const result = await search.search('Patient', searchParams);

      expect(result.total).toBe(1);
    });

    it('should search by gender', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'Patient',
          resourceId: 'patient-104',
          versionId: 1,
          content: {
            resourceType: 'Patient',
            id: 'patient-104',
            gender: 'female',
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        gender: 'female',
      };

      const result = await search.search('Patient', searchParams);

      expect(result.total).toBe(1);
    });

    it('should paginate results', async () => {
      const mockResources = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        resourceType: 'Patient',
        resourceId: `patient-${i + 1}`,
        versionId: 1,
        content: {
          resourceType: 'Patient',
          id: `patient-${i + 1}`,
        },
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(50);

      const searchParams: SearchParams = {
        _count: '10',
        _offset: '0',
      };

      const result = await search.search('Patient', searchParams);

      expect(result.total).toBe(50);
      expect(result.entry).toHaveLength(10);

      expect(mockPrisma.fhirResource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });

    it('should include referenced resources with _include', async () => {
      const encounterResource = {
        id: 1,
        resourceType: 'Encounter',
        resourceId: 'encounter-123',
        versionId: 1,
        content: {
          resourceType: 'Encounter',
          id: 'encounter-123',
          subject: {
            reference: 'Patient/patient-123',
          },
        },
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const patientResource = {
        id: 2,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: {
          resourceType: 'Patient',
          id: 'patient-123',
          name: [{ family: 'Silva' }],
        },
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue([encounterResource]);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);
      (mockPrisma.fhirResource.findFirst as any).mockResolvedValue(patientResource);

      const searchParams: SearchParams = {
        _include: 'Encounter:subject',
      };

      const result = await search.search('Encounter', searchParams);

      expect(result.entry).toHaveLength(2);
      expect(result.entry![0].search?.mode).toBe('match');
      expect(result.entry![1].search?.mode).toBe('include');
      expect(result.entry![1].resource?.resourceType).toBe('Patient');
    });

    it('should require authentication', async () => {
      const unauthSearch = new FHIRSearch(mockPrisma);

      await expect(unauthSearch.search('Patient', {})).rejects.toThrow(HTTPException);
      await expect(unauthSearch.search('Patient', {})).rejects.toThrow('Unauthorized');
    });

    it('should handle empty results', async () => {
      (mockPrisma.fhirResource.findMany as any).mockResolvedValue([]);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(0);

      const searchParams: SearchParams = {
        name: 'NonexistentName',
      };

      const result = await search.search('Patient', searchParams);

      expect(result.total).toBe(0);
      expect(result.entry).toHaveLength(0);
    });
  });

  describe('searchEncounters', () => {
    it('should search by patient reference', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'Encounter',
          resourceId: 'encounter-123',
          versionId: 1,
          content: {
            resourceType: 'Encounter',
            id: 'encounter-123',
            subject: {
              reference: 'Patient/patient-123',
            },
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        patient: 'Patient/patient-123',
      };

      const result = await search.search('Encounter', searchParams);

      expect(result.total).toBe(1);
    });

    it('should search by status', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'Encounter',
          resourceId: 'encounter-456',
          versionId: 1,
          content: {
            resourceType: 'Encounter',
            id: 'encounter-456',
            status: 'finished',
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        status: 'finished',
      };

      const result = await search.search('Encounter', searchParams);

      expect(result.total).toBe(1);
    });

    it('should search by date with greater-than-or-equal', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'Encounter',
          resourceId: 'encounter-789',
          versionId: 1,
          content: {
            resourceType: 'Encounter',
            id: 'encounter-789',
            period: {
              start: '2024-01-01T10:00:00Z',
            },
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        date: 'ge2024-01-01',
      };

      const result = await search.search('Encounter', searchParams);

      expect(result.total).toBe(1);
    });

    it('should search by date with less-than-or-equal', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'Encounter',
          resourceId: 'encounter-101',
          versionId: 1,
          content: {
            resourceType: 'Encounter',
            id: 'encounter-101',
            period: {
              start: '2023-12-31T10:00:00Z',
            },
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        date: 'le2023-12-31',
      };

      const result = await search.search('Encounter', searchParams);

      expect(result.total).toBe(1);
    });

    it('should search by class code', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'Encounter',
          resourceId: 'encounter-202',
          versionId: 1,
          content: {
            resourceType: 'Encounter',
            id: 'encounter-202',
            class: {
              code: 'AMB',
              display: 'Ambulatory',
            },
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        class: 'AMB',
      };

      const result = await search.search('Encounter', searchParams);

      expect(result.total).toBe(1);
    });
  });

  describe('searchDiagnosticReports', () => {
    it('should search by patient reference', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'DiagnosticReport',
          resourceId: 'report-123',
          versionId: 1,
          content: {
            resourceType: 'DiagnosticReport',
            id: 'report-123',
            subject: {
              reference: 'Patient/patient-123',
            },
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        patient: 'Patient/patient-123',
      };

      const result = await search.search('DiagnosticReport', searchParams);

      expect(result.total).toBe(1);
    });

    it('should search by status', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'DiagnosticReport',
          resourceId: 'report-456',
          versionId: 1,
          content: {
            resourceType: 'DiagnosticReport',
            id: 'report-456',
            status: 'final',
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        status: 'final',
      };

      const result = await search.search('DiagnosticReport', searchParams);

      expect(result.total).toBe(1);
    });

    it('should search by category', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'DiagnosticReport',
          resourceId: 'report-789',
          versionId: 1,
          content: {
            resourceType: 'DiagnosticReport',
            id: 'report-789',
            category: [
              {
                coding: [{ code: 'LAB' }],
              },
            ],
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        category: 'LAB',
      };

      const result = await search.search('DiagnosticReport', searchParams);

      expect(result.total).toBe(1);
    });

    it('should search by code', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'DiagnosticReport',
          resourceId: 'report-101',
          versionId: 1,
          content: {
            resourceType: 'DiagnosticReport',
            id: 'report-101',
            code: {
              coding: [{ code: '12345-6' }],
            },
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        code: '12345-6',
      };

      const result = await search.search('DiagnosticReport', searchParams);

      expect(result.total).toBe(1);
    });

    it('should search by date (issued)', async () => {
      const mockResources = [
        {
          id: 1,
          resourceType: 'DiagnosticReport',
          resourceId: 'report-202',
          versionId: 1,
          content: {
            resourceType: 'DiagnosticReport',
            id: 'report-202',
            issued: '2024-01-15T10:00:00Z',
          },
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(1);

      const searchParams: SearchParams = {
        date: 'ge2024-01-01',
      };

      const result = await search.search('DiagnosticReport', searchParams);

      expect(result.total).toBe(1);
    });
  });

  describe('pagination', () => {
    it('should respect _count parameter', async () => {
      const mockResources = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        resourceType: 'Patient',
        resourceId: `patient-${i + 1}`,
        versionId: 1,
        content: { resourceType: 'Patient', id: `patient-${i + 1}` },
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      (mockPrisma.fhirResource.findMany as any).mockResolvedValue(mockResources);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(100);

      const searchParams: SearchParams = {
        _count: '5',
      };

      const result = await search.search('Patient', searchParams);

      expect(mockPrisma.fhirResource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should respect _offset parameter', async () => {
      (mockPrisma.fhirResource.findMany as any).mockResolvedValue([]);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(100);

      const searchParams: SearchParams = {
        _offset: '20',
      };

      await search.search('Patient', searchParams);

      expect(mockPrisma.fhirResource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
        })
      );
    });

    it('should limit _count to maximum 100', async () => {
      (mockPrisma.fhirResource.findMany as any).mockResolvedValue([]);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(100);

      const searchParams: SearchParams = {
        _count: '200', // Should be limited to 100
      };

      await search.search('Patient', searchParams);

      expect(mockPrisma.fhirResource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should use default pagination when not specified', async () => {
      (mockPrisma.fhirResource.findMany as any).mockResolvedValue([]);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(100);

      const searchParams: SearchParams = {};

      await search.search('Patient', searchParams);

      expect(mockPrisma.fhirResource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20, // Default count
        })
      );
    });
  });

  describe('unsupported resource types', () => {
    it('should return empty conditions for unsupported resource types', async () => {
      (mockPrisma.fhirResource.findMany as any).mockResolvedValue([]);
      (mockPrisma.fhirResource.count as any).mockResolvedValue(0);

      const searchParams: SearchParams = {
        someParam: 'value',
      };

      const result = await search.search('UnsupportedResource', searchParams);

      expect(result.total).toBe(0);
      expect(mockPrisma.fhirResource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            resourceType: 'UnsupportedResource',
            deleted: false,
          },
        })
      );
    });
  });
});

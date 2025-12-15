import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FHIRStore } from '../fhir-store';
import { Patient, Bundle, FhirResource } from '../../types/fhir';
import { PrismaClient } from '@prisma/client';
import { HTTPException } from 'hono/http-exception';

// Mock Prisma Client
const mockPrisma = {
  fhirResource: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
} as unknown as PrismaClient;

describe('FHIRStore', () => {
  let store: FHIRStore;
  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();
    store = new FHIRStore(mockPrisma, mockOrgId, mockUserId);
  });

  describe('create', () => {
    const validPatient: Patient = {
      resourceType: 'Patient',
      identifier: [
        {
          system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
          value: '12345678909',
        },
      ],
      name: [{ family: 'Silva', given: ['João'] }],
      gender: 'male',
      birthDate: '1990-01-01',
    };

    it('should create resource with version 1', async () => {
      const mockCreated = {
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: {
          ...validPatient,
          id: 'patient-123',
          meta: {
            versionId: '1',
            lastUpdated: expect.any(String),
          },
        },
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.fhirResource.create as any).mockResolvedValue(mockCreated);
      (mockPrisma.auditLog.create as any).mockResolvedValue({});

      const result = await store.create(validPatient);

      expect(result.resourceType).toBe('Patient');
      expect(result.id).toBeDefined();
      expect(result.meta?.versionId).toBe('1');
      expect(result.meta?.lastUpdated).toBeDefined();

      expect(mockPrisma.fhirResource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resourceType: 'Patient',
            versionId: 1,
            deleted: false,
          }),
        })
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'fhir.create',
            userId: mockUserId,
          }),
        })
      );
    });

    it('should reject invalid resource type', async () => {
      const invalidResource = {
        // Missing resourceType
        name: 'Invalid',
      } as any;

      await expect(store.create(invalidResource)).rejects.toThrow(
        'Invalid FHIR resource structure'
      );
    });

    it('should require authentication', async () => {
      const unauthStore = new FHIRStore(mockPrisma);

      await expect(unauthStore.create(validPatient)).rejects.toThrow(HTTPException);
    });

    it('should create audit log entry', async () => {
      const mockCreated = {
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: { ...validPatient, id: 'patient-123' },
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.fhirResource.create as any).mockResolvedValue(mockCreated);
      (mockPrisma.auditLog.create as any).mockResolvedValue({});

      await store.create(validPatient);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'fhir.create',
            resource: expect.stringContaining('Patient/'),
            userId: mockUserId,
          }),
        })
      );
    });

    it('should reject patient without CPF or CNS', async () => {
      const invalidPatient: Patient = {
        resourceType: 'Patient',
        identifier: [
          {
            system: 'http://example.com/other',
            value: '12345',
          },
        ],
        name: [{ family: 'Silva', given: ['João'] }],
      };

      await expect(store.create(invalidPatient)).rejects.toThrow('BR-Core validation failed');
    });

    it('should reject patient with invalid CPF', async () => {
      const invalidPatient: Patient = {
        resourceType: 'Patient',
        identifier: [
          {
            system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
            value: '11111111111', // All same digits
          },
        ],
        name: [{ family: 'Silva', given: ['João'] }],
      };

      await expect(store.create(invalidPatient)).rejects.toThrow('BR-Core validation failed');
    });

    it('should not fail operation if audit logging fails', async () => {
      const mockCreated = {
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: { ...validPatient, id: 'patient-123' },
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.fhirResource.create as any).mockResolvedValue(mockCreated);
      (mockPrisma.auditLog.create as any).mockRejectedValue(new Error('Audit failed'));

      // Should not throw despite audit failure
      const result = await store.create(validPatient);
      expect(result).toBeDefined();
    });
  });

  describe('read', () => {
    it('should read resource by type and ID', async () => {
      const mockResource = {
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: {
          resourceType: 'Patient',
          id: 'patient-123',
          name: [{ family: 'Silva' }],
        },
        deleted: false,
      };

      (mockPrisma.fhirResource.findFirst as any).mockResolvedValue(mockResource);
      (mockPrisma.auditLog.create as any).mockResolvedValue({});

      const result = await store.read('Patient', 'patient-123');

      expect(result.resourceType).toBe('Patient');
      expect(result.id).toBe('patient-123');

      expect(mockPrisma.fhirResource.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            resourceType: 'Patient',
            resourceId: 'patient-123',
            deleted: false,
          },
        })
      );
    });

    it('should throw 404 if resource not found', async () => {
      (mockPrisma.fhirResource.findFirst as any).mockResolvedValue(null);

      await expect(store.read('Patient', 'nonexistent')).rejects.toThrow(HTTPException);
      await expect(store.read('Patient', 'nonexistent')).rejects.toThrow(
        'Resource Patient/nonexistent not found'
      );
    });

    it('should require authentication', async () => {
      const unauthStore = new FHIRStore(mockPrisma);

      await expect(unauthStore.read('Patient', 'patient-123')).rejects.toThrow(HTTPException);
    });

    it('should create audit log for read operation', async () => {
      const mockResource = {
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: { resourceType: 'Patient', id: 'patient-123' },
        deleted: false,
      };

      (mockPrisma.fhirResource.findFirst as any).mockResolvedValue(mockResource);
      (mockPrisma.auditLog.create as any).mockResolvedValue({});

      await store.read('Patient', 'patient-123');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'fhir.read',
            resource: 'Patient/patient-123',
          }),
        })
      );
    });
  });

  describe('update', () => {
    const updatePatient: Patient = {
      resourceType: 'Patient',
      identifier: [
        {
          system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
          value: '12345678909',
        },
      ],
      name: [{ family: 'Santos', given: ['Maria'] }],
      gender: 'female',
    };

    it('should update resource and increment version', async () => {
      const existingResource = {
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: { resourceType: 'Patient', id: 'patient-123' },
        deleted: false,
      };

      const newResource = {
        id: 2,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 2,
        content: {
          ...updatePatient,
          id: 'patient-123',
          meta: { versionId: '2' },
        },
        deleted: false,
      };

      (mockPrisma.fhirResource.findFirst as any)
        .mockResolvedValueOnce(existingResource)
        .mockResolvedValueOnce(newResource);
      (mockPrisma.fhirResource.create as any).mockResolvedValue(newResource);
      (mockPrisma.auditLog.create as any).mockResolvedValue({});

      const result = await store.update('Patient', 'patient-123', updatePatient);

      expect(result.meta?.versionId).toBe('2');
      expect(mockPrisma.fhirResource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resourceType: 'Patient',
            resourceId: 'patient-123',
            versionId: 2,
          }),
        })
      );
    });

    it('should throw 404 if resource not found', async () => {
      (mockPrisma.fhirResource.findFirst as any).mockResolvedValue(null);

      await expect(store.update('Patient', 'nonexistent', updatePatient)).rejects.toThrow(
        HTTPException
      );
    });

    it('should reject resource type mismatch', async () => {
      const mismatchedResource = {
        ...updatePatient,
        resourceType: 'Observation',
      } as any;

      await expect(store.update('Patient', 'patient-123', mismatchedResource)).rejects.toThrow(
        'Resource type mismatch'
      );
    });

    it('should handle concurrent update conflict', async () => {
      const existingResource = {
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: { resourceType: 'Patient', id: 'patient-123' },
        deleted: false,
      };

      const createdResource = {
        id: 2,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 2,
        content: updatePatient,
        deleted: false,
      };

      const concurrentResource = {
        id: 3,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 3, // Different version - concurrent update
        content: { resourceType: 'Patient', id: 'patient-123' },
        deleted: false,
      };

      (mockPrisma.fhirResource.findFirst as any)
        .mockResolvedValueOnce(existingResource)
        .mockResolvedValueOnce(concurrentResource);
      (mockPrisma.fhirResource.create as any).mockResolvedValue(createdResource);
      (mockPrisma.fhirResource.delete as any).mockResolvedValue({});

      await expect(store.update('Patient', 'patient-123', updatePatient)).rejects.toThrow(
        HTTPException
      );
      await expect(store.update('Patient', 'patient-123', updatePatient)).rejects.toThrow(
        'Conflict'
      );

      // Should rollback by deleting created version
      expect(mockPrisma.fhirResource.delete).toHaveBeenCalled();
    });

    it('should validate BR-Core for Patient updates', async () => {
      const existingResource = {
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: { resourceType: 'Patient', id: 'patient-123' },
        deleted: false,
      };

      const invalidPatient: Patient = {
        resourceType: 'Patient',
        identifier: [
          {
            system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
            value: '11111111111', // Invalid CPF
          },
        ],
        name: [{ family: 'Silva' }],
      };

      (mockPrisma.fhirResource.findFirst as any).mockResolvedValue(existingResource);

      await expect(store.update('Patient', 'patient-123', invalidPatient)).rejects.toThrow(
        'BR-Core validation failed'
      );
    });
  });

  describe('delete', () => {
    it('should soft delete resource', async () => {
      const existingResource = {
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: { resourceType: 'Patient', id: 'patient-123' },
        deleted: false,
      };

      (mockPrisma.fhirResource.findFirst as any).mockResolvedValue(existingResource);
      (mockPrisma.fhirResource.create as any).mockResolvedValue({});
      (mockPrisma.auditLog.create as any).mockResolvedValue({});

      await store.delete('Patient', 'patient-123');

      expect(mockPrisma.fhirResource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resourceType: 'Patient',
            resourceId: 'patient-123',
            versionId: 2,
            deleted: true,
          }),
        })
      );
    });

    it('should throw 404 if resource not found', async () => {
      (mockPrisma.fhirResource.findFirst as any).mockResolvedValue(null);

      await expect(store.delete('Patient', 'nonexistent')).rejects.toThrow(HTTPException);
    });

    it('should create audit log for delete', async () => {
      const existingResource = {
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: { resourceType: 'Patient', id: 'patient-123' },
        deleted: false,
      };

      (mockPrisma.fhirResource.findFirst as any).mockResolvedValue(existingResource);
      (mockPrisma.fhirResource.create as any).mockResolvedValue({});
      (mockPrisma.auditLog.create as any).mockResolvedValue({});

      await store.delete('Patient', 'patient-123');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'fhir.delete',
            resource: 'Patient/patient-123',
          }),
        })
      );
    });
  });

  describe('processBundle', () => {
    it('should process transaction bundle atomically', async () => {
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            request: {
              method: 'POST',
              url: 'Patient',
            },
            resource: {
              resourceType: 'Patient',
              identifier: [
                {
                  system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                  value: '12345678909',
                },
              ],
              name: [{ family: 'Silva' }],
            },
          },
        ],
      };

      const mockTransaction = vi.fn(async (callback) => {
        return await callback(mockPrisma);
      });

      (mockPrisma.$transaction as any) = mockTransaction;
      (mockPrisma.fhirResource.create as any).mockResolvedValue({
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: {
          resourceType: 'Patient',
          id: 'patient-123',
          meta: { versionId: '1' },
        },
        deleted: false,
      });
      (mockPrisma.auditLog.create as any).mockResolvedValue({});

      const result = await store.processBundle(bundle);

      expect(result.resourceType).toBe('Bundle');
      expect(result.type).toBe('transaction-response');
      expect(result.entry).toHaveLength(1);
      expect(result.entry![0].response?.status).toBe('201 Created');
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should rollback on any failure', async () => {
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            request: {
              method: 'POST',
              url: 'Patient',
            },
            resource: {
              resourceType: 'Patient',
              identifier: [
                {
                  system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                  value: '11111111111', // Invalid CPF - should cause rollback
                },
              ],
              name: [{ family: 'Silva' }],
            },
          },
        ],
      };

      const mockTransaction = vi.fn(async (callback) => {
        return await callback(mockPrisma);
      });

      (mockPrisma.$transaction as any) = mockTransaction;

      const result = await store.processBundle(bundle);

      // Should have error response
      expect(result.entry![0].response?.status).toBe('500 Internal Server Error');
    });

    it('should handle batch bundles', async () => {
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'batch',
        entry: [
          {
            request: {
              method: 'GET',
              url: 'Patient/patient-123',
            },
          },
        ],
      };

      const mockTransaction = vi.fn(async (callback) => {
        return await callback(mockPrisma);
      });

      (mockPrisma.$transaction as any) = mockTransaction;
      (mockPrisma.fhirResource.findFirst as any).mockResolvedValue({
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: {
          resourceType: 'Patient',
          id: 'patient-123',
          meta: { versionId: '1' },
        },
        deleted: false,
      });
      (mockPrisma.auditLog.create as any).mockResolvedValue({});

      const result = await store.processBundle(bundle);

      expect(result.entry![0].response?.status).toBe('200 OK');
    });

    it('should handle POST requests in bundle', async () => {
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            request: {
              method: 'POST',
              url: 'Patient',
            },
            resource: {
              resourceType: 'Patient',
              identifier: [
                {
                  system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                  value: '12345678909',
                },
              ],
            },
          },
        ],
      };

      const mockTransaction = vi.fn(async (callback) => {
        return await callback(mockPrisma);
      });

      (mockPrisma.$transaction as any) = mockTransaction;
      (mockPrisma.fhirResource.create as any).mockResolvedValue({
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: {
          resourceType: 'Patient',
          id: 'patient-123',
          meta: { versionId: '1' },
        },
        deleted: false,
      });
      (mockPrisma.auditLog.create as any).mockResolvedValue({});

      const result = await store.processBundle(bundle);

      expect(result.entry![0].response?.status).toBe('201 Created');
      expect(result.entry![0].response?.location).toContain('Patient/');
    });

    it('should handle PUT requests in bundle', async () => {
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            request: {
              method: 'PUT',
              url: 'Patient/patient-123',
            },
            resource: {
              resourceType: 'Patient',
              identifier: [
                {
                  system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                  value: '12345678909',
                },
              ],
            },
          },
        ],
      };

      const mockTransaction = vi.fn(async (callback) => {
        return await callback(mockPrisma);
      });

      (mockPrisma.$transaction as any) = mockTransaction;
      (mockPrisma.fhirResource.findFirst as any)
        .mockResolvedValueOnce({
          id: 1,
          resourceType: 'Patient',
          resourceId: 'patient-123',
          versionId: 1,
          content: { resourceType: 'Patient', id: 'patient-123' },
          deleted: false,
        })
        .mockResolvedValueOnce({
          id: 2,
          resourceType: 'Patient',
          resourceId: 'patient-123',
          versionId: 2,
          content: { resourceType: 'Patient', id: 'patient-123' },
          deleted: false,
        });
      (mockPrisma.fhirResource.create as any).mockResolvedValue({
        id: 2,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 2,
        content: {
          resourceType: 'Patient',
          id: 'patient-123',
          meta: { versionId: '2' },
        },
        deleted: false,
      });
      (mockPrisma.auditLog.create as any).mockResolvedValue({});

      const result = await store.processBundle(bundle);

      expect(result.entry![0].response?.status).toBe('200 OK');
    });

    it('should handle DELETE requests in bundle', async () => {
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            request: {
              method: 'DELETE',
              url: 'Patient/patient-123',
            },
          },
        ],
      };

      const mockTransaction = vi.fn(async (callback) => {
        return await callback(mockPrisma);
      });

      (mockPrisma.$transaction as any) = mockTransaction;
      (mockPrisma.fhirResource.findFirst as any).mockResolvedValue({
        id: 1,
        resourceType: 'Patient',
        resourceId: 'patient-123',
        versionId: 1,
        content: { resourceType: 'Patient', id: 'patient-123' },
        deleted: false,
      });
      (mockPrisma.fhirResource.create as any).mockResolvedValue({});
      (mockPrisma.auditLog.create as any).mockResolvedValue({});

      const result = await store.processBundle(bundle);

      expect(result.entry![0].response?.status).toBe('204 No Content');
    });

    it('should handle empty bundle', async () => {
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [],
      };

      const result = await store.processBundle(bundle);

      expect(result.resourceType).toBe('Bundle');
      expect(result.type).toBe('transaction-response');
      expect(result.entry).toHaveLength(0);
    });

    it('should reject bundle entry without request', async () => {
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'Patient',
            },
          },
        ],
      };

      const mockTransaction = vi.fn(async (callback) => {
        return await callback(mockPrisma);
      });

      (mockPrisma.$transaction as any) = mockTransaction;

      const result = await store.processBundle(bundle);

      expect(result.entry![0].response?.status).toBe('400 Bad Request');
      expect(result.entry![0].response?.outcome).toBeDefined();
    });

    it('should reject unsupported HTTP method', async () => {
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            request: {
              method: 'PATCH' as any,
              url: 'Patient/patient-123',
            },
          },
        ],
      };

      const mockTransaction = vi.fn(async (callback) => {
        return await callback(mockPrisma);
      });

      (mockPrisma.$transaction as any) = mockTransaction;

      const result = await store.processBundle(bundle);

      expect(result.entry![0].response?.status).toBe('400 Bad Request');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { BRCoreValidator } from './br-core-validator';
import { Patient } from '../types/fhir';

describe('BRCoreValidator', () => {
  const validator = new BRCoreValidator();

  describe('validateCPF', () => {
    it('should validate a valid CPF', () => {
      const result = validator.validateCPF('12345678909');
      expect(result.valid).toBe(true);
    });

    it('should reject CPF with all same digits', () => {
      const result = validator.validateCPF('11111111111');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot have all digits the same');
    });

    it('should reject all invalid same-digit CPFs', () => {
      const invalidCPFs = [
        '00000000000',
        '11111111111',
        '22222222222',
        '33333333333',
        '44444444444',
        '55555555555',
        '66666666666',
        '77777777777',
        '88888888888',
        '99999999999',
      ];

      invalidCPFs.forEach((cpf) => {
        const result = validator.validateCPF(cpf);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('cannot have all digits the same');
      });
    });

    it('should reject CPF with wrong length', () => {
      const result = validator.validateCPF('123456789');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must have 11 digits');
    });

    it('should reject empty CPF', () => {
      const result = validator.validateCPF('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must have 11 digits');
    });

    it('should reject CPF with only non-digit characters', () => {
      const result = validator.validateCPF('abc.def.ghi-jk');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must have 11 digits');
    });

    it('should validate CPF with formatting characters', () => {
      const result = validator.validateCPF('123.456.789-09');
      expect(result.valid).toBe(true);
    });

    it('should reject CPF with invalid check digit', () => {
      const result = validator.validateCPF('12345678900');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid CPF check digit');
    });

    it('should reject CPF with invalid first check digit', () => {
      const result = validator.validateCPF('12345678809');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid CPF check digit');
    });

    it('should validate multiple known valid CPFs', () => {
      // These are mathematically valid CPF numbers (not necessarily assigned)
      const validCPFs = ['12345678909', '11144477735', '52599927035'];

      validCPFs.forEach((cpf) => {
        const result = validator.validateCPF(cpf);
        expect(result.valid).toBe(true);
      });
    });

    it('should handle CPF with spaces', () => {
      const result = validator.validateCPF('123 456 789 09');
      expect(result.valid).toBe(true);
    });

    it('should handle CPF with various separators', () => {
      const result = validator.validateCPF('123/456/789-09');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCNS', () => {
    it('should validate definitive CNS starting with 1', () => {
      // Valid CNS starting with 1 (definitive)
      const result = validator.validateCNS('100000000000001');
      expect(result.valid).toBe(true);
    });

    it('should validate definitive CNS starting with 2', () => {
      // Valid CNS starting with 2 (definitive)
      const result = validator.validateCNS('200000000000002');
      expect(result.valid).toBe(true);
    });

    it('should validate provisional CNS starting with 7', () => {
      // Valid CNS starting with 7 (provisional)
      const result = validator.validateCNS('700000000000007');
      expect(result.valid).toBe(true);
    });

    it('should validate provisional CNS starting with 8', () => {
      // Valid CNS starting with 8 (provisional)
      const result = validator.validateCNS('800000000000008');
      expect(result.valid).toBe(true);
    });

    it('should validate provisional CNS starting with 9', () => {
      // Valid CNS starting with 9 (provisional)
      const result = validator.validateCNS('900000000000009');
      expect(result.valid).toBe(true);
    });

    it('should reject CNS with wrong length - too short', () => {
      const result = validator.validateCNS('12345678901234');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must have 15 digits');
    });

    it('should reject CNS with wrong length - too long', () => {
      const result = validator.validateCNS('1234567890123456');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must have 15 digits');
    });

    it('should reject empty CNS', () => {
      const result = validator.validateCNS('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must have 15 digits');
    });

    it('should reject CNS starting with 0', () => {
      const result = validator.validateCNS('012345678901234');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must start with 1, 2, 7, 8, or 9');
    });

    it('should reject CNS starting with 3', () => {
      const result = validator.validateCNS('312345678901234');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must start with 1, 2, 7, 8, or 9');
    });

    it('should reject CNS starting with 4', () => {
      const result = validator.validateCNS('412345678901234');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must start with 1, 2, 7, 8, or 9');
    });

    it('should reject CNS starting with 5', () => {
      const result = validator.validateCNS('512345678901234');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must start with 1, 2, 7, 8, or 9');
    });

    it('should reject CNS starting with 6', () => {
      const result = validator.validateCNS('612345678901234');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must start with 1, 2, 7, 8, or 9');
    });

    it('should reject CNS with invalid check digit', () => {
      const result = validator.validateCNS('100000000000002');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid CNS check digit');
    });

    it('should validate CNS with formatting', () => {
      const result = validator.validateCNS('100 0000 0000 0001');
      expect(result.valid).toBe(true);
    });

    it('should handle CNS with various separators', () => {
      const result = validator.validateCNS('100-0000-0000-0001');
      expect(result.valid).toBe(true);
    });

    it('should reject CNS with only non-digit characters', () => {
      const result = validator.validateCNS('abc def ghi jkl m');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must have 15 digits');
    });
  });

  describe('validatePatient', () => {
    it('should pass validation for patient with valid CPF', () => {
      const patient: Patient = {
        resourceType: 'Patient',
        identifier: [
          {
            system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
            value: '12345678909',
          },
        ],
        name: [{ family: 'Silva', given: ['João'] }],
      };

      const result = validator.validatePatient(patient);
      expect(result).toBeNull();
    });

    it('should fail validation for patient without identifiers', () => {
      const patient: Patient = {
        resourceType: 'Patient',
        name: [{ family: 'Silva', given: ['João'] }],
      };

      const result = validator.validatePatient(patient);
      expect(result).not.toBeNull();
      expect(result?.issue[0].diagnostics).toContain('must have at least one identifier');
    });

    it('should fail validation for patient without CPF or CNS', () => {
      const patient: Patient = {
        resourceType: 'Patient',
        identifier: [
          {
            system: 'http://example.com/other',
            value: '12345',
          },
        ],
        name: [{ family: 'Silva', given: ['João'] }],
      };

      const result = validator.validatePatient(patient);
      expect(result).not.toBeNull();
      expect(result?.issue[0].diagnostics).toContain('must have either CPF or CNS');
    });

    it('should fail validation for patient with invalid CPF', () => {
      const patient: Patient = {
        resourceType: 'Patient',
        identifier: [
          {
            system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
            value: '11111111111',
          },
        ],
        name: [{ family: 'Silva', given: ['João'] }],
      };

      const result = validator.validatePatient(patient);
      expect(result).not.toBeNull();
      expect(result?.issue[0].code).toBe('invalid');
    });
  });
});

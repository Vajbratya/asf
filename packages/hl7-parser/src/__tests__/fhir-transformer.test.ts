/**
 * Unit tests for FHIR R4 Transformer
 */

import { FHIRTransformer } from '../transformers/to-fhir';
import { ADTMessage } from '../messages/adt';
import { ORMMessage } from '../messages/orm';
import { ORUMessage } from '../messages/oru';

describe('FHIRTransformer', () => {
  describe('transformADT - Patient + Encounter Bundle', () => {
    it('should transform complete ADT message to FHIR Bundle', () => {
      const adtMessage: ADTMessage = {
        eventType: 'A01',
        patient: {
          id: 'PAT123',
          name: {
            family: 'Silva',
            given: ['João', 'Carlos'],
          },
          birthDate: '1980-01-15',
          gender: 'M',
          address: {
            street: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP',
            postalCode: '01000-000',
            country: 'BR',
          },
          phone: ['(11) 98765-4321', '(11) 3456-7890'],
          cpf: '123.456.789-01',
          cns: '123 4567 8901 2345',
        },
        visit: {
          id: 'VIS456',
          patientClass: 'I',
          location: {
            facility: 'Hospital Central',
            building: 'Bloco A',
            floor: '3',
            room: '301',
            bed: 'A',
          },
          attendingDoctor: 'Dr. Maria Santos',
          admitDateTime: '2023-12-15T10:30:00',
          dischargeDateTime: undefined,
        },
        insurance: {
          plan: 'Plano Executivo',
          company: 'Unimed',
          policyNumber: 'POL123456',
          groupNumber: 'GRP789',
        },
      };

      const bundle = FHIRTransformer.transformADT(adtMessage);

      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('transaction');
      expect(bundle.entry.length).toBe(3); // Patient + Encounter + Coverage

      // Check Patient resource
      const patientEntry = bundle.entry[0];
      expect(patientEntry.resource.resourceType).toBe('Patient');
      expect(patientEntry.resource.id).toBe('PAT123');
      expect(patientEntry.resource.name[0].family).toBe('Silva');
      expect(patientEntry.resource.name[0].given).toEqual(['João', 'Carlos']);
      expect(patientEntry.resource.gender).toBe('male');
      expect(patientEntry.resource.birthDate).toBe('1980-01-15');
      expect(patientEntry.resource.identifier).toHaveLength(2);
      expect(patientEntry.resource.identifier[0].system).toContain('cpf');
      expect(patientEntry.resource.identifier[1].system).toContain('cns');

      // Check Encounter resource
      const encounterEntry = bundle.entry[1];
      expect(encounterEntry.resource.resourceType).toBe('Encounter');
      expect(encounterEntry.resource.id).toBe('VIS456');
      expect(encounterEntry.resource.status).toBe('in-progress');
      expect(encounterEntry.resource.class.code).toBe('IMP');
      expect(encounterEntry.resource.subject.reference).toBe('Patient/PAT123');

      // Check Coverage resource
      const coverageEntry = bundle.entry[2];
      expect(coverageEntry.resource.resourceType).toBe('Coverage');
      expect(coverageEntry.resource.beneficiary.reference).toBe('Patient/PAT123');
      expect(coverageEntry.resource.payor[0].display).toBe('Unimed');
    });

    it('should transform ADT without visit or insurance', () => {
      const adtMessage: ADTMessage = {
        eventType: 'A01',
        patient: {
          id: 'PAT123',
          name: {
            family: 'Silva',
            given: ['João'],
          },
        },
      };

      const bundle = FHIRTransformer.transformADT(adtMessage);

      expect(bundle.entry.length).toBe(1); // Only Patient
      expect(bundle.entry[0].resource.resourceType).toBe('Patient');
    });

    it('should map gender codes correctly', () => {
      const testCases = [
        { hl7: 'M', fhir: 'male' },
        { hl7: 'F', fhir: 'female' },
        { hl7: 'O', fhir: 'other' },
        { hl7: 'U', fhir: 'unknown' },
      ] as const;

      testCases.forEach(({ hl7, fhir }) => {
        const adtMessage: ADTMessage = {
          eventType: 'A01',
          patient: {
            id: 'PAT123',
            name: { family: 'Test', given: ['User'] },
            gender: hl7,
          },
        };

        const bundle = FHIRTransformer.transformADT(adtMessage);
        expect(bundle.entry[0].resource.gender).toBe(fhir);
      });
    });

    it('should handle Brazilian identifiers (CPF/CNS)', () => {
      const adtMessage: ADTMessage = {
        eventType: 'A01',
        patient: {
          id: 'PAT123',
          name: { family: 'Silva', given: ['João'] },
          cpf: '123.456.789-01',
          cns: '123456789012345',
        },
      };

      const bundle = FHIRTransformer.transformADT(adtMessage);
      const patient = bundle.entry[0].resource;

      expect(patient.identifier).toHaveLength(2);
      expect(patient.identifier[0].system).toBe(
        'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf'
      );
      expect(patient.identifier[0].value).toBe('123.456.789-01');
      expect(patient.identifier[1].system).toBe(
        'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns'
      );
      expect(patient.identifier[1].value).toBe('123456789012345');
    });
  });

  describe('transformORM - ServiceRequest Bundle', () => {
    it('should transform ORM message to FHIR ServiceRequest Bundle', () => {
      const ormMessage: ORMMessage = {
        patient: {
          id: 'PAT123',
          name: 'Silva^João',
        },
        orders: [
          {
            id: 'ORD001',
            controlCode: 'NW',
            placerOrderNumber: 'PLACER123',
            fillerOrderNumber: 'FILLER456',
            orderDateTime: '2023-12-15T10:30:00',
            orderingProvider: 'Dr. Maria Santos',
            procedureCode: '40301010',
            procedureText: 'Hemograma Completo',
          },
          {
            id: 'ORD002',
            controlCode: 'NW',
            procedureCode: '40301150',
            procedureText: 'Glicose',
          },
        ],
      };

      const bundle = FHIRTransformer.transformORM(ormMessage);

      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('transaction');
      expect(bundle.entry.length).toBe(2);

      // Check first ServiceRequest
      const sr1 = bundle.entry[0].resource;
      expect(sr1.resourceType).toBe('ServiceRequest');
      expect(sr1.id).toBe('ORD001');
      expect(sr1.status).toBe('active');
      expect(sr1.intent).toBe('order');
      expect(sr1.subject.reference).toBe('Patient/PAT123');
      expect(sr1.code.coding[0].system).toBe('http://www.ans.gov.br/tuss');
      expect(sr1.code.coding[0].code).toBe('40301010');
      expect(sr1.code.coding[0].display).toBe('Hemograma Completo');
      expect(sr1.authoredOn).toBe('2023-12-15T10:30:00');
      expect(sr1.requester.display).toBe('Dr. Maria Santos');
      expect(sr1.identifier).toHaveLength(2);

      // Check second ServiceRequest
      const sr2 = bundle.entry[1].resource;
      expect(sr2.resourceType).toBe('ServiceRequest');
      expect(sr2.id).toBe('ORD002');
    });

    it('should map order control codes to FHIR status', () => {
      const testCases = [
        { hl7: 'NW', fhir: 'active' },
        { hl7: 'CA', fhir: 'revoked' },
        { hl7: 'HD', fhir: 'on-hold' },
        { hl7: 'RP', fhir: 'replaced' },
      ] as const;

      testCases.forEach(({ hl7, fhir }) => {
        const ormMessage: ORMMessage = {
          orders: [
            {
              id: 'ORD001',
              controlCode: hl7,
            },
          ],
        };

        const bundle = FHIRTransformer.transformORM(ormMessage);
        expect(bundle.entry[0].resource.status).toBe(fhir);
      });
    });

    it('should handle orders without patient reference', () => {
      const ormMessage: ORMMessage = {
        orders: [
          {
            id: 'ORD001',
            controlCode: 'NW',
          },
        ],
      };

      const bundle = FHIRTransformer.transformORM(ormMessage);
      expect(bundle.entry[0].resource.subject).toBeUndefined();
    });
  });

  describe('transformORU - DiagnosticReport + Observations Bundle', () => {
    it('should transform ORU message to FHIR Bundle', () => {
      const oruMessage: ORUMessage = {
        patient: {
          id: 'PAT123',
          name: 'Silva^João',
        },
        report: {
          id: 'REP001',
          orderNumber: 'ORD123',
          universalServiceId: 'HEMO',
          observationDateTime: '2023-12-15T14:30:00',
          resultStatus: 'F',
          observations: [
            {
              id: 'OBS001',
              type: 'NM',
              identifier: 'WBC',
              value: 7500,
              units: '/mm3',
              referenceRange: '4000-11000',
              abnormalFlags: [],
              observationDateTime: '2023-12-15T14:30:00',
              status: 'F',
            },
            {
              id: 'OBS002',
              type: 'NM',
              identifier: 'RBC',
              value: 4.8,
              units: 'millions/mm3',
              referenceRange: '4.5-5.9',
              abnormalFlags: [],
              observationDateTime: '2023-12-15T14:30:00',
              status: 'F',
            },
          ],
        },
      };

      const bundle = FHIRTransformer.transformORU(oruMessage);

      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('transaction');
      expect(bundle.entry.length).toBe(3); // 2 Observations + 1 DiagnosticReport

      // Check first Observation
      const obs1 = bundle.entry[0].resource;
      expect(obs1.resourceType).toBe('Observation');
      expect(obs1.status).toBe('final');
      expect(obs1.code.text).toBe('WBC');
      expect(obs1.subject.reference).toBe('Patient/PAT123');
      expect(obs1.valueQuantity.value).toBe(7500);
      expect(obs1.valueQuantity.unit).toBe('/mm3');
      expect(obs1.referenceRange[0].text).toBe('4000-11000');

      // Check DiagnosticReport
      const report = bundle.entry[2].resource;
      expect(report.resourceType).toBe('DiagnosticReport');
      expect(report.id).toBe('REP001');
      expect(report.status).toBe('final');
      expect(report.subject.reference).toBe('Patient/PAT123');
      expect(report.result).toHaveLength(2);
    });

    it('should handle text observation values', () => {
      const oruMessage: ORUMessage = {
        report: {
          id: 'REP001',
          observations: [
            {
              id: 'OBS001',
              type: 'ST',
              identifier: 'COMMENT',
              value: 'Normal morphology',
              status: 'F',
            },
          ],
        },
      };

      const bundle = FHIRTransformer.transformORU(oruMessage);
      const obs = bundle.entry[0].resource;
      expect(obs.valueString).toBe('Normal morphology');
    });

    it('should handle encapsulated data (PDF)', () => {
      const oruMessage: ORUMessage = {
        report: {
          id: 'REP001',
          observations: [
            {
              id: 'OBS001',
              type: 'ED',
              identifier: 'REPORT_PDF',
              value: {
                type: 'PDF',
                encoding: 'Base64',
                data: 'JVBERi0xLjQK...',
                isPDF: true,
                isBase64: true,
              },
              status: 'F',
            },
          ],
        },
      };

      const bundle = FHIRTransformer.transformORU(oruMessage);
      const obs = bundle.entry[0].resource;
      expect(obs.valueAttachment.contentType).toBe('application/pdf');
      expect(obs.valueAttachment.data).toBe('JVBERi0xLjQK...');
    });

    it('should handle abnormal flags', () => {
      const oruMessage: ORUMessage = {
        report: {
          id: 'REP001',
          observations: [
            {
              id: 'OBS001',
              type: 'NM',
              identifier: 'GLUCOSE',
              value: 250,
              units: 'mg/dL',
              abnormalFlags: ['H', 'HH'],
              status: 'F',
            },
          ],
        },
      };

      const bundle = FHIRTransformer.transformORU(oruMessage);
      const obs = bundle.entry[0].resource;
      expect(obs.interpretation).toHaveLength(2);
      expect(obs.interpretation[0].coding[0].code).toBe('H');
      expect(obs.interpretation[1].coding[0].code).toBe('HH');
    });

    it('should map result status correctly', () => {
      const testCases = [
        { hl7: 'P', fhir: 'preliminary' },
        { hl7: 'F', fhir: 'final' },
        { hl7: 'C', fhir: 'amended' },
        { hl7: 'X', fhir: 'cancelled' },
      ] as const;

      testCases.forEach(({ hl7, fhir }) => {
        const oruMessage: ORUMessage = {
          report: {
            id: 'REP001',
            resultStatus: hl7,
            observations: [],
          },
        };

        const bundle = FHIRTransformer.transformORU(oruMessage);
        const report = bundle.entry[0].resource;
        expect(report.status).toBe(fhir);
      });
    });
  });

  describe('Patient Class Mapping', () => {
    it('should map patient class codes to FHIR encounter classes', () => {
      const testCases = [
        { hl7: 'I', fhir: 'IMP', display: 'inpatient encounter' },
        { hl7: 'O', fhir: 'AMB', display: 'ambulatory' },
        { hl7: 'E', fhir: 'EMER', display: 'emergency' },
        { hl7: 'P', fhir: 'PRENC', display: 'prearranged encounter' },
      ] as const;

      testCases.forEach(({ hl7, fhir, display }) => {
        const adtMessage: ADTMessage = {
          eventType: 'A01',
          patient: {
            id: 'PAT123',
            name: { family: 'Test', given: ['User'] },
          },
          visit: {
            id: 'VIS123',
            patientClass: hl7,
          },
        };

        const bundle = FHIRTransformer.transformADT(adtMessage);
        const encounter = bundle.entry[1].resource;
        expect(encounter.class.code).toBe(fhir);
        expect(encounter.class.display).toBe(display);
      });
    });
  });

  describe('Encounter Status', () => {
    it('should set encounter status to in-progress when no discharge date', () => {
      const adtMessage: ADTMessage = {
        eventType: 'A01',
        patient: {
          id: 'PAT123',
          name: { family: 'Test', given: ['User'] },
        },
        visit: {
          id: 'VIS123',
          patientClass: 'I',
          admitDateTime: '2023-12-15T10:00:00',
        },
      };

      const bundle = FHIRTransformer.transformADT(adtMessage);
      const encounter = bundle.entry[1].resource;
      expect(encounter.status).toBe('in-progress');
    });

    it('should set encounter status to finished when discharge date present', () => {
      const adtMessage: ADTMessage = {
        eventType: 'A01',
        patient: {
          id: 'PAT123',
          name: { family: 'Test', given: ['User'] },
        },
        visit: {
          id: 'VIS123',
          patientClass: 'I',
          admitDateTime: '2023-12-15T10:00:00',
          dischargeDateTime: '2023-12-16T14:00:00',
        },
      };

      const bundle = FHIRTransformer.transformADT(adtMessage);
      const encounter = bundle.entry[1].resource;
      expect(encounter.status).toBe('finished');
      expect(encounter.period.start).toBe('2023-12-15T10:00:00');
      expect(encounter.period.end).toBe('2023-12-16T14:00:00');
    });
  });
});

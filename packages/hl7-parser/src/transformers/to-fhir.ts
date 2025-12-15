/**
 * S12 - FHIR R4 Transformer
 *
 * Transforms HL7 v2 messages to FHIR R4 resources
 * - ADT → Patient + Encounter Bundle
 * - ORM → ServiceRequest Bundle
 * - ORU → DiagnosticReport + Observation Bundle
 */

import { Patient, Visit, Order, DiagnosticReport, Observation } from '../types';
import { ADTMessage } from '../messages/adt';
import { ORMMessage } from '../messages/orm';
import { ORUMessage } from '../messages/oru';

/**
 * FHIR R4 Bundle
 */
export interface FHIRBundle {
  resourceType: 'Bundle';
  type: 'transaction' | 'collection' | 'document';
  entry: FHIRBundleEntry[];
}

export interface FHIRBundleEntry {
  fullUrl?: string;
  resource: any;
  request?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
  };
}

/**
 * FHIR Transformer
 */
export class FHIRTransformer {
  /**
   * Transform ADT message to FHIR Bundle (Patient + Encounter)
   */
  static transformADT(adtMessage: ADTMessage): FHIRBundle {
    const entries: FHIRBundleEntry[] = [];

    // Create Patient resource
    const patientResource = this.toFHIRPatient(adtMessage.patient);
    entries.push({
      fullUrl: `urn:uuid:patient-${adtMessage.patient.id}`,
      resource: patientResource,
      request: {
        method: 'PUT',
        url: `Patient/${adtMessage.patient.id}`,
      },
    });

    // Create Encounter resource if visit info is present
    if (adtMessage.visit) {
      const encounterResource = this.toFHIREncounter(adtMessage.visit, adtMessage.patient.id);
      entries.push({
        fullUrl: `urn:uuid:encounter-${adtMessage.visit.id}`,
        resource: encounterResource,
        request: {
          method: 'PUT',
          url: `Encounter/${adtMessage.visit.id}`,
        },
      });
    }

    // Create Coverage resource if insurance info is present
    if (adtMessage.insurance) {
      const coverageResource = this.toFHIRCoverage(adtMessage.insurance, adtMessage.patient.id);
      entries.push({
        fullUrl: `urn:uuid:coverage-${adtMessage.patient.id}`,
        resource: coverageResource,
        request: {
          method: 'POST',
          url: 'Coverage',
        },
      });
    }

    return {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: entries,
    };
  }

  /**
   * Transform ORM message to FHIR Bundle (ServiceRequest)
   */
  static transformORM(ormMessage: ORMMessage): FHIRBundle {
    const entries: FHIRBundleEntry[] = [];

    // Create ServiceRequest for each order
    for (const order of ormMessage.orders) {
      const serviceRequestResource = this.toFHIRServiceRequest(order, ormMessage.patient?.id);
      entries.push({
        fullUrl: `urn:uuid:servicerequest-${order.id}`,
        resource: serviceRequestResource,
        request: {
          method: 'PUT',
          url: `ServiceRequest/${order.id}`,
        },
      });
    }

    return {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: entries,
    };
  }

  /**
   * Transform ORU message to FHIR Bundle (DiagnosticReport + Observations)
   */
  static transformORU(oruMessage: ORUMessage): FHIRBundle {
    const entries: FHIRBundleEntry[] = [];

    // Create Observation resources
    const observationIds: string[] = [];
    for (const observation of oruMessage.report.observations) {
      const observationResource = this.toFHIRObservation(observation, oruMessage.patient?.id);
      const obsId = `obs-${observation.id}`;
      observationIds.push(obsId);

      entries.push({
        fullUrl: `urn:uuid:${obsId}`,
        resource: observationResource,
        request: {
          method: 'POST',
          url: 'Observation',
        },
      });
    }

    // Create DiagnosticReport resource
    const diagnosticReportResource = this.toFHIRDiagnosticReport(
      oruMessage.report,
      oruMessage.patient?.id,
      observationIds
    );
    entries.push({
      fullUrl: `urn:uuid:diagnosticreport-${oruMessage.report.id}`,
      resource: diagnosticReportResource,
      request: {
        method: 'PUT',
        url: `DiagnosticReport/${oruMessage.report.id}`,
      },
    });

    return {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: entries,
    };
  }

  /**
   * Convert HL7 Patient to FHIR Patient resource
   */
  private static toFHIRPatient(patient: Patient): any {
    const resource: any = {
      resourceType: 'Patient',
      id: patient.id,
      name: [
        {
          family: patient.name.family,
          given: patient.name.given,
        },
      ],
    };

    if (patient.birthDate) {
      resource.birthDate = patient.birthDate;
    }

    if (patient.gender) {
      resource.gender = this.mapGenderToFHIR(patient.gender);
    }

    if (patient.address) {
      resource.address = [
        {
          line: patient.address.street ? [patient.address.street] : undefined,
          city: patient.address.city,
          state: patient.address.state,
          postalCode: patient.address.postalCode,
          country: patient.address.country,
        },
      ];
    }

    if (patient.phone && patient.phone.length > 0) {
      resource.telecom = patient.phone.map((phone) => ({
        system: 'phone',
        value: phone,
      }));
    }

    // Add Brazilian identifiers
    if (patient.cpf || patient.cns) {
      resource.identifier = [];

      if (patient.cpf) {
        resource.identifier.push({
          system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
          value: patient.cpf,
        });
      }

      if (patient.cns) {
        resource.identifier.push({
          system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
          value: patient.cns,
        });
      }
    }

    return resource;
  }

  /**
   * Convert HL7 Visit to FHIR Encounter resource
   */
  private static toFHIREncounter(visit: Visit, patientId: string): any {
    const resource: any = {
      resourceType: 'Encounter',
      id: visit.id,
      status: visit.dischargeDateTime ? 'finished' : 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: this.mapPatientClassToFHIR(visit.patientClass),
        display: this.getPatientClassDisplay(visit.patientClass),
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
    };

    if (visit.location) {
      resource.location = [
        {
          location: {
            display: [
              visit.location.facility,
              visit.location.building,
              visit.location.floor,
              visit.location.room,
              visit.location.bed,
            ]
              .filter(Boolean)
              .join(' / '),
          },
        },
      ];
    }

    if (visit.attendingDoctor) {
      resource.participant = [
        {
          type: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                  code: 'ATND',
                  display: 'attender',
                },
              ],
            },
          ],
          individual: {
            display: visit.attendingDoctor,
          },
        },
      ];
    }

    if (visit.admitDateTime || visit.dischargeDateTime) {
      resource.period = {};
      if (visit.admitDateTime) {
        resource.period.start = visit.admitDateTime;
      }
      if (visit.dischargeDateTime) {
        resource.period.end = visit.dischargeDateTime;
      }
    }

    return resource;
  }

  /**
   * Convert HL7 Insurance to FHIR Coverage resource
   */
  private static toFHIRCoverage(insurance: any, patientId: string): any {
    return {
      resourceType: 'Coverage',
      status: 'active',
      beneficiary: {
        reference: `Patient/${patientId}`,
      },
      payor: [
        {
          display: insurance.company,
        },
      ],
      class: insurance.plan
        ? [
            {
              type: {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/coverage-class',
                    code: 'plan',
                  },
                ],
              },
              value: insurance.plan,
            },
          ]
        : undefined,
      identifier: [
        insurance.policyNumber
          ? {
              type: {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                    code: 'PPN',
                    display: 'Policy Number',
                  },
                ],
              },
              value: insurance.policyNumber,
            }
          : null,
        insurance.groupNumber
          ? {
              type: {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                    code: 'GN',
                    display: 'Group Number',
                  },
                ],
              },
              value: insurance.groupNumber,
            }
          : null,
      ].filter(Boolean),
    };
  }

  /**
   * Convert HL7 Order to FHIR ServiceRequest resource
   */
  private static toFHIRServiceRequest(order: Order, patientId?: string): any {
    const resource: any = {
      resourceType: 'ServiceRequest',
      id: order.id,
      status: this.mapOrderControlToFHIRStatus(order.controlCode),
      intent: 'order',
    };

    if (patientId) {
      resource.subject = {
        reference: `Patient/${patientId}`,
      };
    }

    if (order.procedureCode) {
      resource.code = {
        coding: [
          {
            system: 'http://www.ans.gov.br/tuss',
            code: order.procedureCode,
            display: order.procedureText,
          },
        ],
      };
    }

    if (order.orderDateTime) {
      resource.authoredOn = order.orderDateTime;
    }

    if (order.orderingProvider) {
      resource.requester = {
        display: order.orderingProvider,
      };
    }

    if (order.placerOrderNumber) {
      resource.identifier = [
        {
          system: 'http://hospital.example.org/placer',
          value: order.placerOrderNumber,
        },
      ];
    }

    if (order.fillerOrderNumber) {
      if (!resource.identifier) resource.identifier = [];
      resource.identifier.push({
        system: 'http://hospital.example.org/filler',
        value: order.fillerOrderNumber,
      });
    }

    return resource;
  }

  /**
   * Convert HL7 DiagnosticReport to FHIR DiagnosticReport resource
   */
  private static toFHIRDiagnosticReport(
    report: DiagnosticReport,
    patientId?: string,
    observationIds: string[] = []
  ): any {
    const resource: any = {
      resourceType: 'DiagnosticReport',
      id: report.id,
      status: this.mapResultStatusToFHIR(report.resultStatus || 'F'),
    };

    if (patientId) {
      resource.subject = {
        reference: `Patient/${patientId}`,
      };
    }

    if (report.universalServiceId) {
      resource.code = {
        coding: [
          {
            code: report.universalServiceId,
          },
        ],
      };
    }

    if (report.observationDateTime) {
      resource.effectiveDateTime = report.observationDateTime;
    }

    if (observationIds.length > 0) {
      resource.result = observationIds.map((id) => ({
        reference: `urn:uuid:${id}`,
      }));
    }

    return resource;
  }

  /**
   * Convert HL7 Observation to FHIR Observation resource
   */
  private static toFHIRObservation(observation: Observation, patientId?: string): any {
    const resource: any = {
      resourceType: 'Observation',
      status: this.mapObservationStatusToFHIR(observation.status || 'F'),
      code: {
        text: observation.identifier,
      },
    };

    if (patientId) {
      resource.subject = {
        reference: `Patient/${patientId}`,
      };
    }

    // Map value based on type
    if (observation.type === 'NM' && typeof observation.value === 'number') {
      resource.valueQuantity = {
        value: observation.value,
        unit: observation.units,
      };
    } else if (
      observation.type === 'ED' &&
      observation.value &&
      typeof observation.value === 'object' &&
      'type' in observation.value
    ) {
      // Encapsulated data (e.g., PDF)
      const encapsulated = observation.value as { type: string; data: string };
      resource.valueAttachment = {
        contentType: encapsulated.type === 'PDF' ? 'application/pdf' : undefined,
        data: encapsulated.data,
      };
    } else if (observation.value !== null) {
      resource.valueString = String(observation.value);
    }

    if (observation.referenceRange) {
      resource.referenceRange = [
        {
          text: observation.referenceRange,
        },
      ];
    }

    if (observation.abnormalFlags && observation.abnormalFlags.length > 0) {
      resource.interpretation = observation.abnormalFlags.map((flag) => ({
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: flag,
          },
        ],
      }));
    }

    if (observation.observationDateTime) {
      resource.effectiveDateTime = observation.observationDateTime;
    }

    return resource;
  }

  /**
   * Map HL7 gender to FHIR gender
   */
  private static mapGenderToFHIR(gender: string): string {
    const map: Record<string, string> = {
      M: 'male',
      F: 'female',
      O: 'other',
      U: 'unknown',
    };
    return map[gender] || 'unknown';
  }

  /**
   * Map HL7 patient class to FHIR encounter class
   */
  private static mapPatientClassToFHIR(patientClass: string): string {
    const map: Record<string, string> = {
      I: 'IMP', // Inpatient
      O: 'AMB', // Outpatient/Ambulatory
      E: 'EMER', // Emergency
      P: 'PRENC', // Pre-admission
      R: 'AMB', // Recurring patient
      B: 'OBSENC', // Obstetrics
    };
    return map[patientClass] || 'AMB';
  }

  /**
   * Get patient class display name
   */
  private static getPatientClassDisplay(patientClass: string): string {
    const map: Record<string, string> = {
      I: 'inpatient encounter',
      O: 'ambulatory',
      E: 'emergency',
      P: 'prearranged encounter',
      R: 'ambulatory',
      B: 'obstetrics encounter',
    };
    return map[patientClass] || 'ambulatory';
  }

  /**
   * Map HL7 order control code to FHIR ServiceRequest status
   */
  private static mapOrderControlToFHIRStatus(controlCode: string): string {
    const map: Record<string, string> = {
      NW: 'active',
      CA: 'revoked',
      DC: 'revoked',
      OK: 'active',
      HD: 'on-hold',
      RP: 'replaced',
      OC: 'revoked',
      CR: 'revoked',
    };
    return map[controlCode] || 'active';
  }

  /**
   * Map HL7 result status to FHIR DiagnosticReport status
   */
  private static mapResultStatusToFHIR(status: string): string {
    const map: Record<string, string> = {
      P: 'preliminary',
      F: 'final',
      C: 'amended',
      X: 'cancelled',
      I: 'registered',
      S: 'partial',
    };
    return map[status] || 'final';
  }

  /**
   * Map HL7 observation status to FHIR Observation status
   */
  private static mapObservationStatusToFHIR(status: string): string {
    const map: Record<string, string> = {
      P: 'preliminary',
      F: 'final',
      C: 'amended',
      X: 'cancelled',
      I: 'registered',
      S: 'preliminary',
    };
    return map[status] || 'final';
  }
}

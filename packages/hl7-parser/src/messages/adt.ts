/**
 * S09 - ADT (Admission, Discharge, Transfer) Message Parser
 *
 * Handles ADT^A01/A02/A03/A08/A40 messages
 * Extracts patient demographics, visit info, and insurance
 * Includes Brazilian-specific fields: CPF and CNS
 */

import {
  HL7Message,
  HL7Segment,
  HL7Delimiters,
  Patient,
  Visit,
  Insurance,
  ValidationInfo,
} from '../types';
import { HL7Parser } from '../parser';
import { validateCPF, validateCNS } from '../utils/validators';

export interface ADTMessage {
  eventType: string; // A01, A02, A03, A08, A40
  patient: Patient;
  visit?: Visit;
  insurance?: Insurance;
}

export class ADTParser {
  /**
   * Parse an ADT message
   */
  static parse(message: HL7Message): ADTMessage {
    const messageType = message.messageType;

    // Validate message type
    if (!messageType.startsWith('ADT^A')) {
      throw new Error(`Not an ADT message: ${messageType}`);
    }

    const eventType = messageType.split('^')[1];

    // Parse patient from PID segment
    const pidSegment = HL7Parser.getSegment(message, 'PID');
    if (!pidSegment) {
      throw new Error('ADT message missing PID segment');
    }

    const patient = this.parsePatient(message, pidSegment);

    // Parse visit from PV1 segment (optional)
    const pv1Segment = HL7Parser.getSegment(message, 'PV1');
    const visit = pv1Segment ? this.parseVisit(message, pv1Segment) : undefined;

    // Parse insurance from IN1 segment (optional)
    const in1Segment = HL7Parser.getSegment(message, 'IN1');
    const insurance = in1Segment ? this.parseInsurance(message, in1Segment) : undefined;

    return {
      eventType,
      patient,
      visit,
      insurance,
    };
  }

  /**
   * Parse patient from PID segment
   * PID format:
   * PID|1||123456^^^HOSPITAL^MR||DOE^JOHN^A||19800101|M|||123 MAIN ST^^SAO PAULO^SP^01000^BR||(11)98765-4321||PT|S||987654321^^^CPF~123456789012345^^^CNS
   */
  private static parsePatient(message: HL7Message, pidSegment: HL7Segment): Patient {
    const delimiters = message.delimiters;

    // PID-3: Patient Identifier List
    const patientId = HL7Parser.getField(pidSegment, 3) || '';
    const idComponents = patientId.split(delimiters.component);
    const id = idComponents[0] || '';

    // PID-5: Patient Name (Family^Given^Middle^Suffix^Prefix)
    const patientName = HL7Parser.getField(pidSegment, 5) || '';
    const nameComponents = patientName.split(delimiters.component);
    const family = nameComponents[0] || '';
    const givenName = nameComponents[1] || '';
    const middleName = nameComponents[2] || '';
    const given = [givenName, middleName].filter((n) => n.length > 0);

    // PID-7: Date of Birth (YYYYMMDD)
    const birthDateHL7 = HL7Parser.getField(pidSegment, 7) || '';
    const birthDate = birthDateHL7 ? this.formatDateToISO(birthDateHL7) : undefined;

    // PID-8: Gender (M/F/O/U)
    const genderCode = HL7Parser.getField(pidSegment, 8) || '';
    const gender = this.parseGender(genderCode);

    // PID-11: Patient Address (Street^Other^City^State^Zip^Country)
    const addressField = HL7Parser.getField(pidSegment, 11) || '';
    const address = this.parseAddress(addressField, delimiters.component);

    // PID-13: Phone Number - Home
    const phoneField = HL7Parser.getField(pidSegment, 13);
    const phone = phoneField ? [phoneField] : undefined;

    // PID-19: SSN Number or equivalent - may contain CPF
    // Also check for CPF and CNS in PID-3 alternate identifiers
    const { cpf, cns, cpfValidation, cnsValidation } = this.extractBrazilianIds(
      message,
      pidSegment
    );

    return {
      id,
      name: { family, given },
      birthDate,
      gender,
      address,
      phone,
      cpf,
      cns,
      cpfValidation,
      cnsValidation,
    };
  }

  /**
   * Extract Brazilian IDs (CPF and CNS) from PID segment
   * Can be in PID-3 (with ^^^CPF or ^^^CNS identifiers) or PID-19
   */
  private static extractBrazilianIds(
    message: HL7Message,
    pidSegment: HL7Segment
  ): {
    cpf?: string;
    cns?: string;
    cpfValidation?: ValidationInfo;
    cnsValidation?: ValidationInfo;
  } {
    const delimiters = message.delimiters;
    let cpf: string | undefined;
    let cns: string | undefined;
    let cpfValidation: ValidationInfo | undefined;
    let cnsValidation: ValidationInfo | undefined;

    // Check PID-3 for alternate identifiers
    // Format: ID^^^Type where Type can be CPF or CNS
    // PID-3 is at field index 3 (1-based), so array index is 2
    const pid3Repetitions = pidSegment.fields[2] || [];

    for (const rep of pid3Repetitions) {
      const components = rep.split(delimiters.component);
      if (components.length >= 4) {
        const idValue = components[0];
        // PID-3 format can be: ID^^^Type (4 components) or ID^checkdigit^checkdigitscheme^assigningAuth^idTypeCode (5 components)
        // Check components[3] first (simpler format), then components[4] (full format)
        const idType = components.length >= 5 ? components[4] : components[3];

        if (idType === 'CPF' && idValue) {
          cpf = idValue;
          const validation = validateCPF(idValue);
          cpfValidation = {
            value: idValue,
            valid: validation.valid,
            error: validation.error,
          };
        } else if (idType === 'CNS' && idValue) {
          cns = idValue;
          const validation = validateCNS(idValue);
          cnsValidation = {
            value: idValue,
            valid: validation.valid,
            error: validation.error,
          };
        }
      }
    }

    // Also check PID-19 (SSN) for CPF
    if (!cpf) {
      const pid19 = HL7Parser.getField(pidSegment, 19);
      if (pid19 && /^\d{11}$/.test(pid19.replace(/\D/g, ''))) {
        cpf = pid19;
        const validation = validateCPF(pid19);
        cpfValidation = {
          value: pid19,
          valid: validation.valid,
          error: validation.error,
        };
      }
    }

    return { cpf, cns, cpfValidation, cnsValidation };
  }

  /**
   * Parse visit from PV1 segment
   * PV1 format:
   * PV1|1|I|ICU^201^A|||||||SMITH^JOHN|||SUR||||||||V123456
   */
  private static parseVisit(message: HL7Message, pv1Segment: HL7Segment): Visit {
    const delimiters = message.delimiters;

    // PV1-2: Patient Class (I=Inpatient, O=Outpatient, E=Emergency, etc.)
    const patientClass = HL7Parser.getField(pv1Segment, 2) || 'U';

    // PV1-3: Assigned Patient Location (Facility^Room^Bed^Facility^Location Status^Person Location Type^Building^Floor)
    const locationField = HL7Parser.getField(pv1Segment, 3) || '';
    const locationComponents = locationField.split(delimiters.component);

    const location = {
      facility: locationComponents[0] || undefined,
      room: locationComponents[1] || undefined,
      bed: locationComponents[2] || undefined,
      building: locationComponents[6] || undefined,
      floor: locationComponents[7] || undefined,
    };

    // PV1-7: Attending Doctor
    const attendingDoctorField = HL7Parser.getField(pv1Segment, 7) || '';
    const attendingDoctor = attendingDoctorField.split(delimiters.component)[0] || undefined;

    // PV1-44: Admit Date/Time
    const admitDateTimeHL7 = HL7Parser.getField(pv1Segment, 44);
    const admitDateTime = admitDateTimeHL7 ? this.formatDateTimeToISO(admitDateTimeHL7) : undefined;

    // PV1-45: Discharge Date/Time
    const dischargeDateTimeHL7 = HL7Parser.getField(pv1Segment, 45);
    const dischargeDateTime = dischargeDateTimeHL7
      ? this.formatDateTimeToISO(dischargeDateTimeHL7)
      : undefined;

    // PV1-19: Visit Number
    const visitId = HL7Parser.getField(pv1Segment, 19) || '';

    return {
      id: visitId,
      patientClass,
      location,
      attendingDoctor,
      admitDateTime,
      dischargeDateTime,
    };
  }

  /**
   * Parse insurance from IN1 segment
   * IN1 format:
   * IN1|1|PLAN123|INSURANCE_CO|Insurance Company Name|||POLICY123|GROUP456
   */
  private static parseInsurance(message: HL7Message, in1Segment: HL7Segment): Insurance {
    // IN1-2: Insurance Plan ID
    const plan = HL7Parser.getField(in1Segment, 2) || undefined;

    // IN1-4: Insurance Company Name
    const company = HL7Parser.getField(in1Segment, 4) || undefined;

    // IN1-36: Policy Number
    const policyNumber = HL7Parser.getField(in1Segment, 36) || undefined;

    // IN1-8: Group Number
    const groupNumber = HL7Parser.getField(in1Segment, 8) || undefined;

    return {
      plan,
      company,
      policyNumber,
      groupNumber,
    };
  }

  /**
   * Parse gender code
   */
  private static parseGender(code: string): 'M' | 'F' | 'O' | 'U' | undefined {
    const normalized = code.toUpperCase();
    if (normalized === 'M' || normalized === 'F' || normalized === 'O' || normalized === 'U') {
      return normalized as 'M' | 'F' | 'O' | 'U';
    }
    return undefined;
  }

  /**
   * Parse address from HL7 field
   */
  private static parseAddress(
    addressField: string,
    componentSeparator: string
  ):
    | {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      }
    | undefined {
    if (!addressField) {
      return undefined;
    }

    const components = addressField.split(componentSeparator);

    return {
      street: components[0] || undefined,
      city: components[2] || undefined,
      state: components[3] || undefined,
      postalCode: components[4] || undefined,
      country: components[5] || undefined,
    };
  }

  /**
   * Format HL7 date (YYYYMMDD) to ISO format (YYYY-MM-DD)
   */
  private static formatDateToISO(hl7Date: string): string {
    if (hl7Date.length < 8) {
      return hl7Date;
    }

    const year = hl7Date.substring(0, 4);
    const month = hl7Date.substring(4, 6);
    const day = hl7Date.substring(6, 8);

    return `${year}-${month}-${day}`;
  }

  /**
   * Format HL7 datetime (YYYYMMDDHHMMSS) to ISO format
   */
  private static formatDateTimeToISO(hl7DateTime: string): string {
    const date = HL7Parser.parseHL7DateTime(hl7DateTime);
    return date ? date.toISOString() : hl7DateTime;
  }

  /**
   * Get event type description
   */
  static getEventDescription(eventType: string): string {
    const descriptions: Record<string, string> = {
      A01: 'Admit/Visit Notification',
      A02: 'Transfer a Patient',
      A03: 'Discharge/End Visit',
      A04: 'Register a Patient',
      A05: 'Pre-Admit a Patient',
      A08: 'Update Patient Information',
      A11: 'Cancel Admit',
      A12: 'Cancel Transfer',
      A13: 'Cancel Discharge',
      A28: 'Add Person Information',
      A31: 'Update Person Information',
      A40: 'Merge Patient - Patient Identifier List',
    };

    return descriptions[eventType] || 'Unknown ADT Event';
  }
}

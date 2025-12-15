/**
 * S11 - ORU (Observation Result) Message Parser
 *
 * Handles ORU^R01 result messages
 * Extracts OBR (observation request) and OBX (observation/result) segments
 * Handles embedded PDFs (Base64 in OBX-5)
 */

import { HL7Message, HL7Segment, Observation, DiagnosticReport } from '../types';
import { HL7Parser } from '../parser';

export interface ORUMessage {
  patient?: {
    id: string;
    name?: string;
  };
  report: DiagnosticReport;
}

export class ORUParser {
  /**
   * Parse an ORU message
   */
  static parse(message: HL7Message): ORUMessage {
    const messageType = message.messageType;

    // Validate message type
    if (!messageType.startsWith('ORU^R')) {
      throw new Error(`Not an ORU message: ${messageType}`);
    }

    // Extract patient info from PID if present
    const pidSegment = HL7Parser.getSegment(message, 'PID');
    const patient = pidSegment ? this.parsePatientInfo(message, pidSegment) : undefined;

    // Parse diagnostic report from OBR + OBX segments
    const report = this.parseDiagnosticReport(message);

    return {
      patient,
      report,
    };
  }

  /**
   * Parse patient info from PID segment
   */
  private static parsePatientInfo(
    message: HL7Message,
    pidSegment: HL7Segment
  ): {
    id: string;
    name?: string;
  } {
    const delimiters = message.delimiters;

    // PID-3: Patient ID
    const patientId = HL7Parser.getField(pidSegment, 3) || '';
    const idComponents = patientId.split(delimiters.component);
    const id = idComponents[0] || '';

    // PID-5: Patient Name
    const patientName = HL7Parser.getField(pidSegment, 5) || '';
    const nameComponents = patientName.split(delimiters.component);
    const family = nameComponents[0] || '';
    const given = nameComponents[1] || '';
    const name = given && family ? `${given} ${family}` : given || family || undefined;

    return {
      id,
      name,
    };
  }

  /**
   * Parse diagnostic report from OBR and OBX segments
   * OBR contains report metadata
   * OBX segments contain individual observations
   */
  private static parseDiagnosticReport(message: HL7Message): DiagnosticReport {
    const delimiters = message.delimiters;

    // Get OBR segment (observation request/report header)
    const obrSegment = HL7Parser.getSegment(message, 'OBR');
    if (!obrSegment) {
      throw new Error('ORU message missing OBR segment');
    }

    // OBR-2: Placer Order Number
    const orderNumber = HL7Parser.getField(obrSegment, 2) || undefined;

    // OBR-4: Universal Service ID (Test Code^Test Name^Coding System)
    const serviceIdField = HL7Parser.getField(obrSegment, 4) || '';
    const serviceIdComponents = serviceIdField.split(delimiters.component);
    const universalServiceId = serviceIdComponents[0] || undefined;

    // OBR-7: Observation Date/Time
    const observationDateTimeHL7 = HL7Parser.getField(obrSegment, 7);
    const observationDateTime = observationDateTimeHL7
      ? this.formatDateTimeToISO(observationDateTimeHL7)
      : undefined;

    // OBR-25: Result Status (P=Preliminary, F=Final, C=Corrected, X=Cannot obtain results)
    const resultStatus = HL7Parser.getField(obrSegment, 25) || undefined;

    // OBR-3 or OBR-2 as report ID
    const reportId = HL7Parser.getField(obrSegment, 3) || orderNumber || this.generateReportId();

    // Parse all OBX segments (observations)
    const observations = this.parseObservations(message);

    return {
      id: reportId,
      orderNumber,
      universalServiceId,
      observationDateTime,
      resultStatus,
      observations,
    };
  }

  /**
   * Parse all OBX segments (observations)
   * OBX format: OBX|1|NM|GLU^Glucose^LN||120|mg/dL|70-110|H|||F
   * OBX with PDF: OBX|1|ED|PDF^PDF Document^LN||JVBERi0xLj...(base64)||||||
   */
  private static parseObservations(message: HL7Message): Observation[] {
    const delimiters = message.delimiters;
    const obxSegments = HL7Parser.getSegments(message, 'OBX');
    const observations: Observation[] = [];

    for (const obxSegment of obxSegments) {
      // OBX-1: Set ID
      const setId = HL7Parser.getField(obxSegment, 1) || '';

      // OBX-2: Value Type (NM=Numeric, ST=String, TX=Text, ED=Encapsulated Data, etc.)
      const valueType = HL7Parser.getField(obxSegment, 2) || '';

      // OBX-3: Observation Identifier (Code^Text^Coding System)
      const identifierField = HL7Parser.getField(obxSegment, 3) || '';
      const identifierComponents = identifierField.split(delimiters.component);
      const identifier = identifierComponents[0] || '';
      const identifierText = identifierComponents[1] || '';

      // OBX-5: Observation Value
      let value = HL7Parser.getField(obxSegment, 5);

      // Handle different value types
      if (valueType === 'NM' && value) {
        // Numeric value
        const numValue = parseFloat(value);
        value = isNaN(numValue) ? value : numValue;
      } else if (valueType === 'ED' && value) {
        // Encapsulated Data (e.g., PDF)
        // Format: DataType^DataSubtype^Encoding^Data
        const edComponents = value.split(delimiters.component);
        if (edComponents.length >= 4) {
          const dataType = edComponents[0];
          const encoding = edComponents[2];
          const data = edComponents[3];

          value = {
            type: dataType,
            encoding: encoding,
            data: data,
            isPDF: dataType === 'PDF' || dataType === 'Application/PDF',
            isBase64: encoding === 'Base64' || encoding === 'base64',
          };
        }
      }

      // OBX-6: Units
      const units = HL7Parser.getField(obxSegment, 6) || undefined;

      // OBX-7: Reference Range
      const referenceRange = HL7Parser.getField(obxSegment, 7) || undefined;

      // OBX-8: Abnormal Flags (L=Low, H=High, LL=Critical Low, HH=Critical High, etc.)
      const abnormalFlagsField = HL7Parser.getField(obxSegment, 8);
      const abnormalFlags = abnormalFlagsField
        ? abnormalFlagsField.split(delimiters.repetition)
        : undefined;

      // OBX-11: Observation Result Status (P=Preliminary, F=Final, C=Corrected, etc.)
      const status = HL7Parser.getField(obxSegment, 11) || undefined;

      // OBX-14: Date/Time of Observation
      const observationDateTimeHL7 = HL7Parser.getField(obxSegment, 14);
      const observationDateTime = observationDateTimeHL7
        ? this.formatDateTimeToISO(observationDateTimeHL7)
        : undefined;

      observations.push({
        id: setId,
        type: valueType,
        identifier: `${identifier}${identifierText ? ` - ${identifierText}` : ''}`,
        value,
        units,
        referenceRange,
        abnormalFlags,
        observationDateTime,
        status,
      });
    }

    return observations;
  }

  /**
   * Format HL7 datetime to ISO format
   */
  private static formatDateTimeToISO(hl7DateTime: string): string {
    const date = HL7Parser.parseHL7DateTime(hl7DateTime);
    return date ? date.toISOString() : hl7DateTime;
  }

  /**
   * Generate a unique report ID
   */
  private static generateReportId(): string {
    return `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Extract embedded PDF from observations
   * Returns the first PDF found as base64 string
   */
  static extractPDF(report: DiagnosticReport): string | null {
    for (const obs of report.observations) {
      if (typeof obs.value === 'object' && obs.value.isPDF && obs.value.isBase64) {
        return obs.value.data;
      }
    }
    return null;
  }

  /**
   * Get result status description
   */
  static getResultStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      P: 'Preliminary',
      F: 'Final',
      C: 'Corrected',
      X: 'Cannot obtain results',
      I: 'In process',
      S: 'Partial',
      R: 'Not verified',
      U: 'Result updated',
      W: 'Wrong patient',
      D: 'Deleted',
    };

    return descriptions[status] || 'Unknown Status';
  }

  /**
   * Get abnormal flag description
   */
  static getAbnormalFlagDescription(flag: string): string {
    const descriptions: Record<string, string> = {
      L: 'Below low normal',
      H: 'Above high normal',
      LL: 'Below lower panic limits',
      HH: 'Above upper panic limits',
      '<': 'Below absolute low-off instrument scale',
      '>': 'Above absolute high-off instrument scale',
      N: 'Normal',
      A: 'Abnormal',
      AA: 'Very abnormal',
      U: 'Significant change up',
      D: 'Significant change down',
      B: 'Better',
      W: 'Worse',
      S: 'Susceptible',
      R: 'Resistant',
      I: 'Intermediate',
      MS: 'Moderately susceptible',
      VS: 'Very susceptible',
    };

    return descriptions[flag] || flag;
  }

  /**
   * Check if observation has abnormal value
   */
  static isAbnormal(observation: Observation): boolean {
    if (!observation.abnormalFlags || observation.abnormalFlags.length === 0) {
      return false;
    }

    const abnormalCodes = ['L', 'H', 'LL', 'HH', '<', '>', 'A', 'AA'];
    return observation.abnormalFlags.some((flag) => abnormalCodes.includes(flag));
  }

  /**
   * Check if observation is critical
   */
  static isCritical(observation: Observation): boolean {
    if (!observation.abnormalFlags || observation.abnormalFlags.length === 0) {
      return false;
    }

    const criticalCodes = ['LL', 'HH', '<', '>', 'AA'];
    return observation.abnormalFlags.some((flag) => criticalCodes.includes(flag));
  }
}

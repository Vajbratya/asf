/**
 * HL7 v2 Message Types and Interfaces
 */

export interface HL7Delimiters {
  field: string; // |
  component: string; // ^
  repetition: string; // ~
  escape: string; // \
  subcomponent: string; // &
}

export interface HL7Segment {
  name: string;
  fields: string[][]; // fields[i][j] where i=field, j=repetition
}

export interface HL7Message {
  messageType: string; // e.g., "ADT^A01"
  messageControlId: string;
  delimiters: HL7Delimiters;
  segments: HL7Segment[];
  raw: string;
}

export interface HL7Acknowledgment {
  messageType: "ACK" | "NAK";
  messageControlId: string;
  ackCode: "AA" | "AE" | "AR"; // Application Accept/Error/Reject
  textMessage?: string;
  raw: string;
}

export interface Patient {
  id: string;
  name: {
    family: string;
    given: string[];
  };
  birthDate?: string;
  gender?: "M" | "F" | "O" | "U";
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  phone?: string[];
  cpf?: string; // Brazilian CPF
  cns?: string; // Brazilian SUS card
}

export interface Visit {
  id: string;
  patientClass: string; // I=Inpatient, O=Outpatient, E=Emergency
  location?: {
    facility?: string;
    building?: string;
    floor?: string;
    room?: string;
    bed?: string;
  };
  attendingDoctor?: string;
  admitDateTime?: string;
  dischargeDateTime?: string;
}

export interface Insurance {
  plan?: string;
  company?: string;
  policyNumber?: string;
  groupNumber?: string;
}

export interface Order {
  id: string;
  controlCode: string; // NW=New, CA=Cancel, etc.
  placerOrderNumber?: string;
  fillerOrderNumber?: string;
  orderDateTime?: string;
  orderingProvider?: string;
  procedureCode?: string;
  procedureText?: string;
}

export interface Observation {
  id: string;
  type: string; // OBX value type
  identifier: string;
  value: any;
  units?: string;
  referenceRange?: string;
  abnormalFlags?: string[];
  observationDateTime?: string;
  status?: string;
}

export interface DiagnosticReport {
  id: string;
  orderNumber?: string;
  universalServiceId?: string;
  observationDateTime?: string;
  resultStatus?: string; // P=Preliminary, F=Final, C=Corrected
  observations: Observation[];
}

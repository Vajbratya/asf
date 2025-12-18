/**
 * Tasy Z-Segment Parsers
 *
 * Custom Z-segments used by Philips Tasy EHR system
 * ZPD - Extended Patient Demographics
 * ZPV - Extended Visit Information
 * ZIN - Extended Insurance Information
 * ZOR - Extended Order Information
 */

import { HL7Message, HL7Segment } from '../types';
import { HL7Parser } from '../parser';

/**
 * ZPD - Extended Patient Demographics (Tasy-specific)
 */
export interface ZPDSegment {
  motherName?: string;
  nationality?: string;
  ethnicity?: string;
  religion?: string;
  education?: string;
  occupation?: string;
  maritalStatus?: string;
  cpf?: string;
  rg?: string;
  cns?: string;
  birthPlace?: string;
}

/**
 * ZPV - Extended Visit Information (Tasy-specific)
 */
export interface ZPVSegment {
  clinicName?: string;
  sectorName?: string;
  specialty?: string;
  urgencyLevel?: string;
  admissionType?: string;
  dischargeType?: string;
  hospitalizationReason?: string;
  principalDiagnosis?: string;
  secondaryDiagnoses?: string[];
}

/**
 * ZIN - Extended Insurance Information (Tasy-specific)
 */
export interface ZINSegment {
  planType?: string;
  planModality?: string;
  validityDate?: string;
  cardNumber?: string;
  ansCode?: string; // ANS: Agência Nacional de Saúde Suplementar
  companyCode?: string;
  contractNumber?: string;
  holderName?: string;
  holderCPF?: string;
}

/**
 * ZOR - Extended Order Information (Tasy-specific)
 */
export interface ZORSegment {
  requestingUnit?: string;
  executingUnit?: string;
  priority?: string;
  clinicalIndication?: string;
  requestType?: string;
  authorizationNumber?: string;
  guideNumber?: string; // Número da guia (TISS)
  procedureQuantity?: number;
  procedureValue?: number;
}

export class ZSegmentParser {
  /**
   * Parse ZPD segment (Extended Patient Demographics)
   * ZPD|Mother Name|Nationality|Ethnicity|Religion|Education|Occupation|Marital|CPF|RG|CNS|Birth Place
   */
  static parseZPD(message: HL7Message): ZPDSegment | null {
    const zpdSegment = HL7Parser.getSegment(message, 'ZPD');
    if (!zpdSegment) {
      return null;
    }

    return {
      motherName: HL7Parser.getField(zpdSegment, 1) || undefined,
      nationality: HL7Parser.getField(zpdSegment, 2) || undefined,
      ethnicity: HL7Parser.getField(zpdSegment, 3) || undefined,
      religion: HL7Parser.getField(zpdSegment, 4) || undefined,
      education: HL7Parser.getField(zpdSegment, 5) || undefined,
      occupation: HL7Parser.getField(zpdSegment, 6) || undefined,
      maritalStatus: HL7Parser.getField(zpdSegment, 7) || undefined,
      cpf: HL7Parser.getField(zpdSegment, 8) || undefined,
      rg: HL7Parser.getField(zpdSegment, 9) || undefined,
      cns: HL7Parser.getField(zpdSegment, 10) || undefined,
      birthPlace: HL7Parser.getField(zpdSegment, 11) || undefined,
    };
  }

  /**
   * Parse ZPV segment (Extended Visit Information)
   * ZPV|Clinic|Sector|Specialty|Urgency|AdmissionType|DischargeType|Reason|PrincipalDx|SecondaryDx1~SecondaryDx2
   */
  static parseZPV(message: HL7Message): ZPVSegment | null {
    const zpvSegment = HL7Parser.getSegment(message, 'ZPV');
    if (!zpvSegment) {
      return null;
    }

    // ZPV-9: Secondary diagnoses (may have repetitions)
    // Fields array is 0-indexed, so field 9 is at index 8
    const secondaryDxRepetitions = zpvSegment.fields[8];
    const secondaryDiagnoses = secondaryDxRepetitions
      ? secondaryDxRepetitions.filter((d) => d.length > 0)
      : undefined;

    return {
      clinicName: HL7Parser.getField(zpvSegment, 1) || undefined,
      sectorName: HL7Parser.getField(zpvSegment, 2) || undefined,
      specialty: HL7Parser.getField(zpvSegment, 3) || undefined,
      urgencyLevel: HL7Parser.getField(zpvSegment, 4) || undefined,
      admissionType: HL7Parser.getField(zpvSegment, 5) || undefined,
      dischargeType: HL7Parser.getField(zpvSegment, 6) || undefined,
      hospitalizationReason: HL7Parser.getField(zpvSegment, 7) || undefined,
      principalDiagnosis: HL7Parser.getField(zpvSegment, 8) || undefined,
      secondaryDiagnoses,
    };
  }

  /**
   * Parse ZIN segment (Extended Insurance Information)
   * ZIN|PlanType|PlanModality|ValidityDate|CardNumber|ANSCode|CompanyCode|ContractNumber|HolderName|HolderCPF
   */
  static parseZIN(message: HL7Message): ZINSegment | null {
    const zinSegment = HL7Parser.getSegment(message, 'ZIN');
    if (!zinSegment) {
      return null;
    }

    return {
      planType: HL7Parser.getField(zinSegment, 1) || undefined,
      planModality: HL7Parser.getField(zinSegment, 2) || undefined,
      validityDate: HL7Parser.getField(zinSegment, 3) || undefined,
      cardNumber: HL7Parser.getField(zinSegment, 4) || undefined,
      ansCode: HL7Parser.getField(zinSegment, 5) || undefined,
      companyCode: HL7Parser.getField(zinSegment, 6) || undefined,
      contractNumber: HL7Parser.getField(zinSegment, 7) || undefined,
      holderName: HL7Parser.getField(zinSegment, 8) || undefined,
      holderCPF: HL7Parser.getField(zinSegment, 9) || undefined,
    };
  }

  /**
   * Parse ZOR segment (Extended Order Information)
   * ZOR|RequestingUnit|ExecutingUnit|Priority|ClinicalIndication|RequestType|AuthNumber|GuideNumber|Quantity|Value
   */
  static parseZOR(message: HL7Message): ZORSegment | null {
    const zorSegment = HL7Parser.getSegment(message, 'ZOR');
    if (!zorSegment) {
      return null;
    }

    const quantityField = HL7Parser.getField(zorSegment, 8);
    const procedureQuantity = quantityField ? parseInt(quantityField, 10) : undefined;

    const valueField = HL7Parser.getField(zorSegment, 9);
    const procedureValue = valueField ? parseFloat(valueField) : undefined;

    return {
      requestingUnit: HL7Parser.getField(zorSegment, 1) || undefined,
      executingUnit: HL7Parser.getField(zorSegment, 2) || undefined,
      priority: HL7Parser.getField(zorSegment, 3) || undefined,
      clinicalIndication: HL7Parser.getField(zorSegment, 4) || undefined,
      requestType: HL7Parser.getField(zorSegment, 5) || undefined,
      authorizationNumber: HL7Parser.getField(zorSegment, 6) || undefined,
      guideNumber: HL7Parser.getField(zorSegment, 7) || undefined,
      procedureQuantity: isNaN(procedureQuantity!) ? undefined : procedureQuantity,
      procedureValue: isNaN(procedureValue!) ? undefined : procedureValue,
    };
  }

  /**
   * Parse all Tasy Z-segments from a message
   */
  static parseAll(message: HL7Message): {
    zpd?: ZPDSegment;
    zpv?: ZPVSegment;
    zin?: ZINSegment;
    zor?: ZORSegment;
  } {
    return {
      zpd: this.parseZPD(message) || undefined,
      zpv: this.parseZPV(message) || undefined,
      zin: this.parseZIN(message) || undefined,
      zor: this.parseZOR(message) || undefined,
    };
  }

  /**
   * Get marital status description (Brazilian codes)
   */
  static getMaritalStatusDescription(code: string): string {
    const descriptions: Record<string, string> = {
      S: 'Solteiro(a)',
      C: 'Casado(a)',
      V: 'Viúvo(a)',
      D: 'Divorciado(a)',
      P: 'Separado(a)',
      U: 'União Estável',
      I: 'Ignorado',
    };

    return descriptions[code] || code;
  }

  /**
   * Get ethnicity description (Brazilian IBGE codes)
   */
  static getEthnicityDescription(code: string): string {
    const descriptions: Record<string, string> = {
      '1': 'Branca',
      '2': 'Preta',
      '3': 'Parda',
      '4': 'Amarela',
      '5': 'Indígena',
      '9': 'Sem informação',
    };

    return descriptions[code] || code;
  }

  /**
   * Validate CPF (Brazilian individual taxpayer ID)
   */
  static validateCPF(cpf: string): boolean {
    // Remove non-digits
    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11) {
      return false;
    }

    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(cleaned)) {
      return false;
    }

    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 >= 10) digit1 = 0;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 >= 10) digit2 = 0;

    return parseInt(cleaned.charAt(9)) === digit1 && parseInt(cleaned.charAt(10)) === digit2;
  }

  /**
   * Validate CNS (Brazilian National Health Card)
   */
  static validateCNS(cns: string): boolean {
    // Remove non-digits
    const cleaned = cns.replace(/\D/g, '');

    if (cleaned.length !== 15) {
      return false;
    }

    // CNS starts with 1, 2, 7, 8, or 9
    const firstDigit = parseInt(cleaned.charAt(0));
    if (![1, 2, 7, 8, 9].includes(firstDigit)) {
      return false;
    }

    // Validate check digit
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      sum += parseInt(cleaned.charAt(i)) * (15 - i);
    }

    return sum % 11 === 0;
  }

  /**
   * Format CPF for display (XXX.XXX.XXX-XX)
   */
  static formatCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) {
      return cpf;
    }
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Format CNS for display (XXX XXXX XXXX XXXX)
   */
  static formatCNS(cns: string): string {
    const cleaned = cns.replace(/\D/g, '');
    if (cleaned.length !== 15) {
      return cns;
    }
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  }
}

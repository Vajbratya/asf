import { Patient, OperationOutcome } from "../types/fhir";
import { createOperationOutcome } from "../utils/fhir-helpers";

/**
 * BR-Core Validator
 * Validates FHIR resources against Brazilian FHIR profiles
 */
export class BRCoreValidator {
  /**
   * Validate a Patient resource against BR-Core profile
   */
  validatePatient(patient: Patient): OperationOutcome | null {
    const issues: OperationOutcome["issue"] = [];

    // Must have at least one identifier
    if (!patient.identifier || patient.identifier.length === 0) {
      issues.push({
        severity: "error",
        code: "required",
        diagnostics: "Patient must have at least one identifier (CPF or CNS)",
        expression: ["Patient.identifier"],
      });
      return { resourceType: "OperationOutcome", issue: issues };
    }

    // Check for CPF or CNS
    const hasCPF = patient.identifier.some(
      (id) => id.system === "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
    );
    const hasCNS = patient.identifier.some(
      (id) => id.system === "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns",
    );

    if (!hasCPF && !hasCNS) {
      issues.push({
        severity: "error",
        code: "required",
        diagnostics: "Patient must have either CPF or CNS identifier",
        expression: ["Patient.identifier"],
      });
    }

    // Validate CPF if present
    if (hasCPF) {
      const cpfIdentifier = patient.identifier.find(
        (id) =>
          id.system === "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
      );
      if (cpfIdentifier?.value) {
        const cpfValidation = this.validateCPF(cpfIdentifier.value);
        if (!cpfValidation.valid) {
          issues.push({
            severity: "error",
            code: "invalid",
            diagnostics: cpfValidation.error || "Invalid CPF",
            expression: [
              'Patient.identifier.where(system="http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf").value',
            ],
          });
        }
      }
    }

    // Validate CNS if present
    if (hasCNS) {
      const cnsIdentifier = patient.identifier.find(
        (id) =>
          id.system === "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns",
      );
      if (cnsIdentifier?.value) {
        const cnsValidation = this.validateCNS(cnsIdentifier.value);
        if (!cnsValidation.valid) {
          issues.push({
            severity: "error",
            code: "invalid",
            diagnostics: cnsValidation.error || "Invalid CNS",
            expression: [
              'Patient.identifier.where(system="http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns").value',
            ],
          });
        }
      }
    }

    // Return OperationOutcome if there are issues, null otherwise
    return issues.length > 0
      ? { resourceType: "OperationOutcome", issue: issues }
      : null;
  }

  /**
   * Validate CPF (Cadastro de Pessoas Físicas)
   * Brazilian individual taxpayer registry identification
   */
  validateCPF(cpf: string): { valid: boolean; error?: string } {
    // Remove non-digits
    const cleanCPF = cpf.replace(/\D/g, "");

    // Check length
    if (cleanCPF.length !== 11) {
      return { valid: false, error: "CPF must have 11 digits" };
    }

    // Check for known invalid CPFs (all digits the same)
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      return { valid: false, error: "CPF cannot have all digits the same" };
    }

    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let checkDigit1 = 11 - (sum % 11);
    if (checkDigit1 >= 10) checkDigit1 = 0;

    if (checkDigit1 !== parseInt(cleanCPF.charAt(9))) {
      return { valid: false, error: "Invalid CPF check digit" };
    }

    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    let checkDigit2 = 11 - (sum % 11);
    if (checkDigit2 >= 10) checkDigit2 = 0;

    if (checkDigit2 !== parseInt(cleanCPF.charAt(10))) {
      return { valid: false, error: "Invalid CPF check digit" };
    }

    return { valid: true };
  }

  /**
   * Validate CNS (Cartão Nacional de Saúde)
   * Brazilian National Health Card number
   */
  validateCNS(cns: string): { valid: boolean; error?: string } {
    // Remove non-digits
    const cleanCNS = cns.replace(/\D/g, "");

    // Check length
    if (cleanCNS.length !== 15) {
      return { valid: false, error: "CNS must have 15 digits" };
    }

    // CNS can start with 1, 2, 7, 8, or 9
    const firstDigit = parseInt(cleanCNS.charAt(0));
    if (![1, 2, 7, 8, 9].includes(firstDigit)) {
      return { valid: false, error: "CNS must start with 1, 2, 7, 8, or 9" };
    }

    // Validate CNS starting with 1 or 2 (definitive)
    if (firstDigit === 1 || firstDigit === 2) {
      return this.validateDefinitiveCNS(cleanCNS);
    }

    // Validate CNS starting with 7, 8, or 9 (provisional)
    return this.validateProvisionalCNS(cleanCNS);
  }

  /**
   * Validate definitive CNS (starts with 1 or 2)
   */
  private validateDefinitiveCNS(cns: string): {
    valid: boolean;
    error?: string;
  } {
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      sum += parseInt(cns.charAt(i)) * (15 - i);
    }

    if (sum % 11 !== 0) {
      return { valid: false, error: "Invalid CNS check digit" };
    }

    return { valid: true };
  }

  /**
   * Validate provisional CNS (starts with 7, 8, or 9)
   */
  private validateProvisionalCNS(cns: string): {
    valid: boolean;
    error?: string;
  } {
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      sum += parseInt(cns.charAt(i)) * (15 - i);
    }

    if (sum % 11 !== 0) {
      return { valid: false, error: "Invalid CNS check digit" };
    }

    return { valid: true };
  }
}

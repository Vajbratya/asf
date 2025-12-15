/**
 * Brazilian Healthcare Validators
 *
 * Validation utilities for CPF (Cadastro de Pessoas Físicas) and
 * CNS (Cartão Nacional de Saúde)
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate CPF (Brazilian individual taxpayer registry)
 *
 * CPF format: XXX.XXX.XXX-XX (11 digits)
 * Uses Modulo 11 algorithm for check digits
 */
export function validateCPF(cpf: string): ValidationResult {
  if (!cpf || typeof cpf !== 'string') {
    return { valid: false, error: 'CPF is required and must be a string' };
  }

  // Remove non-digits
  const cleaned = cpf.replace(/\D/g, '');

  // Check length
  if (cleaned.length !== 11) {
    return { valid: false, error: 'CPF must have 11 digits' };
  }

  // Check for known invalid CPFs (all digits the same)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { valid: false, error: 'CPF cannot have all digits the same' };
  }

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let checkDigit1 = 11 - (sum % 11);
  if (checkDigit1 >= 10) checkDigit1 = 0;

  if (checkDigit1 !== parseInt(cleaned.charAt(9))) {
    return { valid: false, error: 'Invalid CPF check digit' };
  }

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  let checkDigit2 = 11 - (sum % 11);
  if (checkDigit2 >= 10) checkDigit2 = 0;

  if (checkDigit2 !== parseInt(cleaned.charAt(10))) {
    return { valid: false, error: 'Invalid CPF check digit' };
  }

  return { valid: true };
}

/**
 * Validate CNS (Brazilian National Health Card)
 *
 * CNS format: XXX XXXX XXXX XXXX (15 digits)
 * Can start with 1, 2 (definitive) or 7, 8, 9 (provisional)
 */
export function validateCNS(cns: string): ValidationResult {
  if (!cns || typeof cns !== 'string') {
    return { valid: false, error: 'CNS is required and must be a string' };
  }

  // Remove non-digits
  const cleaned = cns.replace(/\D/g, '');

  // Check length
  if (cleaned.length !== 15) {
    return { valid: false, error: 'CNS must have 15 digits' };
  }

  // CNS can start with 1, 2, 7, 8, or 9
  const firstDigit = parseInt(cleaned.charAt(0));
  if (![1, 2, 7, 8, 9].includes(firstDigit)) {
    return { valid: false, error: 'CNS must start with 1, 2, 7, 8, or 9' };
  }

  // Validate CNS using Modulo 11 algorithm
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += parseInt(cleaned.charAt(i)) * (15 - i);
  }

  if (sum % 11 !== 0) {
    return { valid: false, error: 'Invalid CNS check digit' };
  }

  return { valid: true };
}

/**
 * Format CPF for display
 * @example formatCPF('12345678901') => '123.456.789-01'
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) {
    return cpf;
  }
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Format CNS for display
 * @example formatCNS('123456789012345') => '123 4567 8901 2345'
 */
export function formatCNS(cns: string): string {
  const cleaned = cns.replace(/\D/g, '');
  if (cleaned.length !== 15) {
    return cns;
  }
  return cleaned.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
}

/**
 * Clean CPF/CNS by removing non-digit characters
 */
export function cleanDocument(document: string): string {
  return document.replace(/\D/g, '');
}

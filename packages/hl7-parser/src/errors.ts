/**
 * HL7 Parser Error Hierarchy
 *
 * Custom error classes for better error handling and debugging
 */

/**
 * Base class for all HL7-related errors
 */
export class HL7Error extends Error {
  /**
   * Create an HL7 error
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   * @param segment - Optional segment name where the error occurred
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly segment?: string
  ) {
    super(message);
    this.name = 'HL7Error';
    Object.setPrototypeOf(this, HL7Error.prototype);
  }
}

/**
 * Error thrown when HL7 message parsing fails
 *
 * @example
 * ```typescript
 * throw new HL7ParseError('Invalid MSH segment', 'INVALID_MSH', 'MSH');
 * ```
 */
export class HL7ParseError extends HL7Error {
  constructor(message: string, code: string = 'PARSE_ERROR', segment?: string) {
    super(message, code, segment);
    this.name = 'HL7ParseError';
    Object.setPrototypeOf(this, HL7ParseError.prototype);
  }
}

/**
 * Error thrown when HL7 message validation fails
 *
 * @example
 * ```typescript
 * throw new HL7ValidationError('Missing required field', 'MISSING_FIELD', 'PID');
 * ```
 */
export class HL7ValidationError extends HL7Error {
  constructor(message: string, code: string = 'VALIDATION_ERROR', segment?: string) {
    super(message, code, segment);
    this.name = 'HL7ValidationError';
    Object.setPrototypeOf(this, HL7ValidationError.prototype);
  }
}

/**
 * Error thrown when MLLP connection or communication fails
 *
 * @example
 * ```typescript
 * throw new MLLPConnectionError('Connection timeout', 'TIMEOUT');
 * ```
 */
export class MLLPConnectionError extends HL7Error {
  constructor(message: string, code: string = 'CONNECTION_ERROR') {
    super(message, code);
    this.name = 'MLLPConnectionError';
    Object.setPrototypeOf(this, MLLPConnectionError.prototype);
  }
}

/**
 * Error thrown when FHIR transformation fails
 *
 * @example
 * ```typescript
 * throw new FHIRTransformError('Cannot transform invalid patient data', 'TRANSFORM_ERROR');
 * ```
 */
export class FHIRTransformError extends HL7Error {
  constructor(message: string, code: string = 'FHIR_TRANSFORM_ERROR') {
    super(message, code);
    this.name = 'FHIRTransformError';
    Object.setPrototypeOf(this, FHIRTransformError.prototype);
  }
}

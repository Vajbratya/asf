/**
 * IntegraBrasil HL7 Parser
 *
 * Complete HL7 v2 parsing library with Brazilian healthcare extensions
 */

// Core parser
export { HL7Parser } from './parser';
export * from './types';

// Message parsers
export { ADTParser, ADTMessage } from './messages/adt';
export { ORMParser, ORMMessage } from './messages/orm';
export { ORUParser, ORUMessage } from './messages/oru';

// Tasy Z-segments
export {
  ZSegmentParser,
  ZPDSegment,
  ZPVSegment,
  ZINSegment,
  ZORSegment,
} from './segments/z-segments';

// FHIR transformer
export { FHIRTransformer, FHIRBundle, FHIRBundleEntry } from './transformers/to-fhir';

// MLLP protocol
export { MLLPServer, MLLPServerOptions, MLLPServerEvents } from './mllp/server';

export { MLLPClient, MLLPClientOptions, SendResult } from './mllp/client';

// Validators
export {
  validateCPF,
  validateCNS,
  formatCPF,
  formatCNS,
  cleanDocument,
  ValidationResult,
} from './utils/validators';

// Error types
export {
  HL7Error,
  HL7ParseError,
  HL7ValidationError,
  MLLPConnectionError,
  FHIRTransformError,
} from './errors';

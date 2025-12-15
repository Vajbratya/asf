'use client';

import { TasyConfigForm } from './tasy-config-form';

// MV Soul uses similar HL7 configuration to Tasy
// This is a simplified version - in production, you'd have vendor-specific fields
export function MVSoulConfigForm() {
  return <TasyConfigForm />;
}

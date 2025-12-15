'use client';

import { TasyConfigForm } from './tasy-config-form';

// Pixeon also uses HL7 v2.x similar configuration
// This is a simplified version - in production, you'd have vendor-specific fields
export function PixeonConfigForm() {
  return <TasyConfigForm />;
}

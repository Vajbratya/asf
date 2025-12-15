import { NextResponse } from 'next/server';

// Mock connectors for demo purposes
const mockConnectors = [
  {
    id: '1',
    name: 'Tasy',
    type: 'HL7',
    status: 'active',
    lastSync: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'MV Soul',
    type: 'FHIR',
    status: 'active',
    lastSync: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Pixeon',
    type: 'HL7',
    status: 'pending',
    lastSync: null,
  },
];

export async function GET() {
  return NextResponse.json({
    connectors: mockConnectors,
    total: mockConnectors.length,
  });
}

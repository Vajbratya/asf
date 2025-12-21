/**
 * INTEGRA by Laudos.AI - Usage Simulation Script
 *
 * This script simulates real-world usage of the INTEGRA platform,
 * generating HL7 messages from multiple hospital systems.
 *
 * Usage: npx tsx scripts/simulate-usage.ts
 */

import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Initialize Redis with Upstash
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// ============================================================================
// SAMPLE HL7 MESSAGE TEMPLATES
// ============================================================================

const HL7_TEMPLATES = {
  // ADT - Admission, Discharge, Transfer
  ADT_A01: (
    patient: Patient
  ) => `MSH|^~\\&|TASY|HOSPITAL_EINSTEIN|INTEGRA|LAUDOSAI|${formatDateTime()}||ADT^A01|${generateMsgId()}|P|2.4|||AL|NE
EVN|A01|${formatDateTime()}
PID|1||${patient.mrn}^^^HOSP^MR||${patient.lastName}^${patient.firstName}||${patient.dob}|${patient.gender}|||${patient.address}||${patient.phone}|||||${patient.cpf}
PV1|1|I|${patient.unit}^${patient.room}^${patient.bed}||||${patient.attendingDoctor}^DR|||||||||||${patient.visitId}|||||||||||||||||||||||${formatDateTime()}`,

  ADT_A03: (
    patient: Patient
  ) => `MSH|^~\\&|MV_SOUL|HOSPITAL_SIRIO|INTEGRA|LAUDOSAI|${formatDateTime()}||ADT^A03|${generateMsgId()}|P|2.4|||AL|NE
EVN|A03|${formatDateTime()}
PID|1||${patient.mrn}^^^HOSP^MR||${patient.lastName}^${patient.firstName}||${patient.dob}|${patient.gender}|||${patient.address}||${patient.phone}|||||${patient.cpf}
PV1|1|I|${patient.unit}^${patient.room}^${patient.bed}||||${patient.attendingDoctor}^DR|||||||||||${patient.visitId}|||||||||||||||||||||||${formatDateTime()}`,

  // ORM - Order messages
  ORM_O01: (
    patient: Patient,
    order: Order
  ) => `MSH|^~\\&|PIXEON|LAB_FLEURY|INTEGRA|LAUDOSAI|${formatDateTime()}||ORM^O01|${generateMsgId()}|P|2.4|||AL|NE
PID|1||${patient.mrn}^^^HOSP^MR||${patient.lastName}^${patient.firstName}||${patient.dob}|${patient.gender}|||${patient.address}||${patient.phone}|||||${patient.cpf}
PV1|1|O|LAB^001^01||||${patient.attendingDoctor}^DR
ORC|NW|${order.orderId}||${order.orderGroupId}|CM||1^${formatDateTime()}^${formatDateTime()}||${formatDateTime()}|${order.orderingDoctor}^DR
OBR|1|${order.orderId}||${order.testCode}^${order.testName}^L|||${formatDateTime()}|||||||||${order.orderingDoctor}^DR||||||${formatDateTime()}|||F`,

  // ORU - Results messages
  ORU_R01: (
    patient: Patient,
    result: LabResult
  ) => `MSH|^~\\&|TASY|LAB_DASA|INTEGRA|LAUDOSAI|${formatDateTime()}||ORU^R01|${generateMsgId()}|P|2.4|||AL|NE
PID|1||${patient.mrn}^^^HOSP^MR||${patient.lastName}^${patient.firstName}||${patient.dob}|${patient.gender}|||${patient.address}||${patient.phone}|||||${patient.cpf}
OBR|1|${result.orderId}||${result.testCode}^${result.testName}^L|||${formatDateTime()}|||||||||${patient.attendingDoctor}^DR
OBX|1|NM|${result.testCode}^${result.testName}^L||${result.value}|${result.unit}|${result.refRange}|${result.flag}|||F|||${formatDateTime()}`,

  // SIU - Scheduling messages
  SIU_S12: (
    patient: Patient,
    appointment: Appointment
  ) => `MSH|^~\\&|MV_SOUL|CLINICA_IMED|INTEGRA|LAUDOSAI|${formatDateTime()}||SIU^S12|${generateMsgId()}|P|2.4|||AL|NE
SCH|${appointment.appointmentId}||${appointment.appointmentId}|||${appointment.type}|${appointment.reason}|||${appointment.duration}|min|^^${appointment.duration}^${formatDateTime()}^${formatDateTime()}
PID|1||${patient.mrn}^^^HOSP^MR||${patient.lastName}^${patient.firstName}||${patient.dob}|${patient.gender}|||${patient.address}||${patient.phone}|||||${patient.cpf}
AIG|1||${appointment.resourceId}^${appointment.resourceName}^L`,
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Patient {
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  cpf: string;
  cns?: string;
  address: string;
  phone: string;
  unit: string;
  room: string;
  bed: string;
  visitId: string;
  attendingDoctor: string;
}

interface Order {
  orderId: string;
  orderGroupId: string;
  testCode: string;
  testName: string;
  orderingDoctor: string;
}

interface LabResult {
  orderId: string;
  testCode: string;
  testName: string;
  value: string;
  unit: string;
  refRange: string;
  flag: string;
}

interface Appointment {
  appointmentId: string;
  type: string;
  reason: string;
  duration: number;
  resourceId: string;
  resourceName: string;
}

// ============================================================================
// DATA GENERATORS
// ============================================================================

const FIRST_NAMES = [
  'João',
  'Maria',
  'Pedro',
  'Ana',
  'Carlos',
  'Julia',
  'Lucas',
  'Beatriz',
  'Gabriel',
  'Sofia',
];
const LAST_NAMES = [
  'Silva',
  'Santos',
  'Oliveira',
  'Souza',
  'Rodrigues',
  'Ferreira',
  'Alves',
  'Pereira',
  'Lima',
  'Gomes',
];
const UNITS = [
  'UTI',
  'ENFERMARIA',
  'PRONTO_SOCORRO',
  'CENTRO_CIRURGICO',
  'ONCOLOGIA',
  'CARDIOLOGIA',
];
const DOCTORS = [
  'DR. ROBERTO ALMEIDA',
  'DRA. CLAUDIA SANTOS',
  'DR. FERNANDO COSTA',
  'DRA. PATRICIA LIMA',
];

const LAB_TESTS = [
  { code: 'HGB', name: 'Hemoglobina', unit: 'g/dL', min: 12, max: 16 },
  { code: 'GLU', name: 'Glicose', unit: 'mg/dL', min: 70, max: 100 },
  { code: 'CREA', name: 'Creatinina', unit: 'mg/dL', min: 0.7, max: 1.3 },
  { code: 'TSH', name: 'TSH', unit: 'mUI/L', min: 0.4, max: 4.0 },
  { code: 'PCT', name: 'Procalcitonina', unit: 'ng/mL', min: 0, max: 0.5 },
];

function generateCPF(): string {
  const rand = () => Math.floor(Math.random() * 9);
  const n = Array(9).fill(0).map(rand);

  // Calculate first digit
  let d1 = n.reduce((acc, val, i) => acc + val * (10 - i), 0) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  n.push(d1);

  // Calculate second digit
  let d2 = n.reduce((acc, val, i) => acc + val * (11 - i), 0) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  n.push(d2);

  return n.join('');
}

function generatePatient(): Patient {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const unit = UNITS[Math.floor(Math.random() * UNITS.length)];
  const doctor = DOCTORS[Math.floor(Math.random() * DOCTORS.length)];

  const year = 1950 + Math.floor(Math.random() * 50);
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');

  return {
    mrn: `MRN${String(Math.floor(Math.random() * 1000000)).padStart(7, '0')}`,
    firstName,
    lastName,
    dob: `${year}${month}${day}`,
    gender: Math.random() > 0.5 ? 'M' : 'F',
    cpf: generateCPF(),
    address: `RUA ${lastName.toUpperCase()}^${100 + Math.floor(Math.random() * 900)}^^SAO PAULO^SP^${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    phone: `11${String(Math.floor(Math.random() * 100000000)).padStart(9, '0')}`,
    unit,
    room: String(100 + Math.floor(Math.random() * 100)),
    bed: String(1 + Math.floor(Math.random() * 4)),
    visitId: `V${Date.now()}${Math.floor(Math.random() * 1000)}`,
    attendingDoctor: doctor,
  };
}

function generateOrder(patient: Patient): Order {
  const test = LAB_TESTS[Math.floor(Math.random() * LAB_TESTS.length)];
  return {
    orderId: `ORD${Date.now()}`,
    orderGroupId: `GRP${Date.now()}`,
    testCode: test.code,
    testName: test.name,
    orderingDoctor: patient.attendingDoctor,
  };
}

function generateLabResult(patient: Patient): LabResult {
  const test = LAB_TESTS[Math.floor(Math.random() * LAB_TESTS.length)];
  const value = (test.min + Math.random() * (test.max - test.min) * 1.5).toFixed(2);
  const numValue = parseFloat(value);

  let flag = 'N';
  if (numValue < test.min) flag = 'L';
  if (numValue > test.max) flag = 'H';

  return {
    orderId: `ORD${Date.now()}`,
    testCode: test.code,
    testName: test.name,
    value,
    unit: test.unit,
    refRange: `${test.min}-${test.max}`,
    flag,
  };
}

function generateAppointment(): Appointment {
  const types = ['CONSULTA', 'RETORNO', 'EXAME', 'PROCEDIMENTO'];
  const reasons = ['CHECK-UP', 'FOLLOW-UP', 'SINTOMAS', 'ROTINA'];

  return {
    appointmentId: `APT${Date.now()}`,
    type: types[Math.floor(Math.random() * types.length)],
    reason: reasons[Math.floor(Math.random() * reasons.length)],
    duration: [15, 30, 45, 60][Math.floor(Math.random() * 4)],
    resourceId: `DOC${Math.floor(Math.random() * 100)}`,
    resourceName: DOCTORS[Math.floor(Math.random() * DOCTORS.length)],
  };
}

function formatDateTime(): string {
  const now = new Date();
  return now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

function generateMsgId(): string {
  return `MSG${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// ============================================================================
// SIMULATION ENGINE
// ============================================================================

interface SimulationConfig {
  organizationId: string;
  connectorId: string;
  messagesPerMinute: number;
  duration: number; // in minutes
  messageTypes: ('ADT' | 'ORM' | 'ORU' | 'SIU')[];
}

async function simulateMessage(config: SimulationConfig): Promise<void> {
  const patient = generatePatient();
  const messageType = config.messageTypes[Math.floor(Math.random() * config.messageTypes.length)];

  let rawMessage: string;
  let specificType: string;

  switch (messageType) {
    case 'ADT':
      specificType = Math.random() > 0.3 ? 'ADT_A01' : 'ADT_A03';
      rawMessage = HL7_TEMPLATES[specificType](patient);
      break;
    case 'ORM':
      const order = generateOrder(patient);
      rawMessage = HL7_TEMPLATES.ORM_O01(patient, order);
      specificType = 'ORM_O01';
      break;
    case 'ORU':
      const result = generateLabResult(patient);
      rawMessage = HL7_TEMPLATES.ORU_R01(patient, result);
      specificType = 'ORU_R01';
      break;
    case 'SIU':
      const appointment = generateAppointment();
      rawMessage = HL7_TEMPLATES.SIU_S12(patient, appointment);
      specificType = 'SIU_S12';
      break;
    default:
      throw new Error(`Unknown message type: ${messageType}`);
  }

  // Create message in database
  const message = await prisma.message.create({
    data: {
      connectorId: config.connectorId,
      organizationId: config.organizationId,
      direction: 'INBOUND',
      status: 'SUCCESS',
      rawMessage,
      protocol: 'HL7V2',
      messageType: specificType,
      processingTime: Math.floor(Math.random() * 100) + 10,
      processedAt: new Date(),
      payload: {
        patient: {
          mrn: patient.mrn,
          name: `${patient.firstName} ${patient.lastName}`,
          cpf: patient.cpf,
          gender: patient.gender,
        },
        messageType: specificType,
        sourceSystem: rawMessage.includes('TASY')
          ? 'TASY'
          : rawMessage.includes('MV_SOUL')
            ? 'MV_SOUL'
            : 'PIXEON',
      },
    },
  });

  // Track usage in Redis if available
  if (redis) {
    const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const key = `usage:${config.organizationId}:${period}`;
    await redis.hincrby(key, 'messages', 1);
    await redis.hincrby(key, `type:${messageType}`, 1);
  }

  console.log(`[${new Date().toISOString()}] Created ${specificType} message: ${message.id}`);
}

async function runSimulation(config: SimulationConfig): Promise<void> {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         INTEGRA by Laudos.AI - Usage Simulator             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Organization: ${config.organizationId}`);
  console.log(`Connector: ${config.connectorId}`);
  console.log(`Rate: ${config.messagesPerMinute} messages/minute`);
  console.log(`Duration: ${config.duration} minutes`);
  console.log(`Message Types: ${config.messageTypes.join(', ')}`);
  console.log('');
  console.log('Starting simulation...');
  console.log('');

  const intervalMs = (60 * 1000) / config.messagesPerMinute;
  const endTime = Date.now() + config.duration * 60 * 1000;
  let messageCount = 0;

  while (Date.now() < endTime) {
    try {
      await simulateMessage(config);
      messageCount++;
    } catch (error) {
      console.error('Error simulating message:', error);
    }

    // Wait for next message
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Simulation complete! Generated ${messageCount} messages.`);
  console.log('════════════════════════════════════════════════════════════');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  // Check for existing organization or create demo one
  let org = await prisma.organization.findFirst({
    where: { slug: 'demo-hospital' },
    include: { connectors: true },
  });

  if (!org) {
    console.log('Creating demo organization...');
    org = await prisma.organization.create({
      data: {
        name: 'Hospital Demo - Grupo Laudos.AI',
        slug: 'demo-hospital',
        type: 'HOSPITAL',
        cnpj: '12345678000199',
        planType: 'PROFESSIONAL',
        connectors: {
          create: [
            {
              name: 'Tasy - Pronto Socorro',
              type: 'HL7_V2',
              vendor: 'TASY',
              status: 'ACTIVE',
              config: { host: '192.168.1.100', port: 2575 },
            },
            {
              name: 'MV Soul - Internação',
              type: 'HL7_V2',
              vendor: 'MV_SOUL',
              status: 'ACTIVE',
              config: { host: '192.168.1.101', port: 2575 },
            },
            {
              name: 'Pixeon - Laboratório',
              type: 'HL7_V2',
              vendor: 'PIXEON',
              status: 'ACTIVE',
              config: { host: '192.168.1.102', port: 2575 },
            },
          ],
        },
      },
      include: { connectors: true },
    });
  }

  const connector = org.connectors[0];

  if (!connector) {
    console.error('No connectors found for organization');
    process.exit(1);
  }

  // BULK SIMULATION - Generate 500 messages FAST
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         INTEGRA by Laudos.AI - BULK Simulator              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Generating 500 messages in bulk mode...');
  console.log('');

  const messageTypes: ('ADT' | 'ORM' | 'ORU' | 'SIU')[] = ['ADT', 'ORM', 'ORU', 'SIU'];
  const connectors = org.connectors;
  let created = 0;

  for (let i = 0; i < 500; i++) {
    const connector = connectors[i % connectors.length];
    const config = {
      organizationId: org.id,
      connectorId: connector.id,
      messagesPerMinute: 1000,
      duration: 1,
      messageTypes,
    };

    try {
      await simulateMessage(config);
      created++;
      if (created % 50 === 0) {
        console.log(`Progress: ${created}/500 messages created`);
      }
    } catch (error) {
      console.error(`Error creating message ${i}:`, error);
    }
  }

  console.log('');
  console.log(`Bulk simulation complete! Created ${created} messages.`);

  // Show final stats
  const messageCount = await prisma.message.count({
    where: { organizationId: org.id },
  });

  const messagesByType = await prisma.message.groupBy({
    by: ['messageType'],
    where: { organizationId: org.id },
    _count: true,
  });

  console.log('');
  console.log('Final Statistics:');
  console.log(`Total Messages: ${messageCount}`);
  console.log('By Type:');
  messagesByType.forEach(({ messageType, _count }) => {
    console.log(`  ${messageType}: ${_count}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

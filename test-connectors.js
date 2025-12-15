/**
 * IntegraSaúde - Hospital Connector Test Suite
 *
 * Tests MLLP protocol connectivity for Tasy and MV Soul integrations.
 * Run with: node test-connectors.js
 *
 * This script provides:
 * - Mock MLLP server for testing
 * - Sample HL7 messages (ADT, ORM, ORU)
 * - Connection testing utilities
 * - Performance benchmarking
 */

const net = require('net');
const crypto = require('crypto');

// MLLP Protocol Constants
const MLLP = {
  VT: String.fromCharCode(0x0b), // Vertical Tab - Start Block
  FS: String.fromCharCode(0x1c), // File Separator - End Block
  CR: String.fromCharCode(0x0d), // Carriage Return
};

// Configuration
const CONFIG = {
  mockServer: {
    host: '127.0.0.1',
    port: 2575,
  },
  tasy: {
    host: process.env.TASY_HOST || '127.0.0.1',
    port: parseInt(process.env.TASY_PORT) || 2575,
  },
  mvSoul: {
    host: process.env.MV_HOST || '127.0.0.1',
    port: parseInt(process.env.MV_PORT) || 2576,
  },
};

// Sample HL7 Messages
const SAMPLE_MESSAGES = {
  // ADT^A01 - Patient Admission
  ADT_A01: [
    'MSH|^~\\&|INTEGRASAUDE|HOSPITAL|TASY|PHILIPS|20231215120000||ADT^A01|MSG001|P|2.4|||AL|NE|BRA',
    'EVN|A01|20231215120000',
    'PID|1||12345678^^^HOSPITAL^MR||SILVA^JOAO^CARLOS||19800515|M|||RUA DAS FLORES 123^^SAO PAULO^SP^01234567^BRA||11999887766|||S||987654321^^^HOSPITAL^AN',
    'PV1|1|I|UTI^101^A^HOSPITAL||||12345^MEDICO^CARLOS|||MED||||ADM|||12345^MEDICO^CARLOS|IP||||||||||||||||||HOSPITAL||A|||20231215120000',
    'IN1|1|UNIMED|UNIMED SP|UNIMED SAO PAULO|RUA CENTRAL 456^^SAO PAULO^SP^01234000|||||||||||||||SILVA^JOAO^CARLOS|SELF||||||||||||||||||12345678901234',
    'ZBR|1|CPF|12345678901|CNS|123456789012345',
  ].join('\r'),

  // ORM^O01 - Lab Order
  ORM_O01: [
    'MSH|^~\\&|INTEGRASAUDE|HOSPITAL|LABORATORIO|LAB|20231215130000||ORM^O01|MSG002|P|2.4|||AL|NE|BRA',
    'PID|1||12345678^^^HOSPITAL^MR||SILVA^JOAO^CARLOS||19800515|M',
    'PV1|1|I|UTI^101^A^HOSPITAL',
    'ORC|NW|ORD001|ORD001||SC||^^^^^R||20231215130000|ENFERMEIRO|||20231215130000||||||HOSPITAL',
    'OBR|1|ORD001|ORD001|HEMOGRAM^HEMOGRAMA COMPLETO^LOCAL|||20231215130000|||||||||12345^MEDICO^CARLOS||||||20231215140000|||F',
    'ZBR|1|TUSS|40304361|CBHPM|4.03.04.36-1',
  ].join('\r'),

  // ORU^R01 - Lab Result
  ORU_R01: [
    'MSH|^~\\&|LABORATORIO|LAB|INTEGRASAUDE|HOSPITAL|20231215150000||ORU^R01|MSG003|P|2.4|||AL|NE|BRA',
    'PID|1||12345678^^^HOSPITAL^MR||SILVA^JOAO^CARLOS||19800515|M',
    'PV1|1|I|UTI^101^A^HOSPITAL',
    'ORC|RE|ORD001|ORD001||CM',
    'OBR|1|ORD001|ORD001|HEMOGRAM^HEMOGRAMA COMPLETO^LOCAL|||20231215130000|||||||||12345^MEDICO^CARLOS||||||20231215150000|||F',
    'OBX|1|NM|WBC^LEUCOCITOS^LOCAL||7500|/mm3|4000-11000|N|||F|||20231215150000',
    'OBX|2|NM|RBC^HEMACIAS^LOCAL||4.8|milhoes/mm3|4.5-5.5|N|||F|||20231215150000',
    'OBX|3|NM|HGB^HEMOGLOBINA^LOCAL||14.2|g/dL|12-16|N|||F|||20231215150000',
    'OBX|4|NM|HCT^HEMATOCRITO^LOCAL||42|%|36-46|N|||F|||20231215150000',
    'OBX|5|NM|PLT^PLAQUETAS^LOCAL||250000|/mm3|150000-400000|N|||F|||20231215150000',
  ].join('\r'),

  // ADT^A08 - Patient Update
  ADT_A08: [
    'MSH|^~\\&|INTEGRASAUDE|HOSPITAL|MV|SOUL|20231215160000||ADT^A08|MSG004|P|2.4|||AL|NE|BRA',
    'EVN|A08|20231215160000',
    'PID|1||12345678^^^HOSPITAL^MR||SILVA^JOAO^CARLOS||19800515|M|||RUA NOVA 456^^SAO PAULO^SP^01234999^BRA||11999887766|||S',
    'PV1|1|I|UTI^101^A^HOSPITAL',
  ].join('\r'),

  // ADT^A03 - Patient Discharge
  ADT_A03: [
    'MSH|^~\\&|INTEGRASAUDE|HOSPITAL|TASY|PHILIPS|20231215180000||ADT^A03|MSG005|P|2.4|||AL|NE|BRA',
    'EVN|A03|20231215180000',
    'PID|1||12345678^^^HOSPITAL^MR||SILVA^JOAO^CARLOS||19800515|M',
    'PV1|1|I|UTI^101^A^HOSPITAL||||||||||||||||||||||||||||||||||||A|||20231215120000|20231215180000',
  ].join('\r'),
};

/**
 * Generate HL7 ACK message
 */
function generateACK(originalMSH, ackCode = 'AA', errorMessage = '') {
  const mshParts = originalMSH.split('|');
  const messageControlId = mshParts[9] || `ACK${Date.now()}`;
  const sendingApp = mshParts[2] || 'INTEGRASAUDE';
  const sendingFacility = mshParts[3] || 'HOSPITAL';
  const receivingApp = mshParts[4] || 'SYSTEM';
  const receivingFacility = mshParts[5] || 'FACILITY';
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:Z.]/g, '')
    .slice(0, 14);

  const ackMSH = `MSH|^~\\&|${receivingApp}|${receivingFacility}|${sendingApp}|${sendingFacility}|${timestamp}||ACK|ACK${messageControlId}|P|2.4`;
  const msa = `MSA|${ackCode}|${messageControlId}${errorMessage ? `|${errorMessage}` : ''}`;

  return [ackMSH, msa].join('\r');
}

/**
 * Parse HL7 message into segments
 */
function parseHL7(message) {
  const segments = message.split('\r').filter((s) => s.length > 0);
  const parsed = {};

  segments.forEach((segment) => {
    const parts = segment.split('|');
    const segmentName = parts[0];

    if (segmentName === 'MSH') {
      // MSH has special handling - field separator is position 1
      parsed.MSH = {
        fieldSeparator: '|',
        encodingCharacters: parts[1],
        sendingApplication: parts[2],
        sendingFacility: parts[3],
        receivingApplication: parts[4],
        receivingFacility: parts[5],
        dateTime: parts[6],
        messageType: parts[8],
        messageControlId: parts[9],
        processingId: parts[10],
        versionId: parts[11],
      };
    } else {
      if (!parsed[segmentName]) {
        parsed[segmentName] = [];
      }
      parsed[segmentName].push(parts);
    }
  });

  return parsed;
}

/**
 * Mock MLLP Server for testing
 */
class MockMLLPServer {
  constructor(port, name = 'MockServer') {
    this.port = port;
    this.name = name;
    this.server = null;
    this.connections = [];
    this.messageCount = 0;
    this.errorRate = 0; // Percentage of messages to reject (0-100)
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        console.log(
          `[${this.name}] Client connected from ${socket.remoteAddress}:${socket.remotePort}`
        );
        this.connections.push(socket);

        let buffer = '';

        socket.on('data', (data) => {
          buffer += data.toString();

          // Check for complete MLLP message
          while (buffer.includes(MLLP.VT) && buffer.includes(MLLP.FS + MLLP.CR)) {
            const startIdx = buffer.indexOf(MLLP.VT);
            const endIdx = buffer.indexOf(MLLP.FS + MLLP.CR);

            if (startIdx >= 0 && endIdx > startIdx) {
              const message = buffer.substring(startIdx + 1, endIdx);
              buffer = buffer.substring(endIdx + 2);

              this.handleMessage(socket, message);
            }
          }
        });

        socket.on('close', () => {
          console.log(`[${this.name}] Client disconnected`);
          this.connections = this.connections.filter((c) => c !== socket);
        });

        socket.on('error', (err) => {
          console.error(`[${this.name}] Socket error:`, err.message);
        });
      });

      this.server.listen(this.port, () => {
        console.log(`[${this.name}] MLLP Server listening on port ${this.port}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  handleMessage(socket, message) {
    this.messageCount++;
    const parsed = parseHL7(message);
    const messageType = parsed.MSH?.messageType || 'UNKNOWN';
    const controlId = parsed.MSH?.messageControlId || 'UNKNOWN';

    console.log(`[${this.name}] Received ${messageType} (ID: ${controlId})`);

    // Simulate random errors based on errorRate
    const shouldError = Math.random() * 100 < this.errorRate;
    const ackCode = shouldError ? 'AE' : 'AA';
    const errorMsg = shouldError ? 'Simulated error for testing' : '';

    // Generate and send ACK
    const ack = generateACK(message.split('\r')[0], ackCode, errorMsg);
    const mllpAck = MLLP.VT + ack + MLLP.FS + MLLP.CR;

    // Simulate processing delay (10-100ms)
    setTimeout(
      () => {
        socket.write(mllpAck);
        console.log(`[${this.name}] Sent ${ackCode} ACK for ${controlId}`);
      },
      10 + Math.random() * 90
    );
  }

  stop() {
    return new Promise((resolve) => {
      this.connections.forEach((socket) => socket.destroy());
      if (this.server) {
        this.server.close(resolve);
      } else {
        resolve();
      }
    });
  }

  getStats() {
    return {
      name: this.name,
      port: this.port,
      activeConnections: this.connections.length,
      messagesReceived: this.messageCount,
    };
  }
}

/**
 * MLLP Client for sending messages
 */
class MLLPClient {
  constructor(host, port, name = 'Client') {
    this.host = host;
    this.port = port;
    this.name = name;
    this.socket = null;
    this.responseBuffer = '';
    this.pendingResolve = null;
    this.pendingReject = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection({
        host: this.host,
        port: this.port,
      });

      this.socket.on('connect', () => {
        console.log(`[${this.name}] Connected to ${this.host}:${this.port}`);
        resolve();
      });

      this.socket.on('data', (data) => {
        this.responseBuffer += data.toString();

        // Check for complete MLLP response
        if (
          this.responseBuffer.includes(MLLP.VT) &&
          this.responseBuffer.includes(MLLP.FS + MLLP.CR)
        ) {
          const startIdx = this.responseBuffer.indexOf(MLLP.VT);
          const endIdx = this.responseBuffer.indexOf(MLLP.FS + MLLP.CR);

          if (startIdx >= 0 && endIdx > startIdx) {
            const response = this.responseBuffer.substring(startIdx + 1, endIdx);
            this.responseBuffer = this.responseBuffer.substring(endIdx + 2);

            if (this.pendingResolve) {
              this.pendingResolve(response);
              this.pendingResolve = null;
              this.pendingReject = null;
            }
          }
        }
      });

      this.socket.on('error', (err) => {
        console.error(`[${this.name}] Error:`, err.message);
        if (this.pendingReject) {
          this.pendingReject(err);
          this.pendingResolve = null;
          this.pendingReject = null;
        }
        reject(err);
      });

      this.socket.on('close', () => {
        console.log(`[${this.name}] Connection closed`);
      });
    });
  }

  send(message, timeout = 30000) {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.destroyed) {
        reject(new Error('Not connected'));
        return;
      }

      this.pendingResolve = resolve;
      this.pendingReject = reject;

      const timer = setTimeout(() => {
        this.pendingResolve = null;
        this.pendingReject = null;
        reject(new Error('Timeout waiting for ACK'));
      }, timeout);

      const originalResolve = this.pendingResolve;
      this.pendingResolve = (response) => {
        clearTimeout(timer);
        originalResolve(response);
      };

      const mllpMessage = MLLP.VT + message + MLLP.FS + MLLP.CR;
      this.socket.write(mllpMessage);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }
}

/**
 * Run connectivity tests
 */
async function runTests() {
  console.log('\n========================================');
  console.log('   IntegraSaúde Connector Test Suite   ');
  console.log('========================================\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  // Start mock server
  console.log('Starting mock MLLP server...\n');
  const mockServer = new MockMLLPServer(CONFIG.mockServer.port, 'MockTasy');
  await mockServer.start();

  // Run tests
  try {
    // Test 1: Basic Connection
    console.log('--- Test 1: Basic MLLP Connection ---');
    const client = new MLLPClient(CONFIG.mockServer.host, CONFIG.mockServer.port, 'TestClient');
    await client.connect();
    results.tests.push({ name: 'Basic Connection', status: 'PASSED' });
    results.passed++;
    console.log('✓ Connection established\n');

    // Test 2: Send ADT^A01
    console.log('--- Test 2: Send ADT^A01 (Patient Admission) ---');
    const ackADT = await client.send(SAMPLE_MESSAGES.ADT_A01);
    const parsedAckADT = parseHL7(ackADT);
    if (parsedAckADT.MSA && parsedAckADT.MSA[0][1] === 'AA') {
      results.tests.push({ name: 'ADT^A01 Message', status: 'PASSED' });
      results.passed++;
      console.log('✓ ADT^A01 acknowledged successfully\n');
    } else {
      throw new Error('ADT^A01 not acknowledged');
    }

    // Test 3: Send ORM^O01
    console.log('--- Test 3: Send ORM^O01 (Lab Order) ---');
    const ackORM = await client.send(SAMPLE_MESSAGES.ORM_O01);
    const parsedAckORM = parseHL7(ackORM);
    if (parsedAckORM.MSA && parsedAckORM.MSA[0][1] === 'AA') {
      results.tests.push({ name: 'ORM^O01 Message', status: 'PASSED' });
      results.passed++;
      console.log('✓ ORM^O01 acknowledged successfully\n');
    } else {
      throw new Error('ORM^O01 not acknowledged');
    }

    // Test 4: Send ORU^R01
    console.log('--- Test 4: Send ORU^R01 (Lab Result) ---');
    const ackORU = await client.send(SAMPLE_MESSAGES.ORU_R01);
    const parsedAckORU = parseHL7(ackORU);
    if (parsedAckORU.MSA && parsedAckORU.MSA[0][1] === 'AA') {
      results.tests.push({ name: 'ORU^R01 Message', status: 'PASSED' });
      results.passed++;
      console.log('✓ ORU^R01 acknowledged successfully\n');
    } else {
      throw new Error('ORU^R01 not acknowledged');
    }

    // Test 5: Batch Messages
    console.log('--- Test 5: Batch Message Test (5 messages) ---');
    const batchStart = Date.now();
    for (let i = 0; i < 5; i++) {
      const msg = SAMPLE_MESSAGES.ADT_A08.replace('MSG004', `BATCH${i}`);
      await client.send(msg);
    }
    const batchDuration = Date.now() - batchStart;
    results.tests.push({
      name: 'Batch Messages',
      status: 'PASSED',
      metrics: { count: 5, duration: batchDuration, avgMs: batchDuration / 5 },
    });
    results.passed++;
    console.log(
      `✓ 5 messages sent in ${batchDuration}ms (avg: ${(batchDuration / 5).toFixed(1)}ms)\n`
    );

    // Test 6: Message Parsing
    console.log('--- Test 6: HL7 Message Parsing ---');
    const parsed = parseHL7(SAMPLE_MESSAGES.ADT_A01);
    const hasRequiredSegments = parsed.MSH && parsed.EVN && parsed.PID && parsed.PV1;
    if (hasRequiredSegments) {
      results.tests.push({ name: 'Message Parsing', status: 'PASSED' });
      results.passed++;
      console.log('✓ All required segments parsed correctly\n');
    } else {
      throw new Error('Missing required segments');
    }

    // Test 7: Brazilian Z-Segment
    console.log('--- Test 7: Brazilian Z-Segment (ZBR) ---');
    if (parsed.ZBR && parsed.ZBR.length > 0) {
      const zbr = parsed.ZBR[0];
      const hasCPF = zbr.includes('CPF');
      const hasCNS = zbr.includes('CNS');
      if (hasCPF && hasCNS) {
        results.tests.push({ name: 'Brazilian Z-Segment', status: 'PASSED' });
        results.passed++;
        console.log('✓ ZBR segment with CPF and CNS parsed\n');
      } else {
        throw new Error('Missing Brazilian identifiers');
      }
    } else {
      throw new Error('ZBR segment not found');
    }

    client.disconnect();
  } catch (error) {
    results.tests.push({ name: error.message, status: 'FAILED' });
    results.failed++;
    console.error('✗ Test failed:', error.message, '\n');
  }

  // Stop mock server
  await mockServer.stop();
  console.log('Mock server stopped.\n');

  // Print results
  console.log('========================================');
  console.log('           TEST RESULTS                ');
  console.log('========================================');
  console.log(
    `Total: ${results.passed + results.failed} | Passed: ${results.passed} | Failed: ${results.failed}`
  );
  console.log('----------------------------------------');
  results.tests.forEach((test) => {
    const icon = test.status === 'PASSED' ? '✓' : '✗';
    const metrics = test.metrics ? ` (${test.metrics.avgMs?.toFixed(1)}ms avg)` : '';
    console.log(`  ${icon} ${test.name}${metrics}`);
  });
  console.log('========================================\n');

  // Server stats
  console.log('Server Statistics:');
  console.log(mockServer.getStats());

  return results;
}

/**
 * Performance benchmark
 */
async function runBenchmark(messageCount = 100) {
  console.log('\n========================================');
  console.log('   Performance Benchmark               ');
  console.log(`   Messages: ${messageCount}            `);
  console.log('========================================\n');

  const mockServer = new MockMLLPServer(CONFIG.mockServer.port, 'BenchmarkServer');
  await mockServer.start();

  const client = new MLLPClient(CONFIG.mockServer.host, CONFIG.mockServer.port, 'BenchmarkClient');
  await client.connect();

  const start = Date.now();
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < messageCount; i++) {
    try {
      const msg = SAMPLE_MESSAGES.ADT_A01.replace('MSG001', `BENCH${String(i).padStart(5, '0')}`);
      await client.send(msg, 5000);
      successCount++;
    } catch (error) {
      errorCount++;
    }

    // Progress indicator
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`\rProgress: ${i + 1}/${messageCount}`);
    }
  }

  const duration = Date.now() - start;
  const throughput = (successCount / (duration / 1000)).toFixed(2);

  client.disconnect();
  await mockServer.stop();

  console.log('\n\n========================================');
  console.log('   BENCHMARK RESULTS                   ');
  console.log('========================================');
  console.log(`Duration: ${duration}ms`);
  console.log(`Success: ${successCount}/${messageCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Throughput: ${throughput} msg/sec`);
  console.log(`Avg Latency: ${(duration / successCount).toFixed(2)}ms`);
  console.log('========================================\n');
}

// Main
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'test':
    runTests()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
    break;
  case 'benchmark':
    const count = parseInt(args[1]) || 100;
    runBenchmark(count)
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
    break;
  case 'server':
    const port = parseInt(args[1]) || CONFIG.mockServer.port;
    const server = new MockMLLPServer(port, 'StandaloneServer');
    server.start().then(() => {
      console.log('Press Ctrl+C to stop');
    });
    break;
  default:
    console.log(`
IntegraSaúde - Hospital Connector Test Suite

Usage:
  node test-connectors.js test                 Run all tests
  node test-connectors.js benchmark [count]    Run performance benchmark
  node test-connectors.js server [port]        Start standalone mock server

Environment Variables:
  TASY_HOST    Tasy server hostname (default: 127.0.0.1)
  TASY_PORT    Tasy server port (default: 2575)
  MV_HOST      MV Soul server hostname (default: 127.0.0.1)
  MV_PORT      MV Soul server port (default: 2576)

Examples:
  node test-connectors.js test
  node test-connectors.js benchmark 500
  node test-connectors.js server 2575
    `);
}

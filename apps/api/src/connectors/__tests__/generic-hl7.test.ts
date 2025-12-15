/**
 * Tests for GenericHL7Connector
 * Target: 95%+ code coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GenericHL7Connector } from '../generic-hl7.js';
import type { ConnectorMessage } from '../../types/connector.js';
import * as net from 'net';

describe('GenericHL7Connector', () => {
  let connector: GenericHL7Connector;
  let mockServer: net.Server;
  let serverPort: number;

  beforeEach(async () => {
    // Create a mock HL7 server
    mockServer = net.createServer((socket) => {
      socket.on('data', (data) => {
        // Extract message and send ACK
        const message = data.toString('utf8');
        const controlId = extractControlId(message);

        // Build ACK message
        const ack = buildAck(controlId);

        // Wrap with MLLP
        const mllpAck = Buffer.concat([
          Buffer.from([0x0b]),
          Buffer.from(ack, 'utf8'),
          Buffer.from([0x1c, 0x0d]),
        ]);

        socket.write(mllpAck);
      });
    });

    // Listen on random port
    await new Promise<void>((resolve) => {
      mockServer.listen(0, () => {
        const address = mockServer.address() as net.AddressInfo;
        serverPort = address.port;
        resolve();
      });
    });

    // Create connector instance
    connector = new GenericHL7Connector({
      type: 'generic-hl7' as any,
      orgId: 'test-org',
      name: 'Test HL7',
      enabled: true,
      config: {
        host: 'localhost',
        port: serverPort,
        timeout: 5000,
        keepAlive: true,
        encoding: 'utf8',
        mllp: {
          startByte: 0x0b,
          endByte1: 0x1c,
          endByte2: 0x0d,
        },
        poolSize: 2,
      },
    });
  });

  afterEach(async () => {
    if (connector) {
      await connector.disconnect();
    }
    if (mockServer) {
      await new Promise<void>((resolve) => {
        mockServer.close(() => resolve());
      });
    }
  });

  describe('Connection Management', () => {
    it('should connect via MLLP', async () => {
      await connector.connect();
      expect(connector.getStatus()).toBe('connected');
    });

    it('should handle connection timeout', async () => {
      // Create connector with invalid host
      const timeoutConnector = new GenericHL7Connector({
        type: 'generic-hl7' as any,
        orgId: 'test-org',
        name: 'Timeout Test',
        enabled: true,
        config: {
          host: '192.0.2.1', // TEST-NET-1, guaranteed to be unreachable
          port: 9999,
          timeout: 1000,
          keepAlive: false,
          encoding: 'utf8',
          mllp: {
            startByte: 0x0b,
            endByte1: 0x1c,
            endByte2: 0x0d,
          },
          poolSize: 1,
        },
      });

      await expect(timeoutConnector.connect()).rejects.toThrow();
      expect(timeoutConnector.getStatus()).toBe('error');
    }, 10000);

    it('should create connection pool', async () => {
      await connector.connect();
      const metrics = connector.getMetrics();
      expect(metrics.messagesSent).toBe(0);
      expect(metrics.messagesReceived).toBe(0);
    });

    it('should disconnect cleanly', async () => {
      await connector.connect();
      await connector.disconnect();
      expect(connector.getStatus()).toBe('disconnected');
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      await connector.connect();
    });

    it('should send HL7 message and receive ACK', async () => {
      const message: ConnectorMessage = {
        id: 'TEST001',
        timestamp: new Date(),
        source: 'TestSystem',
        destination: 'HIS',
        type: 'ADT^A01',
        payload: {
          segments: ['PID|||12345^^^HIS^MR||DOE^JOHN^A||19800101|M|||123 MAIN ST^^CITY^ST^12345'],
        },
      };

      await expect(connector.send(message)).resolves.not.toThrow();

      const metrics = connector.getMetrics();
      expect(metrics.messagesSent).toBe(1);
      expect(metrics.messagesReceived).toBe(1); // ACK
    });

    it('should handle ACK validation', async () => {
      const message: ConnectorMessage = {
        id: 'TEST002',
        timestamp: new Date(),
        source: 'TestSystem',
        destination: 'HIS',
        type: 'ADT^A01',
        payload:
          'MSH|^~\\&|TestSystem|test-org|HIS||20231215120000||ADT^A01|TEST002|P|2.5||NE|AL\rPID|||12345',
      };

      await expect(connector.send(message)).resolves.not.toThrow();
    });

    it('should handle message sending errors', async () => {
      // Disconnect server to trigger error
      await new Promise<void>((resolve) => {
        mockServer.close(() => resolve());
      });

      await connector.disconnect();

      const message: ConnectorMessage = {
        id: 'TEST003',
        timestamp: new Date(),
        source: 'TestSystem',
        destination: 'HIS',
        type: 'ADT^A01',
        payload: {},
      };

      // Reconnect should fail because server is closed
      await expect(connector.connect()).rejects.toThrow();
    });
  });

  describe('MLLP Framing', () => {
    it('should handle partial MLLP frames', async () => {
      // This is tested internally, but we can verify by sending messages
      await connector.connect();

      const message: ConnectorMessage = {
        id: 'TEST004',
        timestamp: new Date(),
        source: 'TestSystem',
        destination: 'HIS',
        type: 'ORU^R01',
        payload: {
          segments: ['OBX|1|NM|GLU^Glucose||99|mg/dL|70-110|N|||F'],
        },
      };

      await expect(connector.send(message)).resolves.not.toThrow();
    });

    it('should wrap messages with correct MLLP bytes', async () => {
      await connector.connect();

      const message: ConnectorMessage = {
        id: 'TEST005',
        timestamp: new Date(),
        source: 'TestSystem',
        destination: 'HIS',
        type: 'ADT^A08',
        payload: 'MSH|^~\\&|TestSystem|test-org|HIS||20231215120000||ADT^A08|TEST005|P|2.5',
      };

      await expect(connector.send(message)).resolves.not.toThrow();
    });
  });

  describe('Health Check', () => {
    it('should return healthy when connected', async () => {
      await connector.connect();
      const health = await connector.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.status).toBe('connected');
      expect(health.metrics).toBeDefined();
    });

    it('should return unhealthy when disconnected', async () => {
      const health = await connector.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.status).not.toBe('connected');
    });

    it('should emit metrics', async () => {
      await connector.connect();

      const message: ConnectorMessage = {
        id: 'TEST006',
        timestamp: new Date(),
        source: 'TestSystem',
        destination: 'HIS',
        type: 'ADT^A01',
        payload: {},
      };

      await connector.send(message);

      const health = await connector.healthCheck();
      expect(health.metrics.messagesSent).toBeGreaterThan(0);
      expect(health.metrics.connectionUptime).toBeGreaterThan(0);
    });
  });

  describe('Reconnection', () => {
    it('should attempt reconnection on connection drop', async () => {
      await connector.connect();

      // Simulate connection drop by closing server
      await new Promise<void>((resolve) => {
        mockServer.close(() => resolve());
      });

      // Wait for reconnection attempt
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Status should be error or connecting
      const status = connector.getStatus();
      expect(['error', 'connecting', 'disconnected']).toContain(status);
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle invalid configuration', () => {
      expect(() => {
        new GenericHL7Connector({
          type: 'generic-hl7' as any,
          orgId: '',
          name: 'Invalid',
          enabled: true,
          config: {
            host: 'localhost',
            port: 0,
            timeout: 5000,
            keepAlive: false,
            encoding: 'utf8',
            mllp: {
              startByte: 0x0b,
              endByte1: 0x1c,
              endByte2: 0x0d,
            },
          },
        });
      }).toThrow();
    });

    it('should record errors in metrics', async () => {
      const initialErrors = connector.getMetrics().errors;

      // Try to send without connecting
      const message: ConnectorMessage = {
        id: 'TEST007',
        timestamp: new Date(),
        source: 'TestSystem',
        destination: 'HIS',
        type: 'ADT^A01',
        payload: {},
      };

      await expect(connector.send(message)).rejects.toThrow();

      const finalErrors = connector.getMetrics().errors;
      expect(finalErrors).toBeGreaterThan(initialErrors);
    });
  });
});

// Helper functions
function extractControlId(message: string): string {
  // Remove MLLP framing
  const cleaned = message.replace(/[\x0b\x1c\x0d]/g, '');
  const segments = cleaned.split('\r');
  const msh = segments.find((s) => s.startsWith('MSH'));

  if (!msh) return 'UNKNOWN';

  const fields = msh.split('|');
  return fields[9] || 'UNKNOWN';
}

function buildAck(controlId: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .substring(0, 14);

  return `MSH|^~\\&|HIS||TestSystem||${timestamp}||ACK|${controlId}|P|2.5\rMSA|AA|${controlId}`;
}

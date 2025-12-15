/**
 * Unit tests for MLLP Server (Minimum Lower Layer Protocol)
 */

import * as net from 'net';
import { MLLPServer } from '../mllp/server';
import { HL7Parser } from '../parser';

const VT = '\x0B'; // Vertical Tab (Start Block)
const FS = '\x1C'; // File Separator (End Block)
const CR = '\x0D'; // Carriage Return (Terminator)

describe('MLLPServer', () => {
  let server: MLLPServer;
  const TEST_PORT = 9876;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('Server Lifecycle', () => {
    it('should start and stop server successfully', async () => {
      server = new MLLPServer({ port: TEST_PORT });

      await server.start();
      const info = server.getInfo();
      expect(info.running).toBe(true);
      expect(info.port).toBe(TEST_PORT);
      expect(info.connections).toBe(0);

      await server.stop();
      const stoppedInfo = server.getInfo();
      expect(stoppedInfo.running).toBe(false);
    });

    it('should reject starting already running server', async () => {
      server = new MLLPServer({ port: TEST_PORT });
      await server.start();

      await expect(server.start()).rejects.toThrow('Server is already running');
    });

    it('should allow stopping already stopped server', async () => {
      server = new MLLPServer({ port: TEST_PORT });
      await expect(server.stop()).resolves.toBeUndefined();
    });
  });

  describe('MLLP Framing', () => {
    it('should receive and parse MLLP-framed message', (done) => {
      server = new MLLPServer({ port: TEST_PORT, autoAck: false });

      server.on('message', (message, connectionId, respond) => {
        expect(message.messageType).toBe('ADT^A01');
        expect(message.messageControlId).toBe('MSG001');
        expect(connectionId).toBeDefined();
        done();
      });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          const hl7Message = `MSH|^~\\&|SENDING|FAC|RECEIVING|FAC|20231215120000||ADT^A01|MSG001|P|2.5\rPID|1||12345`;
          const framedMessage = VT + hl7Message + FS + CR;
          client.write(framedMessage);
        });
      });
    });

    it('should handle partial messages correctly', (done) => {
      server = new MLLPServer({ port: TEST_PORT, autoAck: false });

      server.on('message', (message) => {
        expect(message.messageType).toBe('ADT^A01');
        done();
      });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          const hl7Message = `MSH|^~\\&|SENDING|FAC|RECEIVING|FAC|20231215120000||ADT^A01|MSG001|P|2.5\rPID|1||12345`;
          const framedMessage = VT + hl7Message + FS + CR;

          // Send in chunks to test partial message handling
          const chunk1 = framedMessage.substring(0, 20);
          const chunk2 = framedMessage.substring(20, 50);
          const chunk3 = framedMessage.substring(50);

          client.write(chunk1);
          setTimeout(() => client.write(chunk2), 10);
          setTimeout(() => client.write(chunk3), 20);
        });
      });
    });

    it('should handle multiple messages in succession', (done) => {
      server = new MLLPServer({ port: TEST_PORT, autoAck: false });
      let messageCount = 0;

      server.on('message', (message) => {
        messageCount++;
        if (messageCount === 3) {
          expect(messageCount).toBe(3);
          done();
        }
      });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          for (let i = 1; i <= 3; i++) {
            const hl7Message = `MSH|^~\\&|SENDING|FAC|RECEIVING|FAC|20231215120000||ADT^A01|MSG00${i}|P|2.5\rPID|1||12345`;
            const framedMessage = VT + hl7Message + FS + CR;
            client.write(framedMessage);
          }
        });
      });
    });

    it('should ignore junk data before VT', (done) => {
      server = new MLLPServer({ port: TEST_PORT, autoAck: false });

      server.on('message', (message) => {
        expect(message.messageType).toBe('ADT^A01');
        done();
      });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          const hl7Message = `MSH|^~\\&|SENDING|FAC|RECEIVING|FAC|20231215120000||ADT^A01|MSG001|P|2.5\rPID|1||12345`;
          const junk = 'JUNK DATA BEFORE START';
          const framedMessage = junk + VT + hl7Message + FS + CR;
          client.write(framedMessage);
        });
      });
    });
  });

  describe('Auto-Acknowledgment', () => {
    it('should send ACK automatically when autoAck is true', (done) => {
      server = new MLLPServer({ port: TEST_PORT, autoAck: true });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          const hl7Message = `MSH|^~\\&|SENDING|FAC|RECEIVING|FAC|20231215120000||ADT^A01|MSG001|P|2.5\rPID|1||12345`;
          const framedMessage = VT + hl7Message + FS + CR;
          client.write(framedMessage);

          // Wait for ACK
          client.on('data', (data) => {
            const response = data.toString();
            expect(response).toContain('MSH');
            expect(response).toContain('MSA|AA|MSG001');
            done();
          });
        });
      });
    });

    it('should not send ACK automatically when autoAck is false', (done) => {
      server = new MLLPServer({ port: TEST_PORT, autoAck: false });
      let receivedAck = false;

      server.on('message', () => {
        // Wait a bit to ensure no ACK is sent
        setTimeout(() => {
          expect(receivedAck).toBe(false);
          done();
        }, 100);
      });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          const hl7Message = `MSH|^~\\&|SENDING|FAC|RECEIVING|FAC|20231215120000||ADT^A01|MSG001|P|2.5\rPID|1||12345`;
          const framedMessage = VT + hl7Message + FS + CR;
          client.write(framedMessage);

          client.on('data', () => {
            receivedAck = true;
          });
        });
      });
    });

    it('should allow manual ACK response', (done) => {
      server = new MLLPServer({ port: TEST_PORT, autoAck: false });

      server.on('message', (message, connectionId, respond) => {
        const ack = HL7Parser.generateACK(message.messageControlId, 'AA', 'Custom acknowledgment');
        respond(ack);
      });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          const hl7Message = `MSH|^~\\&|SENDING|FAC|RECEIVING|FAC|20231215120000||ADT^A01|MSG001|P|2.5\rPID|1||12345`;
          const framedMessage = VT + hl7Message + FS + CR;
          client.write(framedMessage);

          client.on('data', (data) => {
            const response = data.toString();
            expect(response).toContain('MSA|AA|MSG001|Custom acknowledgment');
            done();
          });
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should send NAK on parse error', (done) => {
      server = new MLLPServer({ port: TEST_PORT, autoAck: true });

      server.on('error', (error) => {
        expect(error.message).toContain('Message must start with MSH segment');
      });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          const invalidMessage = 'INVALID MESSAGE WITHOUT MSH';
          const framedMessage = VT + invalidMessage + FS + CR;
          client.write(framedMessage);

          client.on('data', (data) => {
            const response = data.toString();
            expect(response).toContain('MSA|AE'); // Application Error
            done();
          });
        });
      });
    });

    it('should emit error for invalid message', (done) => {
      server = new MLLPServer({ port: TEST_PORT, validateMessage: true });
      let errorEmitted = false;

      server.on('error', (error, connectionId) => {
        errorEmitted = true;
        expect(error).toBeDefined();
        expect(connectionId).toBeDefined();
      });

      server.on('message', () => {
        setTimeout(() => {
          expect(errorEmitted).toBe(true);
          done();
        }, 50);
      });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          const invalidMessage = 'INVALID MESSAGE';
          const framedMessage = VT + invalidMessage + FS + CR;
          client.write(framedMessage);
        });
      });
    });

    it('should handle buffer overflow protection', (done) => {
      server = new MLLPServer({ port: TEST_PORT });
      let errorEmitted = false;

      server.on('error', (error) => {
        if (error.message.includes('Buffer size exceeded')) {
          errorEmitted = true;
        }
      });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          // Send more than 1MB of junk data without proper framing
          const junkData = 'X'.repeat(1024 * 1024 + 1000);
          client.write(junkData);

          setTimeout(() => {
            expect(errorEmitted).toBe(true);
            done();
          }, 100);
        });
      });
    });
  });

  describe('Connection Management', () => {
    it('should track active connections', (done) => {
      server = new MLLPServer({ port: TEST_PORT });

      server.on('connection', (connectionId) => {
        expect(connectionId).toBeDefined();
        const info = server.getInfo();
        expect(info.connections).toBe(1);
      });

      server.on('close', (connectionId) => {
        expect(connectionId).toBeDefined();
        const info = server.getInfo();
        expect(info.connections).toBe(0);
        done();
      });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          setTimeout(() => client.end(), 50);
        });
      });
    });

    it('should handle connection timeout', (done) => {
      server = new MLLPServer({ port: TEST_PORT, timeout: 100 });
      let timeoutErrorEmitted = false;

      server.on('error', (error) => {
        if (error.message.includes('timeout')) {
          timeoutErrorEmitted = true;
        }
      });

      server.on('close', () => {
        setTimeout(() => {
          expect(timeoutErrorEmitted).toBe(true);
          done();
        }, 50);
      });

      server.start().then(() => {
        // Connect but don't send anything - should timeout
        net.connect(TEST_PORT);
      });
    });

    it('should handle multiple concurrent connections', (done) => {
      server = new MLLPServer({ port: TEST_PORT, autoAck: false });
      let messagesReceived = 0;

      server.on('message', () => {
        messagesReceived++;
        if (messagesReceived === 3) {
          expect(messagesReceived).toBe(3);
          done();
        }
      });

      server.start().then(() => {
        // Create 3 concurrent connections
        for (let i = 1; i <= 3; i++) {
          const client = net.connect(TEST_PORT, () => {
            const hl7Message = `MSH|^~\\&|SENDING|FAC|RECEIVING|FAC|20231215120000||ADT^A01|MSG00${i}|P|2.5\rPID|1||12345`;
            const framedMessage = VT + hl7Message + FS + CR;
            client.write(framedMessage);
          });
        }
      });
    });
  });

  describe('Message Validation', () => {
    it('should validate message when validateMessage is true', (done) => {
      server = new MLLPServer({ port: TEST_PORT, validateMessage: true, autoAck: false });

      server.on('message', (message) => {
        expect(message.messageType).toBeDefined();
        expect(message.messageControlId).toBeDefined();
        done();
      });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          const hl7Message = `MSH|^~\\&|SENDING|FAC|RECEIVING|FAC|20231215120000||ADT^A01|MSG001|P|2.5\rPID|1||12345`;
          const framedMessage = VT + hl7Message + FS + CR;
          client.write(framedMessage);
        });
      });
    });

    it('should skip validation when validateMessage is false', (done) => {
      server = new MLLPServer({ port: TEST_PORT, validateMessage: false, autoAck: false });

      server.on('message', (message) => {
        expect(message).toBeDefined();
        done();
      });

      server.start().then(() => {
        const client = net.connect(TEST_PORT, () => {
          const hl7Message = `MSH|^~\\&|SENDING|FAC|RECEIVING|FAC|20231215120000||ADT^A01|MSG001|P|2.5\rPID|1||12345`;
          const framedMessage = VT + hl7Message + FS + CR;
          client.write(framedMessage);
        });
      });
    });
  });
});

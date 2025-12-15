/**
 * Tests for TasyConnector
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TasyConnector } from '../tasy.js';
import type { ConnectorMessage } from '../../types/connector.js';
import * as net from 'net';

describe('TasyConnector', () => {
  let connector: TasyConnector;
  let mockServer: net.Server;
  let serverPort: number;

  beforeEach(async () => {
    mockServer = net.createServer((socket) => {
      socket.on('data', (data) => {
        const message = data.toString('utf8');
        const controlId = message.match(/\|([A-Z0-9]+)\|P\|/)?.[1] || 'UNKNOWN';
        const ack = `MSH|^~\\&|HIS||TestSystem||20231215120000||ACK|${controlId}|P|2.5\rMSA|AA|${controlId}`;
        const mllpAck = Buffer.concat([
          Buffer.from([0x0b]),
          Buffer.from(ack, 'utf8'),
          Buffer.from([0x1c, 0x0d]),
        ]);
        socket.write(mllpAck);
      });
    });

    await new Promise<void>((resolve) => {
      mockServer.listen(0, () => {
        serverPort = (mockServer.address() as net.AddressInfo).port;
        resolve();
      });
    });

    connector = new TasyConnector({
      type: 'tasy' as any,
      orgId: 'test-org',
      name: 'Test Tasy',
      enabled: true,
      config: {
        host: 'localhost',
        port: serverPort,
        timeout: 5000,
        keepAlive: true,
        encoding: 'utf8',
        mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
        enableZSegments: true,
        segments: { ZPD: true, ZPV: true, ZIN: true, ZOR: true },
        poolSize: 2,
      },
    });

    await connector.connect();
  });

  afterEach(async () => {
    await connector?.disconnect();
    await new Promise<void>((resolve) => mockServer?.close(() => resolve()));
  });

  it('should parse ZPD segment (patient data)', () => {
    const hl7 =
      'MSH|...\rZPD|MARIA SILVA|SAO PAULO|BRASILEIRA|123456789|12345678900|123456789012345|ENFERMEIRA|SUPERIOR';
    const zSegments = connector.parseZSegments(hl7);

    expect(zSegments.ZPD).toBeDefined();
    expect(zSegments.ZPD.fields.motherName).toBe('MARIA SILVA');
    expect(zSegments.ZPD.fields.cpf).toBe('12345678900');
  });

  it('should parse ZPV segment (visit data)', () => {
    const hl7 =
      'MSH|...\rZPV|123456|URGENCIA|AMBULATORIO|101|ENFERMARIA_A|DR_SILVA|20231215120000|20231216120000';
    const zSegments = connector.parseZSegments(hl7);

    expect(zSegments.ZPV).toBeDefined();
    expect(zSegments.ZPV.fields.visitNumber).toBe('123456');
    expect(zSegments.ZPV.fields.bedNumber).toBe('101');
  });

  it('should enrich message with Z-segments', async () => {
    const message: ConnectorMessage = {
      id: 'TASY001',
      timestamp: new Date(),
      source: 'Tasy',
      destination: 'HIS',
      type: 'ADT^A01',
      payload: {
        patient: {
          cpf: '12345678900',
          motherName: 'MARIA',
          rg: '123456',
          cns: '123456789012345',
        },
        visit: {
          visitNumber: '123456',
          bedNumber: '101',
        },
      },
    };

    await expect(connector.send(message)).resolves.not.toThrow();
    expect(connector.getMetrics().messagesSent).toBe(1);
  });

  it('should map TUSS codes', async () => {
    const connectorWithMapping = new TasyConnector({
      type: 'tasy' as any,
      orgId: 'test-org',
      name: 'Test Tasy Mapping',
      enabled: true,
      config: {
        host: 'localhost',
        port: serverPort,
        timeout: 5000,
        keepAlive: false,
        encoding: 'utf8',
        mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
        enableZSegments: false,
        segments: {},
        tussMapping: {
          '40101010': '40101010-MAPPED',
        },
      },
    });

    await connectorWithMapping.connect();

    const message: ConnectorMessage = {
      id: 'TASY002',
      timestamp: new Date(),
      source: 'Tasy',
      destination: 'HIS',
      type: 'ORM^O01',
      payload: {
        order: {
          tussCode: '40101010',
        },
      },
    };

    await expect(connectorWithMapping.send(message)).resolves.not.toThrow();
    await connectorWithMapping.disconnect();
  });
});

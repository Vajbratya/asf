/**
 * Tests for ConnectorRegistry
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConnectorRegistry } from '../registry.js';
import type { ConnectorConfig } from '../../types/connector.js';

describe('ConnectorRegistry', () => {
  let registry: ConnectorRegistry;

  beforeEach(() => {
    registry = ConnectorRegistry.getInstance();
  });

  afterEach(async () => {
    await registry.clear();
  });

  it('should return singleton instance', () => {
    const instance1 = ConnectorRegistry.getInstance();
    const instance2 = ConnectorRegistry.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should create connector by type', async () => {
    const config: ConnectorConfig = {
      type: 'generic-hl7' as any,
      orgId: 'org1',
      name: 'Test HL7',
      enabled: false,
      config: {
        host: 'localhost',
        port: 5000,
        timeout: 5000,
        keepAlive: false,
        encoding: 'utf8',
        mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
      },
    };

    const connector = await registry.getConnector(config);

    expect(connector).toBeDefined();
    expect(connector.getStatus()).toBe('disconnected');
  });

  it('should return same instance for duplicate config', async () => {
    const config: ConnectorConfig = {
      type: 'tasy' as any,
      orgId: 'org1',
      name: 'Tasy Test',
      enabled: false,
      config: {
        host: 'localhost',
        port: 5000,
        timeout: 5000,
        keepAlive: false,
        encoding: 'utf8',
        mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
        enableZSegments: false,
        segments: {},
      },
    };

    const connector1 = await registry.getConnector(config);
    const connector2 = await registry.getConnector(config);

    expect(connector1).toBe(connector2);
  });

  it('should health check all connectors', async () => {
    const config: ConnectorConfig = {
      type: 'generic-hl7' as any,
      orgId: 'org1',
      name: 'Test',
      enabled: false,
      config: {
        host: 'localhost',
        port: 5000,
        timeout: 5000,
        keepAlive: false,
        encoding: 'utf8',
        mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
      },
    };

    await registry.getConnector(config);

    const healthCheck = await registry.healthCheckAll();

    expect(healthCheck.totalConnectors).toBe(1);
    expect(healthCheck.connectors).toBeDefined();
  });

  it('should remove connector', async () => {
    const config: ConnectorConfig = {
      type: 'generic-hl7' as any,
      orgId: 'org1',
      name: 'Test',
      enabled: false,
      config: {
        host: 'localhost',
        port: 5000,
        timeout: 5000,
        keepAlive: false,
        encoding: 'utf8',
        mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
      },
    };

    await registry.getConnector(config);
    await registry.removeConnector(config);

    const stats = registry.getStats();
    expect(stats.totalConnectors).toBe(0);
  });

  it('should get org connectors', async () => {
    const config1: ConnectorConfig = {
      type: 'generic-hl7' as any,
      orgId: 'org1',
      name: 'Test1',
      enabled: false,
      config: {
        host: 'localhost',
        port: 5000,
        timeout: 5000,
        keepAlive: false,
        encoding: 'utf8',
        mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
      },
    };

    const config2: ConnectorConfig = {
      type: 'tasy' as any,
      orgId: 'org1',
      name: 'Test2',
      enabled: false,
      config: {
        host: 'localhost',
        port: 5001,
        timeout: 5000,
        keepAlive: false,
        encoding: 'utf8',
        mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
        enableZSegments: false,
        segments: {},
      },
    };

    await registry.getConnector(config1);
    await registry.getConnector(config2);

    const connectors = registry.getOrgConnectors('org1');
    expect(connectors).toHaveLength(2);
  });
});

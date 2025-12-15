/**
 * S24 - Connector Registry
 *
 * Factory and registry for managing all connector instances.
 * Provides singleton instances per organization and health check aggregation.
 */

import pino from "pino";
import { BaseConnector } from "./base.js";
import { GenericHL7Connector } from "./generic-hl7.js";
import { TasyConnector } from "./tasy.js";
import { MVSoulConnector } from "./mv-soul.js";
import { PixeonConnector } from "./pixeon.js";
import { GenericRestConnector } from "./generic-rest.js";
import type {
  ConnectorConfig,
  ConnectorType,
  HealthCheckResult,
} from "../types/connector.js";

interface ConnectorInstance {
  connector: BaseConnector;
  config: ConnectorConfig;
  createdAt: Date;
  lastHealthCheck?: HealthCheckResult;
}

interface RegistryHealthCheck {
  healthy: boolean;
  totalConnectors: number;
  healthyConnectors: number;
  unhealthyConnectors: number;
  connectors: {
    [key: string]: HealthCheckResult;
  };
  timestamp: Date;
}

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<string, ConnectorInstance> = new Map();
  private logger: pino.Logger;

  private constructor() {
    this.logger = pino({
      name: "connector-registry",
      level: process.env.LOG_LEVEL || "info",
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  /**
   * Create or get connector instance for an organization
   */
  async getConnector(config: ConnectorConfig): Promise<BaseConnector> {
    const key = this.getConnectorKey(config);

    // Return existing instance if available
    if (this.connectors.has(key)) {
      const instance = this.connectors.get(key)!;
      this.logger.debug(
        { key, type: config.type },
        "Returning existing connector",
      );
      return instance.connector;
    }

    // Create new instance
    this.logger.info(
      { key, type: config.type, orgId: config.orgId },
      "Creating new connector instance",
    );

    const connector = this.createConnector(config);

    // Store instance
    this.connectors.set(key, {
      connector,
      config,
      createdAt: new Date(),
    });

    // Connect if enabled
    if (config.enabled) {
      try {
        await connector.connect();
      } catch (error) {
        this.logger.error({ key, error }, "Failed to connect connector");
        // Don't throw - connector can retry later
      }
    }

    return connector;
  }

  /**
   * Create connector based on type
   */
  private createConnector(config: ConnectorConfig): BaseConnector {
    switch (config.type) {
      case "generic-hl7":
        return new GenericHL7Connector(config as any);

      case "tasy":
        return new TasyConnector(config as any);

      case "mv-soul":
        return new MVSoulConnector(config as any);

      case "pixeon":
        return new PixeonConnector(config as any);

      case "generic-rest":
        return new GenericRestConnector(config as any);

      default:
        throw new Error(`Unknown connector type: ${config.type}`);
    }
  }

  /**
   * Get connector by key
   */
  getConnectorByKey(key: string): BaseConnector | undefined {
    return this.connectors.get(key)?.connector;
  }

  /**
   * Remove connector instance
   */
  async removeConnector(config: ConnectorConfig): Promise<void> {
    const key = this.getConnectorKey(config);

    const instance = this.connectors.get(key);
    if (!instance) {
      this.logger.warn({ key }, "Connector not found");
      return;
    }

    this.logger.info({ key }, "Removing connector");

    try {
      await instance.connector.destroy();
    } catch (error) {
      this.logger.error({ key, error }, "Error destroying connector");
    }

    this.connectors.delete(key);
  }

  /**
   * Remove all connectors for an organization
   */
  async removeOrgConnectors(orgId: string): Promise<void> {
    const keys = Array.from(this.connectors.keys()).filter((key) =>
      key.startsWith(`${orgId}:`),
    );

    this.logger.info({ orgId, count: keys.length }, "Removing org connectors");

    for (const key of keys) {
      const instance = this.connectors.get(key)!;
      try {
        await instance.connector.destroy();
      } catch (error) {
        this.logger.error({ key, error }, "Error destroying connector");
      }
      this.connectors.delete(key);
    }
  }

  /**
   * Get all connectors for an organization
   */
  getOrgConnectors(orgId: string): BaseConnector[] {
    const connectors: BaseConnector[] = [];

    for (const [key, instance] of this.connectors.entries()) {
      if (key.startsWith(`${orgId}:`)) {
        connectors.push(instance.connector);
      }
    }

    return connectors;
  }

  /**
   * Health check all active connectors
   */
  async healthCheckAll(): Promise<RegistryHealthCheck> {
    this.logger.debug("Running health check on all connectors");

    const results: { [key: string]: HealthCheckResult } = {};
    let healthyCount = 0;
    let unhealthyCount = 0;

    // Run health checks in parallel
    const promises = Array.from(this.connectors.entries()).map(
      async ([key, instance]) => {
        try {
          const result = await instance.connector.healthCheck();
          instance.lastHealthCheck = result;
          results[key] = result;

          if (result.healthy) {
            healthyCount++;
          } else {
            unhealthyCount++;
          }
        } catch (error) {
          this.logger.error({ key, error }, "Health check failed");
          unhealthyCount++;
          results[key] = {
            healthy: false,
            status: "error",
            message: (error as Error).message,
            metrics: {
              messagesSent: 0,
              messagesReceived: 0,
              errors: 0,
              connectionUptime: 0,
              averageLatency: 0,
            },
            timestamp: new Date(),
          };
        }
      },
    );

    await Promise.all(promises);

    const healthCheck: RegistryHealthCheck = {
      healthy: unhealthyCount === 0 && healthyCount > 0,
      totalConnectors: this.connectors.size,
      healthyConnectors: healthyCount,
      unhealthyConnectors: unhealthyCount,
      connectors: results,
      timestamp: new Date(),
    };

    this.logger.info(
      {
        total: healthCheck.totalConnectors,
        healthy: healthCheck.healthyConnectors,
        unhealthy: healthCheck.unhealthyConnectors,
      },
      "Health check completed",
    );

    return healthCheck;
  }

  /**
   * Health check connectors for a specific organization
   */
  async healthCheckOrg(orgId: string): Promise<RegistryHealthCheck> {
    this.logger.debug({ orgId }, "Running health check for org connectors");

    const results: { [key: string]: HealthCheckResult } = {};
    let healthyCount = 0;
    let unhealthyCount = 0;
    let totalCount = 0;

    const promises = Array.from(this.connectors.entries())
      .filter(([key]) => key.startsWith(`${orgId}:`))
      .map(async ([key, instance]) => {
        totalCount++;
        try {
          const result = await instance.connector.healthCheck();
          instance.lastHealthCheck = result;
          results[key] = result;

          if (result.healthy) {
            healthyCount++;
          } else {
            unhealthyCount++;
          }
        } catch (error) {
          this.logger.error({ key, error }, "Health check failed");
          unhealthyCount++;
          results[key] = {
            healthy: false,
            status: "error",
            message: (error as Error).message,
            metrics: {
              messagesSent: 0,
              messagesReceived: 0,
              errors: 0,
              connectionUptime: 0,
              averageLatency: 0,
            },
            timestamp: new Date(),
          };
        }
      });

    await Promise.all(promises);

    return {
      healthy: unhealthyCount === 0 && healthyCount > 0,
      totalConnectors: totalCount,
      healthyConnectors: healthyCount,
      unhealthyConnectors: unhealthyCount,
      connectors: results,
      timestamp: new Date(),
    };
  }

  /**
   * Get connector statistics
   */
  getStats(): {
    totalConnectors: number;
    connectorsByType: Record<string, number>;
    connectorsByOrg: Record<string, number>;
  } {
    const stats = {
      totalConnectors: this.connectors.size,
      connectorsByType: {} as Record<string, number>,
      connectorsByOrg: {} as Record<string, number>,
    };

    for (const [key, instance] of this.connectors.entries()) {
      // Count by type
      const type = instance.config.type;
      stats.connectorsByType[type] = (stats.connectorsByType[type] || 0) + 1;

      // Count by org
      const orgId = instance.config.orgId;
      stats.connectorsByOrg[orgId] = (stats.connectorsByOrg[orgId] || 0) + 1;
    }

    return stats;
  }

  /**
   * List all connector keys
   */
  listConnectors(): string[] {
    return Array.from(this.connectors.keys());
  }

  /**
   * Get connector configuration
   */
  getConnectorConfig(key: string): ConnectorConfig | undefined {
    return this.connectors.get(key)?.config;
  }

  /**
   * Update connector configuration
   */
  async updateConnectorConfig(config: ConnectorConfig): Promise<BaseConnector> {
    const key = this.getConnectorKey(config);

    // Remove existing connector
    if (this.connectors.has(key)) {
      await this.removeConnector(config);
    }

    // Create new connector with updated config
    return this.getConnector(config);
  }

  /**
   * Reconnect all disconnected connectors
   */
  async reconnectAll(): Promise<void> {
    this.logger.info("Reconnecting all disconnected connectors");

    const promises = Array.from(this.connectors.values())
      .filter(
        (instance) =>
          instance.config.enabled &&
          instance.connector.getStatus() !== "connected",
      )
      .map(async (instance) => {
        try {
          await instance.connector.connect();
        } catch (error) {
          this.logger.error(
            { orgId: instance.config.orgId, type: instance.config.type, error },
            "Failed to reconnect",
          );
        }
      });

    await Promise.all(promises);
  }

  /**
   * Disconnect all connectors
   */
  async disconnectAll(): Promise<void> {
    this.logger.info("Disconnecting all connectors");

    const promises = Array.from(this.connectors.values()).map(
      async (instance) => {
        try {
          await instance.connector.disconnect();
        } catch (error) {
          this.logger.error(
            { orgId: instance.config.orgId, type: instance.config.type, error },
            "Failed to disconnect",
          );
        }
      },
    );

    await Promise.all(promises);
  }

  /**
   * Clear all connectors (for testing)
   */
  async clear(): Promise<void> {
    this.logger.warn("Clearing all connectors");

    for (const instance of this.connectors.values()) {
      try {
        await instance.connector.destroy();
      } catch (error) {
        this.logger.error({ error }, "Error destroying connector");
      }
    }

    this.connectors.clear();
  }

  /**
   * Generate connector key
   */
  private getConnectorKey(config: ConnectorConfig): string {
    return `${config.orgId}:${config.type}:${config.name}`;
  }
}

// Export singleton instance getter
export const getConnectorRegistry = (): ConnectorRegistry => {
  return ConnectorRegistry.getInstance();
};

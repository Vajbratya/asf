/**
 * S19 - Generic HL7 Connector
 *
 * Generic HL7v2 connector using MLLP (Minimal Lower Layer Protocol).
 * Handles ACK/NAK responses, connection pooling, and automatic reconnection.
 */

import * as net from 'net';
import { BaseConnector, BaseConnectorConfig } from './base.js';
import type { HL7Config, ConnectorMessage } from '../types/connector.js';

interface HL7ConnectorConfig extends BaseConnectorConfig {
  config: HL7Config;
}

interface HL7Connection {
  socket: net.Socket;
  inUse: boolean;
  lastUsed: number;
}

interface HL7Message {
  msh?: {
    messageControlId: string;
  };
  segments: Array<{ name: string; fields: string[] }>;
}

export class GenericHL7Connector extends BaseConnector {
  protected hl7Config: HL7Config;
  private connectionPool: HL7Connection[] = [];
  private reconnectTimer?: NodeJS.Timeout;
  private readonly START_BLOCK = 0x0b; // VT - Vertical Tab
  private readonly END_BLOCK = 0x1c; // FS - File Separator
  private readonly CARRIAGE_RETURN = 0x0d; // CR
  private buffer = Buffer.alloc(0);
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: HL7ConnectorConfig) {
    super(config);
    this.hl7Config = config.config;

    // Use custom MLLP bytes if provided
    if (this.hl7Config.mllp) {
      this.START_BLOCK = this.hl7Config.mllp.startByte;
      this.END_BLOCK = this.hl7Config.mllp.endByte1;
      this.CARRIAGE_RETURN = this.hl7Config.mllp.endByte2;
    }

    this.validateConfig();
  }

  protected validateConfig(): void {
    super.validateConfig();

    if (!this.hl7Config.host) {
      throw this.createError('HL7 host is required', 'INVALID_CONFIG', false);
    }
    if (!this.hl7Config.port || this.hl7Config.port <= 0) {
      throw this.createError('Valid HL7 port is required', 'INVALID_CONFIG', false);
    }
  }

  async connect(): Promise<void> {
    this.setStatus('connecting');
    this.logger.info(
      { host: this.hl7Config.host, port: this.hl7Config.port },
      'Connecting to HL7 server'
    );

    try {
      // Initialize connection pool
      const poolSize = this.hl7Config.poolSize || 3;
      for (let i = 0; i < poolSize; i++) {
        await this.createConnection();
      }

      this.setStatus('connected');
      this.logger.info({ poolSize }, 'Connected to HL7 server with connection pool');

      // Start health check monitoring
      this.startHealthCheck();
    } catch (error) {
      this.setStatus('error');
      this.recordError(error as Error);
      throw this.createError(
        `Failed to connect to HL7 server: ${(error as Error).message}`,
        'CONNECTION_FAILED',
        true
      );
    }
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheck(): void {
    // Clear existing health check
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Run health check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      const healthy = await this.performHealthCheck();
      if (!healthy) {
        this.emit('unhealthy');
        this.logger.warn('Health check failed, attempting reconnect');
        await this.reconnect();
      }
    }, 30000);
  }

  /**
   * Perform health check on connections
   */
  private async performHealthCheck(): Promise<boolean> {
    // Check if we have active connections
    if (this.connectionPool.length === 0) {
      return false;
    }

    // Check if connections are still alive
    for (const connection of this.connectionPool) {
      if (connection.socket.destroyed) {
        this.removeConnectionFromPool(connection.socket);
      }
    }

    // If all connections are destroyed, we're unhealthy
    return this.connectionPool.length > 0;
  }

  /**
   * Reconnect to the HL7 server
   */
  private async reconnect(): Promise<void> {
    this.logger.info('Reconnecting to HL7 server');
    try {
      await this.disconnect();
      await this.connect();
    } catch (error) {
      this.logger.error({ err: error }, 'Reconnection failed');
      throw error;
    }
  }

  private async createConnection(): Promise<HL7Connection> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let connected = false;

      socket.setTimeout(this.hl7Config.timeout || 30000);

      socket.on('connect', () => {
        connected = true;
        if (this.hl7Config.keepAlive) {
          socket.setKeepAlive(true, 60000);
        }
        const connection: HL7Connection = {
          socket,
          inUse: false,
          lastUsed: Date.now(),
        };
        this.connectionPool.push(connection);
        this.logger.debug('HL7 connection established');
        resolve(connection);
      });

      socket.on('error', (error) => {
        this.logger.error({ err: error }, 'HL7 socket error');
        if (!connected) {
          reject(error);
        } else {
          this.handleConnectionError(error);
        }
      });

      socket.on('close', () => {
        this.logger.warn('HL7 connection closed');
        this.removeConnectionFromPool(socket);
        if (this.status === 'connected') {
          this.scheduleReconnect();
        }
      });

      socket.on('timeout', () => {
        this.logger.warn('HL7 connection timeout');
        socket.destroy();
      });

      socket.connect(this.hl7Config.port, this.hl7Config.host);
    });
  }

  private getAvailableConnection(): HL7Connection | null {
    // Find an available connection
    const available = this.connectionPool.find((conn) => !conn.inUse);
    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();
      return available;
    }
    return null;
  }

  private releaseConnection(connection: HL7Connection): void {
    connection.inUse = false;
    connection.lastUsed = Date.now();
  }

  private removeConnectionFromPool(socket: net.Socket): void {
    const index = this.connectionPool.findIndex((conn) => conn.socket === socket);
    if (index !== -1) {
      this.connectionPool.splice(index, 1);
    }
  }

  private handleConnectionError(error: Error): void {
    this.recordError(error);
    if (this.connectionPool.length === 0) {
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    const delay = this.retryConfig.initialDelayMs;
    this.logger.info({ delay }, 'Scheduling reconnect');

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined;
      try {
        await this.connect();
      } catch (error) {
        this.logger.error({ err: error }, 'Reconnect failed');
        this.scheduleReconnect();
      }
    }, delay);
  }

  async send(message: ConnectorMessage): Promise<void> {
    const startTime = Date.now();

    try {
      // Get available connection
      const connection = await this.waitForConnection();
      if (!connection) {
        throw this.createError('No available connections in pool', 'NO_CONNECTION', true);
      }

      try {
        // Build HL7 message
        const hl7Message = this.buildHL7Message(message);

        // Wrap with MLLP framing
        const mllpMessage = this.wrapWithMLLP(hl7Message);

        // Send message and wait for ACK
        const ack = await this.sendAndWaitForAck(connection.socket, mllpMessage);

        // Process ACK
        this.processAck(ack);

        this.recordMessageSent();
        this.recordLatency(Date.now() - startTime);

        this.logger.debug(
          { messageId: message.id, latency: Date.now() - startTime },
          'HL7 message sent successfully'
        );
      } finally {
        this.releaseConnection(connection);
      }
    } catch (error) {
      this.recordError(error as Error);
      throw error;
    }
  }

  private async waitForConnection(timeoutMs: number = 10000): Promise<HL7Connection | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const connection = this.getAvailableConnection();
      if (connection) {
        return connection;
      }
      await this.sleep(100); // Wait 100ms before trying again
    }

    return null;
  }

  private buildHL7Message(message: ConnectorMessage): string {
    // If payload is already a string, assume it's HL7 format
    if (typeof message.payload === 'string') {
      return message.payload;
    }

    // Otherwise, build HL7 message from structured data
    // This is a simplified example - real implementation would be more complex
    const segments: string[] = [];

    // MSH segment (Message Header)
    segments.push(
      `MSH|^~\\&|${message.source}|${this.config.orgId}|${message.destination}||${this.getHL7Timestamp()}||${message.type}|${message.id}|P|2.5||NE|AL`
    );

    // Add other segments from payload
    if (message.payload.segments) {
      segments.push(...message.payload.segments);
    }

    return segments.join('\r');
  }

  private wrapWithMLLP(message: string): Buffer {
    const messageBuffer = Buffer.from(message, this.hl7Config.encoding || 'utf8');
    const mllpMessage = Buffer.concat([
      Buffer.from([this.START_BLOCK]),
      messageBuffer,
      Buffer.from([this.END_BLOCK, this.CARRIAGE_RETURN]),
    ]);
    return mllpMessage;
  }

  private unwrapMLLP(buffer: Buffer): string {
    // Remove MLLP framing bytes
    let start = 0;
    let end = buffer.length;

    if (buffer[0] === this.START_BLOCK) {
      start = 1;
    }

    if (buffer[end - 2] === this.END_BLOCK && buffer[end - 1] === this.CARRIAGE_RETURN) {
      end = end - 2;
    }

    return buffer.slice(start, end).toString(this.hl7Config.encoding || 'utf8');
  }

  private sendAndWaitForAck(socket: net.Socket, message: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.removeAllListeners('data');
        reject(this.createError('ACK timeout', 'ACK_TIMEOUT', true));
      }, this.hl7Config.timeout || 30000);

      // Extract original message control ID for validation
      const originalMessage = message
        .slice(1, message.length - 2)
        .toString(this.hl7Config.encoding || 'utf8');
      const originalControlId = this.extractMessageControlId(originalMessage);

      const dataHandler = (data: Buffer) => {
        this.handleData(data, (ack: string) => {
          clearTimeout(timeout);
          socket.removeListener('data', dataHandler);
          socket.removeListener('error', errorHandler);

          try {
            // Validate ACK matches original message
            this.validateACK(ack, originalControlId);
            this.recordMessageReceived();
            resolve(ack);
          } catch (error) {
            reject(error);
          }
        });
      };

      const errorHandler = (error: Error) => {
        clearTimeout(timeout);
        socket.removeListener('data', dataHandler);
        reject(error);
      };

      socket.on('data', dataHandler);
      socket.once('error', errorHandler);

      socket.write(message);
    });
  }

  /**
   * Handle partial MLLP frames by buffering incomplete messages
   */
  private handleData(data: Buffer, onMessage: (message: string) => void): void {
    this.buffer = Buffer.concat([this.buffer, data]);

    while (this.buffer.length > 0) {
      const start = this.buffer.indexOf(this.START_BLOCK);
      const end = this.buffer.indexOf(Buffer.from([this.END_BLOCK, this.CARRIAGE_RETURN]));

      if (start === -1 || end === -1) {
        // Incomplete message, wait for more data
        break;
      }

      // Extract complete message
      const message = this.buffer.slice(start + 1, end);
      this.buffer = this.buffer.slice(end + 2);

      // Process message
      onMessage(message.toString(this.hl7Config.encoding || 'utf8'));
    }
  }

  /**
   * Extract message control ID from HL7 message
   */
  private extractMessageControlId(message: string): string {
    const segments = message.split('\r');
    const msh = segments.find((seg) => seg.startsWith('MSH'));

    if (!msh) {
      throw this.createError(
        'Invalid HL7 message: MSH segment not found',
        'INVALID_MESSAGE',
        false
      );
    }

    const fields = msh.split('|');
    return fields[9] || ''; // MSH-10 is message control ID
  }

  /**
   * Parse HL7 message into structured format
   */
  private parseHL7Message(message: string): HL7Message {
    const segments = message.split('\r');
    const parsedSegments: Array<{ name: string; fields: string[] }> = [];
    let msh: { messageControlId: string } | undefined;

    for (const segment of segments) {
      if (!segment) continue;

      const fields = segment.split('|');
      const segmentName = fields[0];

      parsedSegments.push({
        name: segmentName,
        fields: fields.slice(1),
      });

      // Extract MSH for control ID
      if (segmentName === 'MSH') {
        msh = {
          messageControlId: fields[9] || '',
        };
      }
    }

    return {
      msh,
      segments: parsedSegments,
    };
  }

  /**
   * Validate ACK message control ID matches original message
   */
  private validateACK(ack: string, originalControlId: string): boolean {
    const ackMessage = this.parseHL7Message(ack);

    // Get MSA segment (Message Acknowledgment)
    const msaSegment = ackMessage.segments.find((s) => s.name === 'MSA');
    if (!msaSegment) {
      throw this.createError('Invalid ACK: MSA segment not found', 'INVALID_ACK', false);
    }

    const msaControlId = msaSegment.fields[1]; // MSA-2 is message control ID

    if (msaControlId !== originalControlId) {
      throw this.createError(
        `ACK mismatch: expected ${originalControlId}, got ${msaControlId}`,
        'ACK_MISMATCH',
        false,
        { expected: originalControlId, received: msaControlId }
      );
    }

    return true;
  }

  private processAck(ack: string): void {
    // Parse ACK/NAK
    const segments = ack.split('\r');
    const msa = segments.find((seg) => seg.startsWith('MSA'));

    if (!msa) {
      throw this.createError('Invalid ACK: MSA segment not found', 'INVALID_ACK', false);
    }

    const fields = msa.split('|');
    const ackCode = fields[1]; // AA = Application Accept, AE = Application Error, AR = Application Reject

    if (ackCode === 'AE' || ackCode === 'AR') {
      const errorMessage = fields[3] || 'Unknown error';
      throw this.createError(
        `HL7 message rejected: ${errorMessage}`,
        ackCode === 'AE' ? 'MESSAGE_ERROR' : 'MESSAGE_REJECTED',
        false,
        { ack }
      );
    }

    this.logger.debug({ ackCode }, 'Received ACK');
  }

  private getHL7Timestamp(): string {
    const now = new Date();
    return (
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0')
    );
  }

  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting from HL7 server');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    // Close all connections in pool
    for (const connection of this.connectionPool) {
      try {
        connection.socket.destroy();
      } catch (error) {
        this.logger.warn({ err: error }, 'Error closing connection');
      }
    }

    this.connectionPool = [];
    this.buffer = Buffer.alloc(0); // Clear buffer
    this.setStatus('disconnected');
    this.logger.info('Disconnected from HL7 server');
  }
}

/**
 * S13 - MLLP (Minimum Lower Layer Protocol) Client
 *
 * TCP client for sending HL7 v2 messages
 * Handles MLLP framing and ACK/NAK responses
 */

import * as net from 'net';
import { HL7Message, HL7Acknowledgment } from '../types';
import { HL7Parser } from '../parser';

export interface MLLPClientOptions {
  host: string;
  port: number;
  timeout?: number; // Response timeout in ms (default: 10000)
  connectTimeout?: number; // Connection timeout in ms (default: 5000)
  keepAlive?: boolean; // Keep connection alive (default: false)
}

export interface SendResult {
  success: boolean;
  acknowledgment?: HL7Acknowledgment;
  error?: Error;
}

const VT = '\x0B'; // Vertical Tab (Start Block)
const FS = '\x1C'; // File Separator (End Block)
const CR = '\x0D'; // Carriage Return (Terminator)

export class MLLPClient {
  private options: Required<MLLPClientOptions>;
  private socket: net.Socket | null = null;
  private buffer = '';
  private pendingResponse: {
    resolve: (ack: HL7Acknowledgment) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  } | null = null;

  constructor(options: MLLPClientOptions) {
    this.options = {
      host: options.host,
      port: options.port,
      timeout: options.timeout || 10000,
      connectTimeout: options.connectTimeout || 5000,
      keepAlive: options.keepAlive || false,
    };
  }

  /**
   * Send an HL7 message and wait for acknowledgment
   */
  async send(message: HL7Message | string): Promise<SendResult> {
    try {
      // Convert to string if HL7Message
      const messageText = typeof message === 'string' ? message : HL7Parser.serialize(message);

      // Ensure connection
      await this.connect();

      // Send message and wait for ACK
      const acknowledgment = await this.sendAndWaitForAck(messageText);

      // Close connection if not keeping alive
      if (!this.options.keepAlive) {
        await this.disconnect();
      }

      return {
        success: acknowledgment.ackCode === 'AA',
        acknowledgment,
      };
    } catch (error) {
      // Close connection on error
      await this.disconnect();

      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Connect to MLLP server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && !this.socket.destroyed) {
        resolve();
        return;
      }

      this.socket = new net.Socket();
      this.buffer = '';

      // Set connection timeout
      const connectTimeout = setTimeout(() => {
        this.socket?.destroy();
        reject(new Error('Connection timeout'));
      }, this.options.connectTimeout);

      this.socket.on('connect', () => {
        clearTimeout(connectTimeout);
        resolve();
      });

      this.socket.on('data', (data) => {
        this.handleData(data);
      });

      this.socket.on('error', (error) => {
        clearTimeout(connectTimeout);
        if (this.pendingResponse) {
          this.pendingResponse.reject(error);
          clearTimeout(this.pendingResponse.timeout);
          this.pendingResponse = null;
        }
      });

      this.socket.on('close', () => {
        this.socket = null;
        if (this.pendingResponse) {
          this.pendingResponse.reject(new Error('Connection closed'));
          clearTimeout(this.pendingResponse.timeout);
          this.pendingResponse = null;
        }
      });

      this.socket.connect(this.options.port, this.options.host);
    });
  }

  /**
   * Disconnect from MLLP server
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket || this.socket.destroyed) {
        resolve();
        return;
      }

      this.socket.once('close', () => {
        resolve();
      });

      this.socket.destroy();
    });
  }

  /**
   * Send message and wait for acknowledgment
   */
  private sendAndWaitForAck(messageText: string): Promise<HL7Acknowledgment> {
    return new Promise((resolve, reject) => {
      try {
        // Input validation
        if (!messageText || typeof messageText !== 'string') {
          reject(new Error('Invalid message: message must be a non-empty string'));
          return;
        }

        if (!this.socket || this.socket.destroyed) {
          reject(new Error('Not connected'));
          return;
        }

        // Set up response handler
        const timeout = setTimeout(() => {
          this.pendingResponse = null;
          reject(new Error('Response timeout'));
        }, this.options.timeout);

        this.pendingResponse = { resolve, reject, timeout };

        // Frame message with MLLP delimiters
        const framedMessage = VT + messageText + FS + CR;

        // Send message
        this.socket.write(framedMessage, (error) => {
          if (error) {
            clearTimeout(timeout);
            this.pendingResponse = null;
            reject(new Error(`Failed to send message: ${error.message}`));
          }
        });
      } catch (error) {
        reject(error as Error);
      }
    });
  }

  /**
   * Handle incoming data
   */
  private handleData(data: Buffer): void {
    try {
      // Null check
      if (!data) {
        return;
      }

      // Append to buffer with error handling
      try {
        this.buffer += data.toString('utf-8');
      } catch (err) {
        if (this.pendingResponse) {
          this.pendingResponse.reject(new Error(`Failed to decode data: ${err}`));
          clearTimeout(this.pendingResponse.timeout);
          this.pendingResponse = null;
        }
        return;
      }

      // Prevent buffer overflow
      if (this.buffer.length > 1024 * 1024) {
        // 1MB limit
        if (this.pendingResponse) {
          this.pendingResponse.reject(new Error('Buffer size exceeded maximum limit (1MB)'));
          clearTimeout(this.pendingResponse.timeout);
          this.pendingResponse = null;
        }
        this.buffer = '';
        return;
      }

      // Try to extract ACK message
      const ack = this.extractAcknowledgment();
      if (ack && this.pendingResponse) {
        clearTimeout(this.pendingResponse.timeout);
        this.pendingResponse.resolve(ack);
        this.pendingResponse = null;
      }
    } catch (error) {
      if (this.pendingResponse) {
        this.pendingResponse.reject(error as Error);
        clearTimeout(this.pendingResponse.timeout);
        this.pendingResponse = null;
      }
    }
  }

  /**
   * Extract acknowledgment from buffer
   */
  private extractAcknowledgment(): HL7Acknowledgment | null {
    // Look for start block (VT)
    const startIndex = this.buffer.indexOf(VT);
    if (startIndex === -1) {
      return null;
    }

    // Look for end block (FS + CR)
    const endSequence = FS + CR;
    const endIndex = this.buffer.indexOf(endSequence, startIndex);
    if (endIndex === -1) {
      return null;
    }

    // Extract message (without VT, FS, CR)
    const messageText = this.buffer.substring(startIndex + 1, endIndex);

    // Remove processed message from buffer
    this.buffer = this.buffer.substring(endIndex + endSequence.length);

    // Parse acknowledgment
    try {
      const message = HL7Parser.parse(messageText);

      // Extract MSA segment (Message Acknowledgment)
      const msaSegment = HL7Parser.getSegment(message, 'MSA');
      if (!msaSegment) {
        throw new Error('MSA segment not found in acknowledgment');
      }

      const ackCode = (HL7Parser.getField(msaSegment, 1) as 'AA' | 'AE' | 'AR') || 'AE';
      const messageControlId = HL7Parser.getField(msaSegment, 2) || '';
      const textMessage = HL7Parser.getField(msaSegment, 3) || undefined;

      return {
        messageType: ackCode === 'AA' ? 'ACK' : 'NAK',
        messageControlId,
        ackCode,
        textMessage,
        raw: messageText,
      };
    } catch (error) {
      // Return error as NAK
      return {
        messageType: 'NAK',
        messageControlId: '',
        ackCode: 'AE',
        textMessage: error instanceof Error ? error.message : 'Unknown error',
        raw: messageText,
      };
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket !== null && !this.socket.destroyed;
  }

  /**
   * Get client info
   */
  getInfo(): {
    connected: boolean;
    host: string;
    port: number;
  } {
    return {
      connected: this.isConnected(),
      host: this.options.host,
      port: this.options.port,
    };
  }
}

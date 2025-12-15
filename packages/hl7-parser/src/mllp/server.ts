/**
 * S13 - MLLP (Minimum Lower Layer Protocol) Server
 *
 * TCP server for receiving HL7 v2 messages
 * Handles MLLP framing: <VT>message<FS><CR>
 * VT = 0x0B (vertical tab)
 * FS = 0x1C (file separator)
 * CR = 0x0D (carriage return)
 */

import * as net from "net";
import { EventEmitter } from "events";
import { HL7Parser } from "../parser";
import { HL7Message, HL7Acknowledgment } from "../types";

export interface MLLPServerOptions {
  host?: string;
  port: number;
  timeout?: number; // Connection timeout in ms (default: 30000)
  autoAck?: boolean; // Automatically send ACK (default: true)
  validateMessage?: boolean; // Validate incoming messages (default: true)
}

export interface MLLPServerEvents {
  connection: (connectionId: string) => void;
  message: (
    message: HL7Message,
    connectionId: string,
    respond: (ack: HL7Acknowledgment) => void,
  ) => void;
  error: (error: Error, connectionId?: string) => void;
  close: (connectionId: string) => void;
}

const VT = "\x0B"; // Vertical Tab (Start Block)
const FS = "\x1C"; // File Separator (End Block)
const CR = "\x0D"; // Carriage Return (Terminator)

export class MLLPServer extends EventEmitter {
  private server: net.Server | null = null;
  private connections: Map<string, net.Socket> = new Map();
  private buffers: Map<string, string> = new Map();
  private options: Required<MLLPServerOptions>;
  private nextConnectionId = 1;

  constructor(options: MLLPServerOptions) {
    super();

    this.options = {
      host: options.host || "0.0.0.0",
      port: options.port,
      timeout: options.timeout || 30000,
      autoAck: options.autoAck !== undefined ? options.autoAck : true,
      validateMessage:
        options.validateMessage !== undefined ? options.validateMessage : true,
    };
  }

  /**
   * Start the MLLP server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        reject(new Error("Server is already running"));
        return;
      }

      this.server = net.createServer((socket) => {
        this.handleConnection(socket);
      });

      this.server.on("error", (error) => {
        this.emit("error", error);
      });

      this.server.listen(this.options.port, this.options.host, () => {
        resolve();
      });
    });
  }

  /**
   * Stop the MLLP server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      // Close all active connections
      for (const [connectionId, socket] of this.connections) {
        socket.destroy();
        this.connections.delete(connectionId);
        this.buffers.delete(connectionId);
      }

      this.server.close(() => {
        this.server = null;
        resolve();
      });
    });
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: net.Socket): void {
    const connectionId = `conn-${this.nextConnectionId++}`;
    this.connections.set(connectionId, socket);
    this.buffers.set(connectionId, "");

    // Set timeout
    socket.setTimeout(this.options.timeout);

    this.emit("connection", connectionId);

    socket.on("data", (data) => {
      try {
        this.handleData(connectionId, data);
      } catch (error) {
        this.emit("error", error as Error, connectionId);
      }
    });

    socket.on("timeout", () => {
      this.emit("error", new Error("Connection timeout"), connectionId);
      socket.destroy();
    });

    socket.on("error", (error) => {
      this.emit("error", error, connectionId);
    });

    socket.on("close", () => {
      this.connections.delete(connectionId);
      this.buffers.delete(connectionId);
      this.emit("close", connectionId);
    });
  }

  /**
   * Handle incoming data
   */
  private handleData(connectionId: string, data: Buffer): void {
    const socket = this.connections.get(connectionId);
    if (!socket) {
      return;
    }

    // Append to buffer
    let buffer = this.buffers.get(connectionId) || "";
    buffer += data.toString("utf-8");
    this.buffers.set(connectionId, buffer);

    // Process complete messages
    while (true) {
      const message = this.extractMessage(connectionId);
      if (!message) {
        break;
      }

      this.processMessage(connectionId, message, socket);
    }
  }

  /**
   * Extract a complete MLLP message from buffer
   */
  private extractMessage(connectionId: string): string | null {
    let buffer = this.buffers.get(connectionId) || "";

    // Look for start block (VT)
    const startIndex = buffer.indexOf(VT);
    if (startIndex === -1) {
      // No start block found, clear junk data before potential start
      if (buffer.length > 1000) {
        buffer = buffer.substring(buffer.length - 100);
        this.buffers.set(connectionId, buffer);
      }
      return null;
    }

    // Look for end block (FS + CR)
    const endSequence = FS + CR;
    const endIndex = buffer.indexOf(endSequence, startIndex);
    if (endIndex === -1) {
      // Incomplete message, wait for more data
      return null;
    }

    // Extract message (without VT, FS, CR)
    const message = buffer.substring(startIndex + 1, endIndex);

    // Remove processed message from buffer
    buffer = buffer.substring(endIndex + endSequence.length);
    this.buffers.set(connectionId, buffer);

    return message;
  }

  /**
   * Process a complete HL7 message
   */
  private processMessage(
    connectionId: string,
    messageText: string,
    socket: net.Socket,
  ): void {
    try {
      // Parse HL7 message
      const message = HL7Parser.parse(messageText);

      // Validate if required
      if (this.options.validateMessage) {
        this.validateMessage(message);
      }

      // Create respond function
      const respond = (ack: HL7Acknowledgment) => {
        this.sendAcknowledgment(socket, ack);
      };

      // Emit message event
      this.emit("message", message, connectionId, respond);

      // Auto-acknowledge if enabled
      if (this.options.autoAck) {
        const ack = HL7Parser.generateACK(message.messageControlId, "AA");
        this.sendAcknowledgment(socket, ack);
      }
    } catch (error) {
      // Send NAK on error
      try {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const nak = HL7Parser.generateNAK("UNKNOWN", errorMessage);
        this.sendAcknowledgment(socket, nak);
      } catch (nakError) {
        // Ignore NAK sending errors
      }

      this.emit("error", error as Error, connectionId);
    }
  }

  /**
   * Send ACK/NAK response
   */
  private sendAcknowledgment(socket: net.Socket, ack: HL7Acknowledgment): void {
    const framedMessage = VT + ack.raw + FS + CR;
    socket.write(framedMessage);
  }

  /**
   * Validate HL7 message
   */
  private validateMessage(message: HL7Message): void {
    if (!message.messageType) {
      throw new Error("Message type is missing");
    }

    if (!message.messageControlId) {
      throw new Error("Message control ID is missing");
    }

    if (message.segments.length === 0) {
      throw new Error("Message has no segments");
    }
  }

  /**
   * Get server info
   */
  getInfo(): {
    running: boolean;
    host: string;
    port: number;
    connections: number;
  } {
    return {
      running: this.server !== null,
      host: this.options.host,
      port: this.options.port,
      connections: this.connections.size,
    };
  }

  /**
   * Type-safe event emitter methods
   */
  on<K extends keyof MLLPServerEvents>(
    event: K,
    listener: MLLPServerEvents[K],
  ): this {
    return super.on(event, listener as any);
  }

  emit<K extends keyof MLLPServerEvents>(
    event: K,
    ...args: Parameters<MLLPServerEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

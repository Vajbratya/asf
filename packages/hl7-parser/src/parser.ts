/**
 * S08 - Core HL7 v2 Parser
 *
 * Parses any HL7 v2 message with configurable delimiters
 * Handles escape sequences and generates ACK/NAK responses
 */

import {
  HL7Delimiters,
  HL7Message,
  HL7Segment,
  HL7Acknowledgment,
} from "./types";

export class HL7Parser {
  private static readonly DEFAULT_DELIMITERS: HL7Delimiters = {
    field: "|",
    component: "^",
    repetition: "~",
    escape: "\\",
    subcomponent: "&",
  };

  /**
   * Parse an HL7 v2 message
   */
  static parse(message: string): HL7Message {
    if (!message || message.trim().length === 0) {
      throw new Error("Message is empty");
    }

    const lines = message
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
      throw new Error("No segments found in message");
    }

    // First line must be MSH
    const mshLine = lines[0];
    if (!mshLine.startsWith("MSH")) {
      throw new Error("Message must start with MSH segment");
    }

    // Extract delimiters from MSH segment
    // MSH|^~\&|...
    const delimiters = this.extractDelimiters(mshLine);

    // Parse all segments
    const segments: HL7Segment[] = [];
    for (const line of lines) {
      segments.push(this.parseSegment(line, delimiters));
    }

    // Extract message type and control ID from MSH
    const mshSegment = segments[0];
    const messageType = this.getField(mshSegment, 9, 0) || "UNKNOWN";
    const messageControlId = this.getField(mshSegment, 10, 0) || "";

    return {
      messageType,
      messageControlId,
      delimiters,
      segments,
      raw: message,
    };
  }

  /**
   * Extract delimiters from MSH segment
   */
  private static extractDelimiters(mshLine: string): HL7Delimiters {
    if (mshLine.length < 9) {
      throw new Error("MSH segment too short to extract delimiters");
    }

    // MSH is special: MSH|^~\&|...
    // Position 3 is field separator (|)
    // Positions 4-7 are encoding characters (^~\&)
    return {
      field: mshLine[3] || "|",
      component: mshLine[4] || "^",
      repetition: mshLine[5] || "~",
      escape: mshLine[6] || "\\",
      subcomponent: mshLine[7] || "&",
    };
  }

  /**
   * Parse a single segment
   */
  private static parseSegment(
    line: string,
    delimiters: HL7Delimiters,
  ): HL7Segment {
    const segmentName = line.substring(0, 3);

    // MSH is special - field separator is not really a field
    if (segmentName === "MSH") {
      return this.parseMSHSegment(line, delimiters);
    }

    const fieldSeparator = delimiters.field;
    const parts = line.split(fieldSeparator);

    // First part is segment name
    const fields: string[][] = [];

    for (let i = 1; i < parts.length; i++) {
      const fieldValue = parts[i];
      const repetitions = fieldValue.split(delimiters.repetition);

      // Unescape each repetition
      const unescapedRepetitions = repetitions.map((rep) =>
        this.unescape(rep, delimiters),
      );

      fields.push(unescapedRepetitions);
    }

    return {
      name: segmentName,
      fields,
    };
  }

  /**
   * Parse MSH segment (special case)
   */
  private static parseMSHSegment(
    line: string,
    delimiters: HL7Delimiters,
  ): HL7Segment {
    const fields: string[][] = [];

    // Field 1 is the encoding characters
    const encodingChars =
      delimiters.component +
      delimiters.repetition +
      delimiters.escape +
      delimiters.subcomponent;
    fields.push([encodingChars]);

    // Split rest of line by field separator
    const fieldSeparator = delimiters.field;
    const afterMSH = line.substring(3 + 1 + encodingChars.length); // Skip "MSH|^~\&"
    const parts = afterMSH.split(fieldSeparator);

    for (const part of parts) {
      const repetitions = part.split(delimiters.repetition);
      const unescapedRepetitions = repetitions.map((rep) =>
        this.unescape(rep, delimiters),
      );
      fields.push(unescapedRepetitions);
    }

    return {
      name: "MSH",
      fields,
    };
  }

  /**
   * Unescape HL7 escape sequences
   * \F\ = field separator
   * \S\ = component separator
   * \T\ = subcomponent separator
   * \R\ = repetition separator
   * \E\ = escape character
   * \Xnn\ = hexadecimal character
   */
  private static unescape(value: string, delimiters: HL7Delimiters): string {
    if (!value.includes(delimiters.escape)) {
      return value;
    }

    return value
      .replace(/\\F\\/g, delimiters.field)
      .replace(/\\S\\/g, delimiters.component)
      .replace(/\\T\\/g, delimiters.subcomponent)
      .replace(/\\R\\/g, delimiters.repetition)
      .replace(/\\E\\/g, delimiters.escape)
      .replace(/\\X([0-9A-Fa-f]{2})\\/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
  }

  /**
   * Escape special characters for HL7
   */
  static escape(value: string, delimiters: HL7Delimiters): string {
    return value
      .replace(
        new RegExp(
          delimiters.escape.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g",
        ),
        "\\E\\",
      )
      .replace(
        new RegExp(
          delimiters.field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g",
        ),
        "\\F\\",
      )
      .replace(
        new RegExp(
          delimiters.component.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g",
        ),
        "\\S\\",
      )
      .replace(
        new RegExp(
          delimiters.subcomponent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g",
        ),
        "\\T\\",
      )
      .replace(
        new RegExp(
          delimiters.repetition.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g",
        ),
        "\\R\\",
      );
  }

  /**
   * Get a field value from a segment
   * @param segment The segment
   * @param fieldIndex Field index (1-based, as in HL7 spec)
   * @param repetition Repetition index (0-based)
   */
  static getField(
    segment: HL7Segment,
    fieldIndex: number,
    repetition: number = 0,
  ): string | null {
    // Convert to 0-based index
    const index = fieldIndex - 1;

    if (index < 0 || index >= segment.fields.length) {
      return null;
    }

    const field = segment.fields[index];
    if (repetition < 0 || repetition >= field.length) {
      return null;
    }

    return field[repetition];
  }

  /**
   * Get a component from a field
   * @param fieldValue The field value (may contain components)
   * @param componentIndex Component index (1-based)
   * @param delimiters The delimiters
   */
  static getComponent(
    fieldValue: string,
    componentIndex: number,
    delimiters: HL7Delimiters,
  ): string | null {
    const components = fieldValue.split(delimiters.component);
    const index = componentIndex - 1;

    if (index < 0 || index >= components.length) {
      return null;
    }

    return components[index];
  }

  /**
   * Get a segment by name
   */
  static getSegment(
    message: HL7Message,
    segmentName: string,
    occurrence: number = 0,
  ): HL7Segment | null {
    const segments = message.segments.filter((s) => s.name === segmentName);
    if (occurrence >= segments.length) {
      return null;
    }
    return segments[occurrence];
  }

  /**
   * Get all segments by name
   */
  static getSegments(message: HL7Message, segmentName: string): HL7Segment[] {
    return message.segments.filter((s) => s.name === segmentName);
  }

  /**
   * Generate ACK (acknowledgment) response
   */
  static generateACK(
    messageControlId: string,
    ackCode: "AA" | "AE" | "AR" = "AA",
    textMessage?: string,
    delimiters: HL7Delimiters = HL7Parser.DEFAULT_DELIMITERS,
  ): HL7Acknowledgment {
    const timestamp = this.formatHL7DateTime(new Date());
    const newControlId = this.generateMessageControlId();

    const encodingChars =
      delimiters.component +
      delimiters.repetition +
      delimiters.escape +
      delimiters.subcomponent;

    const msh =
      `MSH${delimiters.field}${encodingChars}${delimiters.field}` +
      `INTEGRABRASIL${delimiters.field}${delimiters.field}${delimiters.field}${delimiters.field}` +
      `${timestamp}${delimiters.field}${delimiters.field}` +
      `ACK${delimiters.field}${newControlId}${delimiters.field}P${delimiters.field}2.5`;

    const msa =
      `MSA${delimiters.field}${ackCode}${delimiters.field}${messageControlId}` +
      (textMessage
        ? `${delimiters.field}${this.escape(textMessage, delimiters)}`
        : "");

    const raw = `${msh}\r${msa}\r`;

    return {
      messageType: ackCode === "AA" ? "ACK" : "NAK",
      messageControlId: newControlId,
      ackCode,
      textMessage,
      raw,
    };
  }

  /**
   * Generate NAK (negative acknowledgment) response
   */
  static generateNAK(
    messageControlId: string,
    errorMessage: string,
    delimiters: HL7Delimiters = HL7Parser.DEFAULT_DELIMITERS,
  ): HL7Acknowledgment {
    return this.generateACK(messageControlId, "AE", errorMessage, delimiters);
  }

  /**
   * Format a Date as HL7 datetime (YYYYMMDDHHMMSS)
   */
  static formatHL7DateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Parse HL7 datetime to JavaScript Date
   */
  static parseHL7DateTime(hl7DateTime: string): Date | null {
    if (!hl7DateTime || hl7DateTime.length < 8) {
      return null;
    }

    const year = parseInt(hl7DateTime.substring(0, 4), 10);
    const month = parseInt(hl7DateTime.substring(4, 6), 10) - 1;
    const day = parseInt(hl7DateTime.substring(6, 8), 10);

    let hours = 0,
      minutes = 0,
      seconds = 0;

    if (hl7DateTime.length >= 10) {
      hours = parseInt(hl7DateTime.substring(8, 10), 10);
    }
    if (hl7DateTime.length >= 12) {
      minutes = parseInt(hl7DateTime.substring(10, 12), 10);
    }
    if (hl7DateTime.length >= 14) {
      seconds = parseInt(hl7DateTime.substring(12, 14), 10);
    }

    return new Date(year, month, day, hours, minutes, seconds);
  }

  /**
   * Generate a unique message control ID
   */
  static generateMessageControlId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Serialize a message back to HL7 string format
   */
  static serialize(message: HL7Message): string {
    const lines: string[] = [];

    for (const segment of message.segments) {
      if (segment.name === "MSH") {
        lines.push(this.serializeMSHSegment(segment, message.delimiters));
      } else {
        lines.push(this.serializeSegment(segment, message.delimiters));
      }
    }

    return lines.join("\r") + "\r";
  }

  /**
   * Serialize a regular segment
   */
  private static serializeSegment(
    segment: HL7Segment,
    delimiters: HL7Delimiters,
  ): string {
    const parts = [segment.name];

    for (const field of segment.fields) {
      const escapedRepetitions = field.map((rep) =>
        this.escape(rep, delimiters),
      );
      parts.push(escapedRepetitions.join(delimiters.repetition));
    }

    return parts.join(delimiters.field);
  }

  /**
   * Serialize MSH segment (special case)
   */
  private static serializeMSHSegment(
    segment: HL7Segment,
    delimiters: HL7Delimiters,
  ): string {
    const encodingChars =
      delimiters.component +
      delimiters.repetition +
      delimiters.escape +
      delimiters.subcomponent;

    const parts = [`MSH${delimiters.field}${encodingChars}`];

    // Skip first field (encoding chars) as we already added it
    for (let i = 1; i < segment.fields.length; i++) {
      const field = segment.fields[i];
      const escapedRepetitions = field.map((rep) =>
        this.escape(rep, delimiters),
      );
      parts.push(escapedRepetitions.join(delimiters.repetition));
    }

    return parts.join(delimiters.field);
  }
}

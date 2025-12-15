/**
 * Unit tests for Core HL7 Parser (S08)
 */

import { HL7Parser } from "../parser";

describe("HL7Parser", () => {
  describe("parse", () => {
    it("should parse a basic ADT message", () => {
      const message = `MSH|^~\\&|SENDING_APP|SENDING_FAC|RECEIVING_APP|RECEIVING_FAC|20231215120000||ADT^A01|MSG00001|P|2.5
PID|1||123456^^^HOSPITAL^MR||DOE^JOHN^A||19800101|M|||123 MAIN ST^^SAO PAULO^SP^01000^BR||(11)98765-4321
PV1|1|I|ICU^201^A|||||||SMITH^JOHN|||SUR||||||||V123456`;

      const parsed = HL7Parser.parse(message);

      expect(parsed.messageType).toBe("ADT^A01");
      expect(parsed.messageControlId).toBe("MSG00001");
      expect(parsed.segments).toHaveLength(3);
      expect(parsed.segments[0].name).toBe("MSH");
      expect(parsed.segments[1].name).toBe("PID");
      expect(parsed.segments[2].name).toBe("PV1");
    });

    it("should extract delimiters from MSH", () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5`;
      const parsed = HL7Parser.parse(message);

      expect(parsed.delimiters.field).toBe("|");
      expect(parsed.delimiters.component).toBe("^");
      expect(parsed.delimiters.repetition).toBe("~");
      expect(parsed.delimiters.escape).toBe("\\");
      expect(parsed.delimiters.subcomponent).toBe("&");
    });

    it("should handle custom delimiters", () => {
      const message = `MSH#@!\\$#APP#FAC#APP2#FAC2#20231215120000##ADT@A01#MSG001#P#2.5`;
      const parsed = HL7Parser.parse(message);

      expect(parsed.delimiters.field).toBe("#");
      expect(parsed.delimiters.component).toBe("@");
      expect(parsed.delimiters.repetition).toBe("!");
    });

    it("should throw error for empty message", () => {
      expect(() => HL7Parser.parse("")).toThrow("Message is empty");
    });

    it("should throw error for message without MSH", () => {
      expect(() => HL7Parser.parse("PID|1||12345")).toThrow(
        "Message must start with MSH segment",
      );
    });
  });

  describe("getField", () => {
    it("should extract field by index", () => {
      const message = `MSH|^~\\&|SENDING_APP|SENDING_FAC|REC_APP|REC_FAC|20231215120000||ADT^A01|MSG001|P|2.5`;
      const parsed = HL7Parser.parse(message);
      const mshSegment = parsed.segments[0];

      expect(HL7Parser.getField(mshSegment, 3, 0)).toBe("SENDING_FAC");
      expect(HL7Parser.getField(mshSegment, 5, 0)).toBe("REC_FAC");
    });

    it("should handle repetitions", () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||ID1~ID2~ID3`;
      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];

      expect(HL7Parser.getField(pidSegment, 3, 0)).toBe("ID1");
      expect(HL7Parser.getField(pidSegment, 3, 1)).toBe("ID2");
      expect(HL7Parser.getField(pidSegment, 3, 2)).toBe("ID3");
    });
  });

  describe("escape/unescape", () => {
    it("should escape special characters", () => {
      const delimiters = {
        field: "|",
        component: "^",
        repetition: "~",
        escape: "\\",
        subcomponent: "&",
      };

      const escaped = HL7Parser.escape("Test|with^special~chars", delimiters);
      expect(escaped).toContain("\\F\\");
      expect(escaped).toContain("\\S\\");
      expect(escaped).toContain("\\R\\");
    });
  });

  describe("generateACK", () => {
    it("should generate positive ACK", () => {
      const ack = HL7Parser.generateACK("MSG001", "AA");

      expect(ack.ackCode).toBe("AA");
      expect(ack.messageControlId).toBeDefined();
      expect(ack.raw).toContain("MSH");
      expect(ack.raw).toContain("MSA|AA|MSG001");
    });

    it("should generate NAK with error message", () => {
      const nak = HL7Parser.generateNAK("MSG001", "Invalid segment");

      expect(nak.ackCode).toBe("AE");
      expect(nak.textMessage).toBe("Invalid segment");
      expect(nak.raw).toContain("MSA|AE|MSG001|Invalid segment");
    });
  });

  describe("formatHL7DateTime", () => {
    it("should format date correctly", () => {
      const date = new Date("2023-12-15T12:30:45Z");
      const formatted = HL7Parser.formatHL7DateTime(date);

      expect(formatted).toMatch(/^\d{14}$/);
      expect(formatted.substring(0, 8)).toBe("20231215");
    });
  });

  describe("parseHL7DateTime", () => {
    it("should parse HL7 date correctly", () => {
      const parsed = HL7Parser.parseHL7DateTime("20231215123045");

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed!.getFullYear()).toBe(2023);
      expect(parsed!.getMonth()).toBe(11); // December (0-indexed)
      expect(parsed!.getDate()).toBe(15);
      expect(parsed!.getHours()).toBe(12);
      expect(parsed!.getMinutes()).toBe(30);
      expect(parsed!.getSeconds()).toBe(45);
    });

    it("should handle partial dates", () => {
      const parsed = HL7Parser.parseHL7DateTime("20231215");

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed!.getFullYear()).toBe(2023);
      expect(parsed!.getHours()).toBe(0);
    });
  });

  describe("serialize", () => {
    it("should serialize message back to string", () => {
      const original = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5\rPID|1||12345`;
      const parsed = HL7Parser.parse(original);
      const serialized = HL7Parser.serialize(parsed);

      expect(serialized).toContain("MSH|^~\\&|APP|FAC");
      expect(serialized).toContain("PID|1||12345");
    });
  });
});

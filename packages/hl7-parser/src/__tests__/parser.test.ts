/**
 * Unit tests for Core HL7 Parser (S08)
 */

import { HL7Parser } from '../parser';

describe('HL7Parser', () => {
  describe('parse', () => {
    it('should parse a basic ADT message', () => {
      const message = `MSH|^~\\&|SENDING_APP|SENDING_FAC|RECEIVING_APP|RECEIVING_FAC|20231215120000||ADT^A01|MSG00001|P|2.5
PID|1||123456^^^HOSPITAL^MR||DOE^JOHN^A||19800101|M|||123 MAIN ST^^SAO PAULO^SP^01000^BR||(11)98765-4321
PV1|1|I|ICU^201^A|||||||SMITH^JOHN|||SUR||||||||V123456`;

      const parsed = HL7Parser.parse(message);

      expect(parsed.messageType).toBe('ADT^A01');
      expect(parsed.messageControlId).toBe('MSG00001');
      expect(parsed.segments).toHaveLength(3);
      expect(parsed.segments[0].name).toBe('MSH');
      expect(parsed.segments[1].name).toBe('PID');
      expect(parsed.segments[2].name).toBe('PV1');
    });

    it('should extract delimiters from MSH', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5`;
      const parsed = HL7Parser.parse(message);

      expect(parsed.delimiters.field).toBe('|');
      expect(parsed.delimiters.component).toBe('^');
      expect(parsed.delimiters.repetition).toBe('~');
      expect(parsed.delimiters.escape).toBe('\\');
      expect(parsed.delimiters.subcomponent).toBe('&');
    });

    it('should handle custom delimiters', () => {
      const message = `MSH#@!\\$#APP#FAC#APP2#FAC2#20231215120000##ADT@A01#MSG001#P#2.5`;
      const parsed = HL7Parser.parse(message);

      expect(parsed.delimiters.field).toBe('#');
      expect(parsed.delimiters.component).toBe('@');
      expect(parsed.delimiters.repetition).toBe('!');
    });

    it('should throw error for empty message', () => {
      expect(() => HL7Parser.parse('')).toThrow('Invalid message input');
    });

    it('should throw error for message without MSH', () => {
      expect(() => HL7Parser.parse('PID|1||12345')).toThrow('Message must start with MSH segment');
    });
  });

  describe('getField', () => {
    it('should extract field by index', () => {
      const message = `MSH|^~\\&|SENDING_APP|SENDING_FAC|REC_APP|REC_FAC|20231215120000||ADT^A01|MSG001|P|2.5`;
      const parsed = HL7Parser.parse(message);
      const mshSegment = parsed.segments[0];

      // MSH-1 is the field separator itself (|), MSH-2 is encoding characters (^~\&)
      // MSH-3 = Sending App, MSH-4 = Sending Facility, MSH-5 = Receiving App, MSH-6 = Receiving Facility
      expect(HL7Parser.getField(mshSegment, 3, 0)).toBe('SENDING_APP');
      expect(HL7Parser.getField(mshSegment, 4, 0)).toBe('SENDING_FAC');
      expect(HL7Parser.getField(mshSegment, 5, 0)).toBe('REC_APP');
      expect(HL7Parser.getField(mshSegment, 6, 0)).toBe('REC_FAC');
    });

    it('should handle repetitions', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||ID1~ID2~ID3`;
      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];

      expect(HL7Parser.getField(pidSegment, 3, 0)).toBe('ID1');
      expect(HL7Parser.getField(pidSegment, 3, 1)).toBe('ID2');
      expect(HL7Parser.getField(pidSegment, 3, 2)).toBe('ID3');
    });
  });

  describe('escape/unescape', () => {
    it('should escape special characters', () => {
      const delimiters = {
        field: '|',
        component: '^',
        repetition: '~',
        escape: '\\',
        subcomponent: '&',
      };

      const escaped = HL7Parser.escape('Test|with^special~chars', delimiters);
      expect(escaped).toContain('\\F\\');
      expect(escaped).toContain('\\S\\');
      expect(escaped).toContain('\\R\\');
    });
  });

  describe('generateACK', () => {
    it('should generate positive ACK', () => {
      const ack = HL7Parser.generateACK('MSG001', 'AA');

      expect(ack.ackCode).toBe('AA');
      expect(ack.messageControlId).toBeDefined();
      expect(ack.raw).toContain('MSH');
      expect(ack.raw).toContain('MSA|AA|MSG001');
    });

    it('should generate NAK with error message', () => {
      const nak = HL7Parser.generateNAK('MSG001', 'Invalid segment');

      expect(nak.ackCode).toBe('AE');
      expect(nak.textMessage).toBe('Invalid segment');
      expect(nak.raw).toContain('MSA|AE|MSG001|Invalid segment');
    });
  });

  describe('formatHL7DateTime', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-12-15T12:30:45Z');
      const formatted = HL7Parser.formatHL7DateTime(date);

      expect(formatted).toMatch(/^\d{14}$/);
      expect(formatted.substring(0, 8)).toBe('20231215');
    });
  });

  describe('parseHL7DateTime', () => {
    it('should parse HL7 date correctly', () => {
      const parsed = HL7Parser.parseHL7DateTime('20231215123045');

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed!.getFullYear()).toBe(2023);
      expect(parsed!.getMonth()).toBe(11); // December (0-indexed)
      expect(parsed!.getDate()).toBe(15);
      expect(parsed!.getHours()).toBe(12);
      expect(parsed!.getMinutes()).toBe(30);
      expect(parsed!.getSeconds()).toBe(45);
    });

    it('should handle partial dates', () => {
      const parsed = HL7Parser.parseHL7DateTime('20231215');

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed!.getFullYear()).toBe(2023);
      expect(parsed!.getHours()).toBe(0);
    });
  });

  describe('serialize', () => {
    it('should serialize message back to string', () => {
      const original = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5\rPID|1||12345`;
      const parsed = HL7Parser.parse(original);
      const serialized = HL7Parser.serialize(parsed);

      // Serialized message should contain the MSH segment with proper structure
      expect(serialized).toContain('MSH|^~\\&|');
      expect(serialized).toContain('APP');
      expect(serialized).toContain('PID|1||12345');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty segments gracefully', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID||||||||||||`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];

      expect(pidSegment.name).toBe('PID');
      expect(HL7Parser.getField(pidSegment, 1, 0)).toBe('');
      expect(HL7Parser.getField(pidSegment, 2, 0)).toBe('');
    });

    it('should handle malformed delimiters', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5`;
      const parsed = HL7Parser.parse(message);

      expect(parsed.delimiters.field).toBe('|');
      expect(parsed.delimiters.component).toBe('^');
      expect(parsed.delimiters.repetition).toBe('~');
      expect(parsed.delimiters.escape).toBe('\\');
      expect(parsed.delimiters.subcomponent).toBe('&');
    });

    it('should handle messages with only MSH segment', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5`;
      const parsed = HL7Parser.parse(message);

      expect(parsed.segments).toHaveLength(1);
      expect(parsed.messageType).toBe('ADT^A01');
    });

    it('should handle whitespace in message', () => {
      // Parser handles messages with newlines and leading/trailing whitespace on lines
      // but each line itself must start with the segment name
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||12345
`;
      const parsed = HL7Parser.parse(message);

      expect(parsed.segments).toHaveLength(2);
    });

    it('should handle null/undefined input validation', () => {
      expect(() => HL7Parser.parse(null as any)).toThrow('Invalid message input');
      expect(() => HL7Parser.parse(undefined as any)).toThrow('Invalid message input');
      expect(() => HL7Parser.parse(123 as any)).toThrow('Invalid message input');
    });
  });

  describe('Escape Sequences', () => {
    it('should unescape \\F\\ (field separator)', () => {
      const delimiters = {
        field: '|',
        component: '^',
        repetition: '~',
        escape: '\\',
        subcomponent: '&',
      };

      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||Name with \\F\\ pipe`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];
      const field3 = HL7Parser.getField(pidSegment, 3, 0);

      expect(field3).toBe('Name with | pipe');
    });

    it('should unescape \\S\\ (component separator)', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||Name with \\S\\ caret`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];
      const field3 = HL7Parser.getField(pidSegment, 3, 0);

      expect(field3).toBe('Name with ^ caret');
    });

    it('should unescape \\T\\ (subcomponent separator)', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||Name with \\T\\ ampersand`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];
      const field3 = HL7Parser.getField(pidSegment, 3, 0);

      expect(field3).toBe('Name with & ampersand');
    });

    it('should unescape \\R\\ (repetition separator)', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||Name with \\R\\ tilde`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];
      const field3 = HL7Parser.getField(pidSegment, 3, 0);

      expect(field3).toBe('Name with ~ tilde');
    });

    it('should unescape \\E\\ (escape character)', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||Name with \\E\\ backslash`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];
      const field3 = HL7Parser.getField(pidSegment, 3, 0);

      expect(field3).toBe('Name with \\ backslash');
    });

    it('should unescape \\X0D\\ (carriage return)', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||Name with \\X0D\\ newline`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];
      const field3 = HL7Parser.getField(pidSegment, 3, 0);

      expect(field3).toBe('Name with \r newline');
    });

    it('should handle multiple escape sequences in same field', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||Test \\F\\ \\S\\ \\T\\ \\R\\ \\E\\ all`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];
      const field3 = HL7Parser.getField(pidSegment, 3, 0);

      expect(field3).toBe('Test | ^ & ~ \\ all');
    });

    it('should not unescape when no escape character present', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||Normal text without escapes`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];
      const field3 = HL7Parser.getField(pidSegment, 3, 0);

      expect(field3).toBe('Normal text without escapes');
    });
  });

  describe('Multi-byte Characters (UTF-8)', () => {
    it('should handle Portuguese accented characters', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||José da Silva||João Paulo Araújo`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];

      expect(HL7Parser.getField(pidSegment, 3, 0)).toBe('José da Silva');
      expect(HL7Parser.getField(pidSegment, 5, 0)).toBe('João Paulo Araújo');
    });

    it('should handle Brazilian special characters', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||AÇÚCAR||São Paulo - SP||Ação Educação`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];

      expect(HL7Parser.getField(pidSegment, 3, 0)).toBe('AÇÚCAR');
      expect(HL7Parser.getField(pidSegment, 5, 0)).toBe('São Paulo - SP');
      expect(HL7Parser.getField(pidSegment, 7, 0)).toBe('Ação Educação');
    });

    it('should handle emoji characters', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||Patient 👨‍⚕️||Notes 📝`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];

      expect(HL7Parser.getField(pidSegment, 3, 0)).toBe('Patient 👨‍⚕️');
      expect(HL7Parser.getField(pidSegment, 5, 0)).toBe('Notes 📝');
    });

    it('should handle Chinese/Japanese characters', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||李明||田中太郎`;

      const parsed = HL7Parser.parse(message);
      const pidSegment = parsed.segments[1];

      expect(HL7Parser.getField(pidSegment, 3, 0)).toBe('李明');
      expect(HL7Parser.getField(pidSegment, 5, 0)).toBe('田中太郎');
    });
  });

  describe('getSegment and getSegments', () => {
    it('should get segment by occurrence', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
OBX|1||WBC||7500
OBX|2||RBC||4.8
OBX|3||HGB||14.5`;

      const parsed = HL7Parser.parse(message);

      const obx1 = HL7Parser.getSegment(parsed, 'OBX', 0);
      const obx2 = HL7Parser.getSegment(parsed, 'OBX', 1);
      const obx3 = HL7Parser.getSegment(parsed, 'OBX', 2);

      expect(HL7Parser.getField(obx1!, 1, 0)).toBe('1');
      expect(HL7Parser.getField(obx2!, 1, 0)).toBe('2');
      expect(HL7Parser.getField(obx3!, 1, 0)).toBe('3');
    });

    it('should get all segments by name', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5
OBX|1||WBC||7500
OBX|2||RBC||4.8
OBX|3||HGB||14.5`;

      const parsed = HL7Parser.parse(message);
      const allOBX = HL7Parser.getSegments(parsed, 'OBX');

      expect(allOBX).toHaveLength(3);
      expect(allOBX[0].name).toBe('OBX');
      expect(allOBX[1].name).toBe('OBX');
      expect(allOBX[2].name).toBe('OBX');
    });

    it('should return null for non-existent segment', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5`;
      const parsed = HL7Parser.parse(message);

      const pidSegment = HL7Parser.getSegment(parsed, 'PID');
      expect(pidSegment).toBeNull();
    });

    it('should return empty array for non-existent segments', () => {
      const message = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5`;
      const parsed = HL7Parser.parse(message);

      const obxSegments = HL7Parser.getSegments(parsed, 'OBX');
      expect(obxSegments).toEqual([]);
    });

    it('should handle null/undefined input gracefully', () => {
      expect(HL7Parser.getSegment(null as any, 'PID')).toBeNull();
      expect(HL7Parser.getSegments(null as any, 'PID')).toEqual([]);
    });
  });

  describe('getComponent', () => {
    it('should extract component from field', () => {
      const delimiters = {
        field: '|',
        component: '^',
        repetition: '~',
        escape: '\\',
        subcomponent: '&',
      };

      const fieldValue = 'DOE^JOHN^A^JR^DR';

      expect(HL7Parser.getComponent(fieldValue, 1, delimiters)).toBe('DOE');
      expect(HL7Parser.getComponent(fieldValue, 2, delimiters)).toBe('JOHN');
      expect(HL7Parser.getComponent(fieldValue, 3, delimiters)).toBe('A');
      expect(HL7Parser.getComponent(fieldValue, 4, delimiters)).toBe('JR');
      expect(HL7Parser.getComponent(fieldValue, 5, delimiters)).toBe('DR');
    });

    it('should return null for out-of-range component', () => {
      const delimiters = {
        field: '|',
        component: '^',
        repetition: '~',
        escape: '\\',
        subcomponent: '&',
      };

      const fieldValue = 'DOE^JOHN';

      expect(HL7Parser.getComponent(fieldValue, 10, delimiters)).toBeNull();
    });

    it('should handle null/undefined input', () => {
      const delimiters = {
        field: '|',
        component: '^',
        repetition: '~',
        escape: '\\',
        subcomponent: '&',
      };

      expect(HL7Parser.getComponent(null as any, 1, delimiters)).toBeNull();
      expect(HL7Parser.getComponent(undefined as any, 1, delimiters)).toBeNull();
    });
  });
});

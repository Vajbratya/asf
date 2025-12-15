/**
 * Unit tests for ORU Parser (S11)
 */

import { HL7Parser } from '../parser';
import { ORUParser } from '../messages/oru';

describe('ORUParser', () => {
  const sampleORU = `MSH|^~\\&|LAB|HOSPITAL|INTEGRA|BRASIL|20231215120000||ORU^R01|MSG001|P|2.5
PID|1||123456^^^HOSPITAL^MR||DOE^JOHN||19800101|M
OBR|1|ORD123||CBC^Complete Blood Count^LN|||20231215100000||||||||DR^SMITH^JOHN||||||||F
OBX|1|NM|WBC^White Blood Cells^LN||12.5|10^9/L|4.0-11.0|H|||F|||20231215100000
OBX|2|NM|RBC^Red Blood Cells^LN||4.8|10^12/L|4.5-6.0|N|||F|||20231215100000
OBX|3|NM|HGB^Hemoglobin^LN||14.2|g/dL|13.5-17.5|N|||F|||20231215100000`;

  const sampleORUWithPDF = `MSH|^~\\&|LAB|HOSPITAL|INTEGRA|BRASIL|20231215120000||ORU^R01|MSG002|P|2.5
PID|1||123456^^^HOSPITAL^MR||DOE^JOHN||19800101|M
OBR|1|ORD124||RAD^Radiology Report^LN|||20231215110000||||||||DR^JONES^MARY||||||||F
OBX|1|ED|PDF^PDF Report^LN||PDF^application/pdf^Base64^JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBl||||||F`;

  describe('parse', () => {
    it('should parse ORU message', () => {
      const message = HL7Parser.parse(sampleORU);
      const oru = ORUParser.parse(message);

      expect(oru.report).toBeDefined();
      expect(oru.patient).toBeDefined();
    });

    it('should extract patient information', () => {
      const message = HL7Parser.parse(sampleORU);
      const oru = ORUParser.parse(message);

      expect(oru.patient).toBeDefined();
      expect(oru.patient!.id).toBe('123456');
      expect(oru.patient!.name).toBe('JOHN DOE');
    });

    it('should extract report metadata', () => {
      const message = HL7Parser.parse(sampleORU);
      const oru = ORUParser.parse(message);

      expect(oru.report.id).toBeDefined();
      expect(oru.report.universalServiceId).toBe('CBC');
      expect(oru.report.resultStatus).toBe('F');
    });

    it('should parse multiple observations', () => {
      const message = HL7Parser.parse(sampleORU);
      const oru = ORUParser.parse(message);

      expect(oru.report.observations).toHaveLength(3);

      const wbcObs = oru.report.observations[0];
      expect(wbcObs.type).toBe('NM');
      expect(wbcObs.identifier).toBe('WBC - White Blood Cells');
      expect(wbcObs.value).toBe(12.5);
      expect(wbcObs.units).toBe('10^9/L');
      expect(wbcObs.referenceRange).toBe('4.0-11.0');
      expect(wbcObs.abnormalFlags).toContain('H');
    });

    it('should parse PDF observation', () => {
      const message = HL7Parser.parse(sampleORUWithPDF);
      const oru = ORUParser.parse(message);

      expect(oru.report.observations).toHaveLength(1);

      const pdfObs = oru.report.observations[0];
      expect(pdfObs.type).toBe('ED');
      expect(typeof pdfObs.value).toBe('object');

      const pdfValue = pdfObs.value as any;
      expect(pdfValue.isPDF).toBe(true);
      expect(pdfValue.isBase64).toBe(true);
      expect(pdfValue.type).toBe('PDF');
      expect(pdfValue.encoding).toBe('Base64');
      expect(pdfValue.data).toBe('JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBl');
    });

    it('should extract PDF from report', () => {
      const message = HL7Parser.parse(sampleORUWithPDF);
      const oru = ORUParser.parse(message);

      const pdf = ORUParser.extractPDF(oru.report);
      expect(pdf).toBe('JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBl');
    });

    it('should return null when no PDF found', () => {
      const message = HL7Parser.parse(sampleORU);
      const oru = ORUParser.parse(message);

      const pdf = ORUParser.extractPDF(oru.report);
      expect(pdf).toBeNull();
    });

    it('should throw error for non-ORU message', () => {
      const adtMessage = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5`;
      const message = HL7Parser.parse(adtMessage);

      expect(() => ORUParser.parse(message)).toThrow('Not an ORU message');
    });

    it('should throw error for missing OBR', () => {
      const invalidORU = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ORU^R01|MSG001|P|2.5
PID|1||123456^^^HOSPITAL^MR||DOE^JOHN||19800101|M`;
      const message = HL7Parser.parse(invalidORU);

      expect(() => ORUParser.parse(message)).toThrow('ORU message missing OBR segment');
    });
  });

  describe('isAbnormal', () => {
    it('should identify abnormal observations', () => {
      const message = HL7Parser.parse(sampleORU);
      const oru = ORUParser.parse(message);

      const wbcObs = oru.report.observations[0];
      expect(ORUParser.isAbnormal(wbcObs)).toBe(true);

      const rbcObs = oru.report.observations[1];
      expect(ORUParser.isAbnormal(rbcObs)).toBe(false);
    });
  });

  describe('isCritical', () => {
    it('should identify critical values', () => {
      const criticalORU = `MSH|^~\\&|LAB|HOSPITAL|INTEGRA|BRASIL|20231215120000||ORU^R01|MSG003|P|2.5
OBR|1|ORD125||CBC^Complete Blood Count^LN|||20231215100000||||||||DR^SMITH^JOHN||||||||F
OBX|1|NM|WBC^White Blood Cells^LN||2.0|10^9/L|4.0-11.0|LL|||F|||20231215100000`;

      const message = HL7Parser.parse(criticalORU);
      const oru = ORUParser.parse(message);

      const wbcObs = oru.report.observations[0];
      expect(ORUParser.isCritical(wbcObs)).toBe(true);
    });
  });

  describe('getResultStatusDescription', () => {
    it('should return description for status codes', () => {
      expect(ORUParser.getResultStatusDescription('F')).toBe('Final');
      expect(ORUParser.getResultStatusDescription('P')).toBe('Preliminary');
      expect(ORUParser.getResultStatusDescription('C')).toBe('Corrected');
      expect(ORUParser.getResultStatusDescription('X')).toBe('Cannot obtain results');
    });

    it('should return unknown for unknown codes', () => {
      expect(ORUParser.getResultStatusDescription('ZZ')).toBe('Unknown Status');
    });
  });

  describe('getAbnormalFlagDescription', () => {
    it('should return description for abnormal flags', () => {
      expect(ORUParser.getAbnormalFlagDescription('H')).toBe('Above high normal');
      expect(ORUParser.getAbnormalFlagDescription('L')).toBe('Below low normal');
      expect(ORUParser.getAbnormalFlagDescription('HH')).toBe('Above upper panic limits');
      expect(ORUParser.getAbnormalFlagDescription('LL')).toBe('Below lower panic limits');
    });
  });
});

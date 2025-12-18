/**
 * Unit tests for Tasy Z-Segments (Custom Brazilian Healthcare Extensions)
 */

import { HL7Parser } from '../parser';
import { ZSegmentParser } from '../segments/z-segments';

describe('ZSegmentParser', () => {
  describe('parseZPD - Extended Patient Demographics', () => {
    it('should parse complete ZPD segment', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||123456
ZPD|Maria Silva|Brasileira|3|Católica|Superior Completo|Engenheiro|C|123.456.789-01|12.345.678-9|123456789012345|São Paulo - SP`;

      const parsed = HL7Parser.parse(message);
      const zpd = ZSegmentParser.parseZPD(parsed);

      expect(zpd).not.toBeNull();
      expect(zpd?.motherName).toBe('Maria Silva');
      expect(zpd?.nationality).toBe('Brasileira');
      expect(zpd?.ethnicity).toBe('3'); // Parda (IBGE code)
      expect(zpd?.religion).toBe('Católica');
      expect(zpd?.education).toBe('Superior Completo');
      expect(zpd?.occupation).toBe('Engenheiro');
      expect(zpd?.maritalStatus).toBe('C'); // Casado
      expect(zpd?.cpf).toBe('123.456.789-01');
      expect(zpd?.rg).toBe('12.345.678-9');
      expect(zpd?.cns).toBe('123456789012345');
      expect(zpd?.birthPlace).toBe('São Paulo - SP');
    });

    it('should parse partial ZPD segment', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||123456
ZPD|Maria Silva|||||||123.456.789-01`;

      const parsed = HL7Parser.parse(message);
      const zpd = ZSegmentParser.parseZPD(parsed);

      expect(zpd).not.toBeNull();
      expect(zpd?.motherName).toBe('Maria Silva');
      expect(zpd?.nationality).toBeUndefined();
      expect(zpd?.cpf).toBe('123.456.789-01');
    });

    it('should return null when ZPD segment is missing', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||123456`;

      const parsed = HL7Parser.parse(message);
      const zpd = ZSegmentParser.parseZPD(parsed);

      expect(zpd).toBeNull();
    });

    it('should validate CPF correctly', () => {
      // Valid CPF: 529.982.247-25 (passes checksum)
      expect(ZSegmentParser.validateCPF('52998224725')).toBe(true);
      expect(ZSegmentParser.validateCPF('529.982.247-25')).toBe(true);
      expect(ZSegmentParser.validateCPF('11111111111')).toBe(false); // All same digits
      expect(ZSegmentParser.validateCPF('12345678900')).toBe(false); // Invalid check digit
    });

    it('should validate CNS correctly', () => {
      // Valid CNS: 198765432101234 (starts with valid digit and passes checksum)
      // Using a CNS that starts with 1, 2, 7, 8, or 9 and has 15 digits
      // Note: The CNS validation checks sum % 11 === 0
      expect(ZSegmentParser.validateCNS('898765432101234')).toBe(false); // Wrong checksum
      expect(ZSegmentParser.validateCNS('012345678901234')).toBe(false); // Invalid start digit (0)
      expect(ZSegmentParser.validateCNS('12345678901234')).toBe(false); // Wrong length (14 digits)
      // Test length validation
      expect(ZSegmentParser.validateCNS('1234567890123456')).toBe(false); // Too long (16 digits)
    });

    it('should format CPF correctly', () => {
      expect(ZSegmentParser.formatCPF('12345678901')).toBe('123.456.789-01');
      expect(ZSegmentParser.formatCPF('123.456.789-01')).toBe('123.456.789-01');
    });

    it('should format CNS correctly', () => {
      expect(ZSegmentParser.formatCNS('123456789012345')).toBe('123 4567 8901 2345');
      expect(ZSegmentParser.formatCNS('123 4567 8901 2345')).toBe('123 4567 8901 2345');
    });
  });

  describe('parseZPV - Extended Visit Information', () => {
    it('should parse complete ZPV segment', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||123456
ZPV|Cardiologia|CTI|Cardiologia Clínica|Urgente|Eletiva|Alta Melhorada|Dor Torácica|I21.0|I25.1~I48.0`;

      const parsed = HL7Parser.parse(message);
      const zpv = ZSegmentParser.parseZPV(parsed);

      expect(zpv).not.toBeNull();
      expect(zpv?.clinicName).toBe('Cardiologia');
      expect(zpv?.sectorName).toBe('CTI');
      expect(zpv?.specialty).toBe('Cardiologia Clínica');
      expect(zpv?.urgencyLevel).toBe('Urgente');
      expect(zpv?.admissionType).toBe('Eletiva');
      expect(zpv?.dischargeType).toBe('Alta Melhorada');
      expect(zpv?.hospitalizationReason).toBe('Dor Torácica');
      expect(zpv?.principalDiagnosis).toBe('I21.0'); // Infarto agudo do miocárdio
      expect(zpv?.secondaryDiagnoses).toEqual(['I25.1', 'I48.0']);
    });

    it('should parse ZPV with single secondary diagnosis', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||123456
ZPV|Cardiologia|CTI|Cardiologia Clínica|Urgente|Eletiva|Alta Melhorada|Dor Torácica|I21.0|I25.1`;

      const parsed = HL7Parser.parse(message);
      const zpv = ZSegmentParser.parseZPV(parsed);

      expect(zpv?.secondaryDiagnoses).toEqual(['I25.1']);
    });

    it('should return null when ZPV segment is missing', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||123456`;

      const parsed = HL7Parser.parse(message);
      const zpv = ZSegmentParser.parseZPV(parsed);

      expect(zpv).toBeNull();
    });
  });

  describe('parseZIN - Extended Insurance Information', () => {
    it('should parse complete ZIN segment', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||123456
ZIN|Particular|Individual|20251231|1234567890|123456|UNIMED|C123456|João Silva|987.654.321-00`;

      const parsed = HL7Parser.parse(message);
      const zin = ZSegmentParser.parseZIN(parsed);

      expect(zin).not.toBeNull();
      expect(zin?.planType).toBe('Particular');
      expect(zin?.planModality).toBe('Individual');
      expect(zin?.validityDate).toBe('20251231');
      expect(zin?.cardNumber).toBe('1234567890');
      expect(zin?.ansCode).toBe('123456'); // ANS registration number
      expect(zin?.companyCode).toBe('UNIMED');
      expect(zin?.contractNumber).toBe('C123456');
      expect(zin?.holderName).toBe('João Silva');
      expect(zin?.holderCPF).toBe('987.654.321-00');
    });

    it('should parse partial ZIN segment', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||123456
ZIN|SUS||||||||||`;

      const parsed = HL7Parser.parse(message);
      const zin = ZSegmentParser.parseZIN(parsed);

      expect(zin).not.toBeNull();
      expect(zin?.planType).toBe('SUS');
      expect(zin?.planModality).toBeUndefined();
    });

    it('should return null when ZIN segment is missing', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||123456`;

      const parsed = HL7Parser.parse(message);
      const zin = ZSegmentParser.parseZIN(parsed);

      expect(zin).toBeNull();
    });
  });

  describe('parseZOR - Extended Order Information', () => {
    it('should parse complete ZOR segment', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ORM^O01|MSG001|P|2.5
PID|1||123456
ZOR|Cardiologia|Laboratório|Urgente|Suspeita de IAM|Exame|AUTH123456|GUIDE789|2|250.50`;

      const parsed = HL7Parser.parse(message);
      const zor = ZSegmentParser.parseZOR(parsed);

      expect(zor).not.toBeNull();
      expect(zor?.requestingUnit).toBe('Cardiologia');
      expect(zor?.executingUnit).toBe('Laboratório');
      expect(zor?.priority).toBe('Urgente');
      expect(zor?.clinicalIndication).toBe('Suspeita de IAM');
      expect(zor?.requestType).toBe('Exame');
      expect(zor?.authorizationNumber).toBe('AUTH123456');
      expect(zor?.guideNumber).toBe('GUIDE789'); // TISS guide number
      expect(zor?.procedureQuantity).toBe(2);
      expect(zor?.procedureValue).toBe(250.5);
    });

    it('should handle invalid numeric values', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ORM^O01|MSG001|P|2.5
PID|1||123456
ZOR|Cardiologia|Laboratório|Urgente|Suspeita de IAM|Exame|AUTH123456|GUIDE789|INVALID|NOT_A_NUMBER`;

      const parsed = HL7Parser.parse(message);
      const zor = ZSegmentParser.parseZOR(parsed);

      expect(zor?.procedureQuantity).toBeUndefined();
      expect(zor?.procedureValue).toBeUndefined();
    });

    it('should return null when ZOR segment is missing', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ORM^O01|MSG001|P|2.5
PID|1||123456`;

      const parsed = HL7Parser.parse(message);
      const zor = ZSegmentParser.parseZOR(parsed);

      expect(zor).toBeNull();
    });
  });

  describe('parseAll - Parse all Z-segments', () => {
    it('should parse all Z-segments from a message', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||123456
ZPD|Maria Silva|Brasileira|3|Católica|Superior|Engenheiro|C|123.456.789-01|12.345.678-9|123456789012345|São Paulo
ZPV|Cardiologia|CTI|Cardiologia Clínica|Urgente|Eletiva|Alta|IAM|I21.0|I25.1
ZIN|Particular|Individual|20251231|1234567890|123456|UNIMED|C123456|João Silva|987.654.321-00
ZOR|Cardiologia|Lab|Urgente|IAM|Exame|AUTH123|GUIDE789|1|100.00`;

      const parsed = HL7Parser.parse(message);
      const allZ = ZSegmentParser.parseAll(parsed);

      expect(allZ.zpd).toBeDefined();
      expect(allZ.zpv).toBeDefined();
      expect(allZ.zin).toBeDefined();
      expect(allZ.zor).toBeDefined();

      expect(allZ.zpd?.motherName).toBe('Maria Silva');
      expect(allZ.zpv?.clinicName).toBe('Cardiologia');
      expect(allZ.zin?.planType).toBe('Particular');
      expect(allZ.zor?.requestingUnit).toBe('Cardiologia');
    });

    it('should return empty object when no Z-segments present', () => {
      const message = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||123456`;

      const parsed = HL7Parser.parse(message);
      const allZ = ZSegmentParser.parseAll(parsed);

      expect(allZ.zpd).toBeUndefined();
      expect(allZ.zpv).toBeUndefined();
      expect(allZ.zin).toBeUndefined();
      expect(allZ.zor).toBeUndefined();
    });
  });

  describe('Helper Methods', () => {
    it('should get marital status description', () => {
      expect(ZSegmentParser.getMaritalStatusDescription('S')).toBe('Solteiro(a)');
      expect(ZSegmentParser.getMaritalStatusDescription('C')).toBe('Casado(a)');
      expect(ZSegmentParser.getMaritalStatusDescription('V')).toBe('Viúvo(a)');
      expect(ZSegmentParser.getMaritalStatusDescription('D')).toBe('Divorciado(a)');
      expect(ZSegmentParser.getMaritalStatusDescription('U')).toBe('União Estável');
      expect(ZSegmentParser.getMaritalStatusDescription('X')).toBe('X'); // Unknown code
    });

    it('should get ethnicity description (IBGE codes)', () => {
      expect(ZSegmentParser.getEthnicityDescription('1')).toBe('Branca');
      expect(ZSegmentParser.getEthnicityDescription('2')).toBe('Preta');
      expect(ZSegmentParser.getEthnicityDescription('3')).toBe('Parda');
      expect(ZSegmentParser.getEthnicityDescription('4')).toBe('Amarela');
      expect(ZSegmentParser.getEthnicityDescription('5')).toBe('Indígena');
      expect(ZSegmentParser.getEthnicityDescription('9')).toBe('Sem informação');
      expect(ZSegmentParser.getEthnicityDescription('X')).toBe('X'); // Unknown code
    });
  });
});

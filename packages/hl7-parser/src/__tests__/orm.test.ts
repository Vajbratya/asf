/**
 * Unit tests for ORM Parser (S10)
 */

import { HL7Parser } from '../parser';
import { ORMParser } from '../messages/orm';

describe('ORMParser', () => {
  const sampleORM = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ORM^O01|MSG001|P|2.5
PID|1||123456^^^HOSPITAL^MR||DOE^JOHN
ORC|NW|ORD123|FILL456|||||||||SMITH^JOHN
OBR|1|ORD123|FILL456|40304485^HEMOGRAMA COMPLETO^TUSS|||20231215120000`;

  describe('parse', () => {
    it('should parse ORM message', () => {
      const message = HL7Parser.parse(sampleORM);
      const orm = ORMParser.parse(message);

      expect(orm.orders).toHaveLength(1);
      expect(orm.patient).toBeDefined();
    });

    it('should extract order details', () => {
      const message = HL7Parser.parse(sampleORM);
      const orm = ORMParser.parse(message);
      const order = orm.orders[0];

      expect(order.controlCode).toBe('NW');
      expect(order.placerOrderNumber).toBe('ORD123');
      expect(order.fillerOrderNumber).toBe('FILL456');
      expect(order.orderingProvider).toBe('SMITH');
      expect(order.procedureCode).toBe('40304485');
      expect(order.procedureText).toBe('HEMOGRAMA COMPLETO');
    });

    it('should extract patient info', () => {
      const message = HL7Parser.parse(sampleORM);
      const orm = ORMParser.parse(message);

      expect(orm.patient).toBeDefined();
      expect(orm.patient!.id).toBe('123456');
      expect(orm.patient!.name).toBe('JOHN DOE');
    });

    it('should handle multiple orders', () => {
      const multipleOrders = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ORM^O01|MSG001|P|2.5
PID|1||123456||DOE^JOHN
ORC|NW|ORD1|FILL1
OBR|1|ORD1|FILL1|12345678^TEST1^TUSS
ORC|NW|ORD2|FILL2
OBR|2|ORD2|FILL2|87654321^TEST2^TUSS`;

      const message = HL7Parser.parse(multipleOrders);
      const orm = ORMParser.parse(message);

      expect(orm.orders).toHaveLength(2);
      expect(orm.orders[0].procedureCode).toBe('12345678');
      expect(orm.orders[1].procedureCode).toBe('87654321');
    });

    it('should throw error for non-ORM message', () => {
      const adtMessage = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5`;
      const message = HL7Parser.parse(adtMessage);

      expect(() => ORMParser.parse(message)).toThrow('Not an ORM message');
    });
  });

  describe('getOrderControlDescription', () => {
    it('should return description for known codes', () => {
      expect(ORMParser.getOrderControlDescription('NW')).toBe('New Order');
      expect(ORMParser.getOrderControlDescription('CA')).toBe('Cancel Order Request');
      expect(ORMParser.getOrderControlDescription('DC')).toBe('Discontinue Order Request');
    });
  });

  describe('isTUSSCode', () => {
    it('should identify valid TUSS codes', () => {
      expect(ORMParser.isTUSSCode('40304485')).toBe(true);
      expect(ORMParser.isTUSSCode('12345678')).toBe(true);
    });

    it('should reject invalid TUSS codes', () => {
      expect(ORMParser.isTUSSCode('123')).toBe(false);
      expect(ORMParser.isTUSSCode('12345')).toBe(false);
      expect(ORMParser.isTUSSCode('123456789')).toBe(false);
    });
  });

  describe('formatProcedureCode', () => {
    it('should format TUSS codes', () => {
      expect(ORMParser.formatProcedureCode('40304485')).toBe('40.30.44.85');
    });

    it('should leave non-TUSS codes unchanged', () => {
      expect(ORMParser.formatProcedureCode('12345')).toBe('12345');
    });
  });
});

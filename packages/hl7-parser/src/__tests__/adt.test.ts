/**
 * Unit tests for ADT Parser (S09)
 */

import { HL7Parser } from "../parser";
import { ADTParser } from "../messages/adt";

describe("ADTParser", () => {
  const sampleADT = `MSH|^~\\&|TASY|HOSPITAL|INTEGRA|BRASIL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||123456^^^HOSPITAL^MR~12345678901^^^CPF~123456789012345^^^CNS||DOE^JOHN^ALEXANDER||19800101|M|||123 MAIN ST^^SAO PAULO^SP^01000^BR||(11)98765-4321||PT|S||12345678901
PV1|1|I|ICU^201^A|||||||SMITH^JOHN|||SUR||||||||V123456|||||||||||||||||||||||||||20231215100000
IN1|1|PLAN123|INS_CO|Insurance Company Name|||POLICY456|GROUP789`;

  describe("parse", () => {
    it("should parse ADT message", () => {
      const message = HL7Parser.parse(sampleADT);
      const adt = ADTParser.parse(message);

      expect(adt.eventType).toBe("A01");
      expect(adt.patient).toBeDefined();
      expect(adt.visit).toBeDefined();
      expect(adt.insurance).toBeDefined();
    });

    it("should extract patient demographics", () => {
      const message = HL7Parser.parse(sampleADT);
      const adt = ADTParser.parse(message);

      expect(adt.patient.id).toBe("123456");
      expect(adt.patient.name.family).toBe("DOE");
      expect(adt.patient.name.given).toEqual(["JOHN", "ALEXANDER"]);
      expect(adt.patient.birthDate).toBe("1980-01-01");
      expect(adt.patient.gender).toBe("M");
    });

    it("should extract Brazilian IDs (CPF and CNS)", () => {
      const message = HL7Parser.parse(sampleADT);
      const adt = ADTParser.parse(message);

      expect(adt.patient.cpf).toBe("12345678901");
      expect(adt.patient.cns).toBe("123456789012345");
    });

    it("should extract address", () => {
      const message = HL7Parser.parse(sampleADT);
      const adt = ADTParser.parse(message);

      expect(adt.patient.address).toBeDefined();
      expect(adt.patient.address!.street).toBe("123 MAIN ST");
      expect(adt.patient.address!.city).toBe("SAO PAULO");
      expect(adt.patient.address!.state).toBe("SP");
      expect(adt.patient.address!.postalCode).toBe("01000");
      expect(adt.patient.address!.country).toBe("BR");
    });

    it("should extract visit information", () => {
      const message = HL7Parser.parse(sampleADT);
      const adt = ADTParser.parse(message);

      expect(adt.visit).toBeDefined();
      expect(adt.visit!.id).toBe("V123456");
      expect(adt.visit!.patientClass).toBe("I");
      expect(adt.visit!.location).toBeDefined();
      expect(adt.visit!.location!.facility).toBe("ICU");
      expect(adt.visit!.location!.room).toBe("201");
      expect(adt.visit!.location!.bed).toBe("A");
      expect(adt.visit!.attendingDoctor).toBe("SMITH");
    });

    it("should extract insurance information", () => {
      const message = HL7Parser.parse(sampleADT);
      const adt = ADTParser.parse(message);

      expect(adt.insurance).toBeDefined();
      expect(adt.insurance!.plan).toBe("PLAN123");
      expect(adt.insurance!.company).toBe("Insurance Company Name");
    });

    it("should throw error for non-ADT message", () => {
      const ormMessage = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ORM^O01|MSG001|P|2.5`;
      const message = HL7Parser.parse(ormMessage);

      expect(() => ADTParser.parse(message)).toThrow("Not an ADT message");
    });

    it("should throw error for missing PID", () => {
      const invalidADT = `MSH|^~\\&|APP|FAC|APP2|FAC2|20231215120000||ADT^A01|MSG001|P|2.5`;
      const message = HL7Parser.parse(invalidADT);

      expect(() => ADTParser.parse(message)).toThrow(
        "ADT message missing PID segment",
      );
    });
  });

  describe("getEventDescription", () => {
    it("should return description for known events", () => {
      expect(ADTParser.getEventDescription("A01")).toBe(
        "Admit/Visit Notification",
      );
      expect(ADTParser.getEventDescription("A02")).toBe("Transfer a Patient");
      expect(ADTParser.getEventDescription("A03")).toBe("Discharge/End Visit");
      expect(ADTParser.getEventDescription("A08")).toBe(
        "Update Patient Information",
      );
    });

    it("should return unknown for unknown events", () => {
      expect(ADTParser.getEventDescription("A99")).toBe("Unknown ADT Event");
    });
  });
});

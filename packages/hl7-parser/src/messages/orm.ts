/**
 * S10 - ORM (Order Message) Parser
 *
 * Handles ORM^O01 order messages
 * Extracts order control (ORC) and observation request (OBR)
 * Includes Brazilian procedure codes (TUSS)
 */

import { HL7Message, Order } from "../types";
import { HL7Parser } from "../parser";

export interface ORMMessage {
  patient?: {
    id: string;
    name?: string;
  };
  orders: Order[];
}

export class ORMParser {
  /**
   * Parse an ORM message
   */
  static parse(message: HL7Message): ORMMessage {
    const messageType = message.messageType;

    // Validate message type
    if (!messageType.startsWith("ORM^O")) {
      throw new Error(`Not an ORM message: ${messageType}`);
    }

    // Extract patient info from PID if present
    const pidSegment = HL7Parser.getSegment(message, "PID");
    const patient = pidSegment
      ? this.parsePatientInfo(message, pidSegment)
      : undefined;

    // Parse all order groups (ORC + OBR pairs)
    const orders = this.parseOrders(message);

    return {
      patient,
      orders,
    };
  }

  /**
   * Parse patient info from PID segment
   */
  private static parsePatientInfo(message: HL7Message, pidSegment: any): any {
    const delimiters = message.delimiters;

    // PID-3: Patient ID
    const patientId = HL7Parser.getField(pidSegment, 3) || "";
    const idComponents = patientId.split(delimiters.component);
    const id = idComponents[0] || "";

    // PID-5: Patient Name
    const patientName = HL7Parser.getField(pidSegment, 5) || "";
    const nameComponents = patientName.split(delimiters.component);
    const family = nameComponents[0] || "";
    const given = nameComponents[1] || "";
    const name =
      given && family ? `${given} ${family}` : given || family || undefined;

    return {
      id,
      name,
    };
  }

  /**
   * Parse all orders from ORC/OBR segment pairs
   */
  private static parseOrders(message: HL7Message): Order[] {
    const orders: Order[] = [];
    const segments = message.segments;

    let currentORC: any = null;

    for (const segment of segments) {
      if (segment.name === "ORC") {
        currentORC = segment;
      } else if (segment.name === "OBR" && currentORC) {
        // Parse order from ORC + OBR pair
        const order = this.parseOrder(message, currentORC, segment);
        orders.push(order);
        currentORC = null; // Reset for next pair
      }
    }

    return orders;
  }

  /**
   * Parse a single order from ORC and OBR segments
   * ORC format: ORC|NW|PLACER123|FILLER456|...
   * OBR format: OBR|1|PLACER123|FILLER456|PROCEDURE_CODE^PROCEDURE_NAME^TUSS|||20231215120000
   */
  private static parseOrder(
    message: HL7Message,
    orcSegment: any,
    obrSegment: any,
  ): Order {
    const delimiters = message.delimiters;

    // ORC-1: Order Control Code (NW=New, CA=Cancel, DC=Discontinue, etc.)
    const controlCode = HL7Parser.getField(orcSegment, 1) || "";

    // ORC-2: Placer Order Number
    const placerOrderNumber = HL7Parser.getField(orcSegment, 2) || undefined;

    // ORC-3: Filler Order Number
    const fillerOrderNumber = HL7Parser.getField(orcSegment, 3) || undefined;

    // ORC-12: Ordering Provider
    const orderingProviderField = HL7Parser.getField(orcSegment, 12) || "";
    const orderingProvider =
      orderingProviderField.split(delimiters.component)[0] || undefined;

    // OBR-4: Universal Service Identifier (Procedure Code^Description^Coding System)
    const procedureField = HL7Parser.getField(obrSegment, 4) || "";
    const procedureComponents = procedureField.split(delimiters.component);
    const procedureCode = procedureComponents[0] || undefined;
    const procedureText = procedureComponents[1] || undefined;

    // OBR-7: Observation Date/Time
    const orderDateTimeHL7 = HL7Parser.getField(obrSegment, 7);
    const orderDateTime = orderDateTimeHL7
      ? this.formatDateTimeToISO(orderDateTimeHL7)
      : undefined;

    // Use filler order number as ID, fallback to placer
    const id = fillerOrderNumber || placerOrderNumber || this.generateOrderId();

    return {
      id,
      controlCode,
      placerOrderNumber,
      fillerOrderNumber,
      orderDateTime,
      orderingProvider,
      procedureCode,
      procedureText,
    };
  }

  /**
   * Format HL7 datetime to ISO format
   */
  private static formatDateTimeToISO(hl7DateTime: string): string {
    const date = HL7Parser.parseHL7DateTime(hl7DateTime);
    return date ? date.toISOString() : hl7DateTime;
  }

  /**
   * Generate a unique order ID
   */
  private static generateOrderId(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get order control code description
   */
  static getOrderControlDescription(controlCode: string): string {
    const descriptions: Record<string, string> = {
      NW: "New Order",
      OK: "Order Accepted & OK",
      UA: "Unable to Accept Order",
      CA: "Cancel Order Request",
      OC: "Order Canceled",
      CR: "Canceled as Requested",
      UC: "Unable to Cancel",
      DC: "Discontinue Order Request",
      OD: "Order Discontinued",
      DR: "Discontinued as Requested",
      UD: "Unable to Discontinue",
      HD: "Hold Order Request",
      OH: "Order Held",
      UH: "Unable to Put on Hold",
      RL: "Release Previous Hold",
      OE: "Order Released",
      OR: "Released as Requested",
      UR: "Unable to Release",
      RP: "Order Replace Request",
      RU: "Replaced Unsolicited",
      RO: "Replacement Order",
      RQ: "Replaced as Requested",
      UM: "Unable to Replace",
      PA: "Parent Order",
      CH: "Child Order",
      XO: "Change Order Request",
      XX: "Order Changed, Unsolicited",
      UX: "Unable to Change",
      XR: "Changed as Requested",
      DE: "Data Errors",
      RE: "Observations to Follow",
      RR: "Request Received",
      SR: "Response to Send Order Status Request",
      SS: "Send Order Status Request",
      SC: "Status Changed",
      SN: "Send Order Number",
      NA: "Number Assigned",
      CN: "Combined Result",
      RF: "Refill Order Request",
      AF: "Order Refill Request Approval",
      DF: "Order Refill Request Denied",
      FU: "Order Refilled, Unsolicited",
      OF: "Order Refilled as Requested",
      UF: "Unable to Refill",
      LI: "Link Order to Patient Care Problem or Goal",
      UN: "Unlink Order from Patient Care Problem or Goal",
    };

    return descriptions[controlCode] || "Unknown Order Control Code";
  }

  /**
   * Check if procedure code is TUSS (Brazilian procedure coding system)
   */
  static isTUSSCode(procedureCode: string): boolean {
    // TUSS codes are typically 8 digits: XXXXXXXX
    return /^\d{8}$/.test(procedureCode);
  }

  /**
   * Format procedure code for display
   */
  static formatProcedureCode(code: string): string {
    if (this.isTUSSCode(code)) {
      // Format TUSS code: XX.XX.XX.XX
      return code.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, "$1.$2.$3.$4");
    }
    return code;
  }
}

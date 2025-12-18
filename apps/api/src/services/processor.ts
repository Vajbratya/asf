/**
 * S26 - Message Processor
 * Parses messages by protocol, transforms to FHIR, stores FHIR resources, routes to destinations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProcessorService {
  /**
   * Process a message: parse, transform to FHIR, store
   */
  async processMessage(messageId: string) {
    const startTime = Date.now();

    try {
      // Get message from database
      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new Error(`Message ${messageId} not found`);
      }

      // Update status to processing
      await prisma.message.update({
        where: { id: messageId },
        data: { status: 'PROCESSING' },
      });

      // Parse and transform based on protocol
      let fhirResources: any;
      const rawMessage = message.rawMessage || '';
      switch (message.protocol) {
        case 'HL7V2':
          fhirResources = await this.transformHL7toFHIR(rawMessage);
          break;
        case 'XML':
          fhirResources = await this.transformXMLtoFHIR(rawMessage);
          break;
        case 'FHIR':
          // Safely parse JSON with error handling
          try {
            fhirResources = JSON.parse(rawMessage);
          } catch (parseError) {
            throw new Error(
              `Invalid JSON in FHIR message: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
            );
          }
          break;
        default:
          throw new Error(`Unsupported protocol: ${message.protocol}`);
      }

      // Store FHIR resources and update status
      const processingTime = Date.now() - startTime;
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'PROCESSED',
          fhirResources,
          processingTime,
          processedAt: new Date(),
        },
      });

      return { messageId, status: 'processed', fhirResources };
    } catch (error) {
      // Update status to failed
      const processingTime = Date.now() - startTime;
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          processingTime,
        },
      });

      throw error;
    }
  }

  /**
   * Transform HL7v2 message to FHIR
   */
  private async transformHL7toFHIR(rawMessage: string): Promise<any> {
    const segments = rawMessage
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const resources: any[] = [];

    // Parse MSH segment
    const msh = this.parseHL7Segment(segments[0]);
    const messageType = msh.fields[8]?.components[0]; // MSH-9.1

    if (messageType === 'ADT') {
      // ADT messages typically contain Patient demographic updates
      const pid = segments.find((s) => s.startsWith('PID'));
      if (pid) {
        const pidFields = this.parseHL7Segment(pid);
        resources.push({
          resourceType: 'Patient',
          id: pidFields.fields[3]?.value, // PID-3 Patient ID
          name: [
            {
              family: pidFields.fields[5]?.components[0], // PID-5.1 Family Name
              given: [pidFields.fields[5]?.components[1]], // PID-5.2 Given Name
            },
          ],
          birthDate: this.parseHL7Date(pidFields.fields[7]?.value), // PID-7 Date of Birth
          gender: this.mapHL7Gender(pidFields.fields[8]?.value), // PID-8 Sex
        });
      }
    }

    if (messageType === 'ORM') {
      // ORM messages are orders (ServiceRequest in FHIR)
      resources.push({
        resourceType: 'ServiceRequest',
        status: 'active',
        intent: 'order',
      });
    }

    return { resourceType: 'Bundle', type: 'transaction', entry: resources };
  }

  /**
   * Transform XML message to FHIR
   */
  private async transformXMLtoFHIR(rawMessage: string): Promise<any> {
    // This is a simplified transformation
    // In production, you'd use proper XML parsing and mapping
    return {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          resourceType: 'DocumentReference',
          status: 'current',
          content: [
            {
              attachment: {
                contentType: 'application/xml',
                data: Buffer.from(rawMessage).toString('base64'),
              },
            },
          ],
        },
      ],
    };
  }

  /**
   * Parse HL7 segment into fields
   */
  private parseHL7Segment(segment: string) {
    const parts = segment.split('|');
    const segmentType = parts[0];
    const fields = parts.slice(1).map((field, index) => ({
      index: index + 1,
      value: field,
      components: field.split('^'),
    }));

    return { segmentType, fields };
  }

  /**
   * Parse HL7 date (YYYYMMDD or YYYYMMDDHHMMSS)
   */
  private parseHL7Date(date?: string): string | undefined {
    if (!date || date.length < 8) return undefined;
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  /**
   * Map HL7 gender to FHIR
   */
  private mapHL7Gender(gender?: string): string {
    switch (gender?.toUpperCase()) {
      case 'M':
        return 'male';
      case 'F':
        return 'female';
      case 'O':
        return 'other';
      default:
        return 'unknown';
    }
  }
}

/**
 * S25 - Ingestion Service
 * Receives raw messages, stores in database, queues for processing via QStash
 */

import { PrismaClient } from '@prisma/client';
import { Client } from '@upstash/qstash';
import { z } from 'zod';

const prisma = new PrismaClient();
const qstash = new Client({
  token: process.env.QSTASH_TOKEN || '',
});

const IngestMessageSchema = z.object({
  rawMessage: z.string(),
  protocol: z.enum(['HL7V2', 'XML', 'FHIR', 'CUSTOM']),
  connectorId: z.string(),
  organizationId: z.string(),
});

export type IngestMessageInput = z.infer<typeof IngestMessageSchema>;

export class IngestionService {
  /**
   * Ingest a raw message from a connector
   */
  async ingestMessage(input: IngestMessageInput) {
    // Validate input
    const validated = IngestMessageSchema.parse(input);

    // Detect message type from content
    const messageType = this.detectMessageType(validated.rawMessage, validated.protocol);

    // Store message in database
    const message = await prisma.message.create({
      data: {
        rawMessage: validated.rawMessage,
        protocol: validated.protocol,
        messageType,
        status: 'RECEIVED',
        direction: 'INBOUND',
        connectorId: validated.connectorId,
        organizationId: validated.organizationId,
      },
    });

    // Queue for processing via QStash
    if (process.env.QSTASH_TOKEN) {
      await qstash.publishJSON({
        url: `${process.env.API_URL}/api/process-message`,
        body: {
          messageId: message.id,
        },
        retries: 3,
      });
    }

    return message;
  }

  /**
   * Detect message type from raw content
   */
  private detectMessageType(rawMessage: string, protocol: string): string {
    if (protocol === 'HL7V2') {
      // HL7v2 message type is in MSH segment
      const mshSegment = rawMessage.split('\n')[0];
      const fields = mshSegment.split('|');
      if (fields.length >= 9) {
        const messageType = fields[8].split('^')[0]; // MSH-9.1
        return messageType;
      }
      return 'UNKNOWN';
    }

    if (protocol === 'XML') {
      // Try to extract root element name
      const match = rawMessage.match(/<(\w+)/);
      return match ? match[1] : 'UNKNOWN';
    }

    if (protocol === 'FHIR') {
      try {
        const parsed = JSON.parse(rawMessage);
        return parsed.resourceType || 'UNKNOWN';
      } catch {
        return 'UNKNOWN';
      }
    }

    return 'UNKNOWN';
  }

  /**
   * Get ingestion statistics
   */
  async getStats(organizationId: string, since: Date) {
    const total = await prisma.message.count({
      where: {
        organizationId,
        createdAt: { gte: since },
      },
    });

    const byStatus = await prisma.message.groupBy({
      by: ['status'],
      where: {
        organizationId,
        createdAt: { gte: since },
      },
      _count: true,
    });

    const byProtocol = await prisma.message.groupBy({
      by: ['protocol'],
      where: {
        organizationId,
        createdAt: { gte: since },
      },
      _count: true,
    });

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byProtocol: Object.fromEntries(byProtocol.map((p) => [p.protocol, p._count])),
    };
  }
}

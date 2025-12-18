/**
 * S27 - Message Router
 * Matches webhooks by rules and routes messages to destinations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RouterService {
  /**
   * Route a processed message to matching webhooks
   */
  async routeMessage(messageId: string) {
    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Find matching webhooks
    const webhooks = await prisma.webhook.findMany({
      where: {
        organizationId: message.organizationId,
        active: true,
      },
    });

    // Filter webhooks by event and rules
    const matchingWebhooks = webhooks.filter((webhook) => {
      // Check if webhook listens to this event
      const event = `message.${message.status}`;
      const events = webhook.events as string[];
      if (!events || !events.includes(event)) {
        return false;
      }

      // Check filters
      if (webhook.filters) {
        const filters = webhook.filters as any;

        // Filter by message type
        if (filters.messageType && Array.isArray(filters.messageType)) {
          if (!filters.messageType.includes(message.messageType)) {
            return false;
          }
        }

        // Filter by status
        if (filters.status && Array.isArray(filters.status)) {
          if (!filters.status.includes(message.status)) {
            return false;
          }
        }

        // Filter by connector
        if (filters.connectorId && Array.isArray(filters.connectorId)) {
          if (!filters.connectorId.includes(message.connectorId)) {
            return false;
          }
        }
      }

      return true;
    });

    // Create delivery records for matching webhooks
    const deliveries = await Promise.all(
      matchingWebhooks.map((webhook) =>
        prisma.messageDelivery.create({
          data: {
            messageId: message.id,
            webhookId: webhook.id,
            status: 'PENDING',
            attempts: 0,
            maxAttempts: 3,
          },
        })
      )
    );

    return {
      messageId,
      matchedWebhooks: matchingWebhooks.length,
      deliveries: deliveries.map((d) => d.id),
    };
  }

  /**
   * Get routing statistics
   */
  async getRoutingStats(organizationId: string, since: Date) {
    const deliveries = await prisma.messageDelivery.findMany({
      where: {
        message: {
          organizationId,
          createdAt: { gte: since },
        },
      },
      include: {
        webhook: true,
      },
    });

    const byWebhook = deliveries.reduce(
      (acc, d) => {
        const webhookName = d.webhook.name;
        if (!acc[webhookName]) {
          acc[webhookName] = { total: 0, DELIVERED: 0, FAILED: 0, PENDING: 0 };
        }
        acc[webhookName].total++;
        acc[webhookName][d.status as 'DELIVERED' | 'FAILED' | 'PENDING']++;
        return acc;
      },
      {} as Record<string, { total: number; DELIVERED: number; FAILED: number; PENDING: number }>
    );

    return {
      totalDeliveries: deliveries.length,
      byWebhook,
    };
  }
}

/**
 * S28 - Webhook Delivery
 * Delivers messages to webhooks with HMAC signature, retry with exponential backoff, and delivery logging
 */

import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

export class WebhookService {
  /**
   * Deliver a message to a webhook
   */
  async deliverToWebhook(deliveryId: string) {
    // Get the delivery record
    const delivery = await prisma.messageDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        message: true,
        webhook: true,
      },
    });

    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    // Check if max attempts reached
    if (delivery.attempts >= delivery.maxAttempts) {
      await prisma.messageDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "failed",
          errorMessage: "Max retry attempts reached",
        },
      });
      return { success: false, reason: "max_attempts_reached" };
    }

    // Prepare payload
    const payload = {
      event: `message.${delivery.message.status}`,
      messageId: delivery.message.id,
      messageType: delivery.message.messageType,
      protocol: delivery.message.protocol,
      status: delivery.message.status,
      fhirResources: delivery.message.fhirResources,
      createdAt: delivery.message.createdAt,
    };

    // Generate HMAC signature
    const signature = this.generateHMAC(
      JSON.stringify(payload),
      delivery.webhook.secret,
    );

    try {
      // Send HTTP request
      const response = await fetch(delivery.webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
          "X-Message-ID": delivery.message.id,
          "X-Delivery-ID": delivery.id,
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.text();

      // Update delivery record
      if (response.ok) {
        await prisma.messageDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "delivered",
            attempts: delivery.attempts + 1,
            lastAttemptAt: new Date(),
            responseStatus: response.status,
            responseBody: responseBody.substring(0, 1000), // Limit to 1000 chars
          },
        });
        return { success: true, status: response.status };
      } else {
        // Failed, schedule retry
        const nextRetryAt = this.calculateNextRetry(delivery.attempts + 1);
        await prisma.messageDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "pending",
            attempts: delivery.attempts + 1,
            lastAttemptAt: new Date(),
            nextRetryAt,
            responseStatus: response.status,
            responseBody: responseBody.substring(0, 1000),
            errorMessage: `HTTP ${response.status}`,
          },
        });
        return {
          success: false,
          reason: "http_error",
          status: response.status,
          nextRetryAt,
        };
      }
    } catch (error) {
      // Network error, schedule retry
      const nextRetryAt = this.calculateNextRetry(delivery.attempts + 1);
      await prisma.messageDelivery.update({
        where: { id: deliveryId },
        data: {
          status:
            delivery.attempts + 1 >= delivery.maxAttempts
              ? "failed"
              : "pending",
          attempts: delivery.attempts + 1,
          lastAttemptAt: new Date(),
          nextRetryAt:
            delivery.attempts + 1 < delivery.maxAttempts ? nextRetryAt : null,
          errorMessage:
            error instanceof Error ? error.message : "Network error",
        },
      });
      return { success: false, reason: "network_error", nextRetryAt };
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateHMAC(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }

  /**
   * Calculate next retry time with exponential backoff
   */
  private calculateNextRetry(attemptNumber: number): Date {
    // Exponential backoff: 2^attempt minutes
    const delayMinutes = Math.pow(2, attemptNumber);
    const nextRetry = new Date();
    nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);
    return nextRetry;
  }

  /**
   * Verify HMAC signature from incoming webhook
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateHMAC(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Get pending deliveries that are ready for retry
   */
  async getPendingDeliveries(limit = 100) {
    const now = new Date();
    return prisma.messageDelivery.findMany({
      where: {
        status: "pending",
        attempts: {
          lt: prisma.messageDelivery.fields.maxAttempts,
        },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      include: {
        message: true,
        webhook: true,
      },
      take: limit,
      orderBy: {
        createdAt: "asc",
      },
    });
  }
}

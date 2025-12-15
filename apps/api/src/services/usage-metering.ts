import { Redis } from '@upstash/redis';
import { prisma } from '../lib/db';
import { billingService } from './billing';
import type { PlanType } from '@prisma/client';
import { PRICING_TIERS, calculateOverage, type PlanId } from '@integrasaude/shared';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export interface UsageData {
  messages: number;
  connectors: number;
  users: number;
  messagesByType: {
    ADT: number;
    ORM: number;
    ORU: number;
    OTHER: number;
  };
}

export class UsageMeteringService {
  /**
   * Get Redis key for usage tracking
   */
  private getUsageKey(orgId: string, period?: string): string {
    const periodKey = period || this.getCurrentPeriod();
    return `usage:${orgId}:${periodKey}`;
  }

  /**
   * Get current billing period (YYYY-MM)
   */
  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Track message processing
   */
  async trackMessage(
    orgId: string,
    messageType: 'ADT' | 'ORM' | 'ORU' | 'OTHER' = 'OTHER'
  ): Promise<void> {
    const key = this.getUsageKey(orgId);

    // Increment total messages
    await redis.hincrby(key, 'messages', 1);

    // Increment by message type
    await redis.hincrby(key, `type:${messageType}`, 1);

    // Set expiry for 90 days (to support max retention)
    await redis.expire(key, 90 * 24 * 60 * 60);
  }

  /**
   * Track connector creation/deletion
   */
  async updateConnectorCount(orgId: string): Promise<void> {
    const count = await prisma.connector.count({
      where: { organizationId: orgId, status: 'ACTIVE' },
    });

    const key = this.getUsageKey(orgId);
    await redis.hset(key, { connectors: count });
  }

  /**
   * Track user count
   */
  async updateUserCount(orgId: string): Promise<void> {
    const count = await prisma.user.count({
      where: { organizationId: orgId },
    });

    const key = this.getUsageKey(orgId);
    await redis.hset(key, { users: count });
  }

  /**
   * Get current usage for organization
   */
  async getUsage(orgId: string, period?: string): Promise<UsageData> {
    const key = this.getUsageKey(orgId, period);
    const data = await redis.hgetall(key);

    return {
      messages: parseInt((data?.messages as string) || '0'),
      connectors: parseInt((data?.connectors as string) || '0'),
      users: parseInt((data?.users as string) || '0'),
      messagesByType: {
        ADT: parseInt((data?.['type:ADT'] as string) || '0'),
        ORM: parseInt((data?.['type:ORM'] as string) || '0'),
        ORU: parseInt((data?.['type:ORU'] as string) || '0'),
        OTHER: parseInt((data?.['type:OTHER'] as string) || '0'),
      },
    };
  }

  /**
   * Check if organization is within plan limits
   */
  async checkLimits(orgId: string): Promise<{
    withinLimits: boolean;
    usage: UsageData;
    limits: {
      messages: number;
      connectors: number;
      users: number;
    };
    overages?: {
      messages: number;
      connectors: number;
      users: number;
    };
  }> {
    const [org, usage] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        include: { subscription: true },
      }),
      this.getUsage(orgId),
    ]);

    if (!org || !org.subscription) {
      throw new Error('Organization or subscription not found');
    }

    const limits = {
      messages: org.subscription.messageLimit,
      connectors: org.subscription.connectorLimit,
      users: org.subscription.userLimit,
    };

    const withinLimits =
      usage.messages <= limits.messages &&
      usage.connectors <= limits.connectors &&
      usage.users <= limits.users;

    const overages = withinLimits
      ? undefined
      : {
          messages: Math.max(0, usage.messages - limits.messages),
          connectors: Math.max(0, usage.connectors - limits.connectors),
          users: Math.max(0, usage.users - limits.users),
        };

    return {
      withinLimits,
      usage,
      limits,
      overages,
    };
  }

  /**
   * Save usage record to database (run at end of billing period)
   */
  async saveUsageRecord(orgId: string, period?: string): Promise<void> {
    const usage = await this.getUsage(orgId, period);

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const periodDate = period
      ? new Date(`${period}-01`)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const periodStart = periodDate;
    const periodEnd = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0);

    await prisma.usageRecord.upsert({
      where: {
        subscriptionId_periodStart: {
          subscriptionId: subscription.id,
          periodStart,
        },
      },
      create: {
        subscriptionId: subscription.id,
        messages: usage.messages,
        connectors: usage.connectors,
        users: usage.users,
        messageTypeADT: usage.messagesByType.ADT,
        messageTypeORM: usage.messagesByType.ORM,
        messageTypeORU: usage.messagesByType.ORU,
        messageTypeOther: usage.messagesByType.OTHER,
        periodStart,
        periodEnd,
      },
      update: {
        messages: usage.messages,
        connectors: usage.connectors,
        users: usage.users,
        messageTypeADT: usage.messagesByType.ADT,
        messageTypeORM: usage.messagesByType.ORM,
        messageTypeORU: usage.messagesByType.ORU,
        messageTypeOther: usage.messagesByType.OTHER,
      },
    });
  }

  /**
   * Sync overage usage to Stripe (run daily)
   */
  async syncOveragesToStripe(): Promise<void> {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { organization: true },
    });

    for (const subscription of activeSubscriptions) {
      const usage = await this.getUsage(subscription.organizationId);

      // Calculate overages
      if (usage.messages > subscription.messageLimit) {
        const overage = usage.messages - subscription.messageLimit;

        if (subscription.stripeSubscriptionItemId) {
          await billingService.reportUsage(subscription.stripeSubscriptionItemId, overage);

          // Mark as synced in usage record
          await prisma.usageRecord.updateMany({
            where: {
              subscriptionId: subscription.id,
              periodStart: {
                gte: subscription.currentPeriodStart,
              },
              syncedToStripe: false,
            },
            data: {
              syncedToStripe: true,
              syncedAt: new Date(),
            },
          });
        }
      }
    }
  }

  /**
   * Get usage history for organization
   */
  async getUsageHistory(orgId: string, limit: number = 12): Promise<any[]> {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });

    if (!subscription) {
      return [];
    }

    return prisma.usageRecord.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { periodStart: 'desc' },
      take: limit,
    });
  }

  /**
   * Reset usage for new billing period
   */
  async resetUsage(orgId: string): Promise<void> {
    // Save current usage to database first
    await this.saveUsageRecord(orgId);

    // Delete Redis key for current period
    const key = this.getUsageKey(orgId);
    await redis.del(key);

    // Initialize new period with current counts
    await this.updateConnectorCount(orgId);
    await this.updateUserCount(orgId);
  }

  /**
   * Get overage costs for current period
   */
  async getOverageCosts(orgId: string): Promise<{
    messages: number;
    connectors: number;
    users: number;
    total: number;
  }> {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { subscription: true },
    });

    if (!org || !org.subscription) {
      throw new Error('Organization or subscription not found');
    }

    const usage = await this.getUsage(orgId);

    const planId = org.subscription.planType.toLowerCase() as PlanId;

    return calculateOverage(
      {
        messages: usage.messages,
        connectors: usage.connectors,
        users: usage.users,
      },
      planId
    );
  }

  /**
   * Get usage percentage for limits
   */
  async getUsagePercentages(orgId: string): Promise<{
    messages: number;
    connectors: number;
    users: number;
  }> {
    const { usage, limits } = await this.checkLimits(orgId);

    return {
      messages: Math.min(100, (usage.messages / limits.messages) * 100),
      connectors: Math.min(100, (usage.connectors / limits.connectors) * 100),
      users: Math.min(100, (usage.users / limits.users) * 100),
    };
  }
}

export const usageMeteringService = new UsageMeteringService();

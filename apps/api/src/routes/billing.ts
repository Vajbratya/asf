import { Hono } from 'hono';
import { billingService } from '../services/billing';
import { usageMeteringService } from '../services/usage-metering';
import { prisma } from '../lib/db';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';
import type { PlanId } from '@integrasaude/shared';

export const billing = new Hono();

// Apply auth middleware to all billing routes
billing.use('*', authMiddleware);

/**
 * Get current subscription details
 */
billing.get('/subscription', async (c) => {
  const orgId = c.get('orgId');

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: orgId },
    include: {
      organization: {
        select: {
          name: true,
          billingEmail: true,
          stripeCustomerId: true,
        },
      },
    },
  });

  if (!subscription) {
    return c.json({ error: 'No subscription found' }, 404);
  }

  return c.json(subscription);
});

/**
 * Get current usage and limits
 */
billing.get('/usage', async (c) => {
  const orgId = c.get('orgId');

  const [usage, limits, percentages, overageCosts] = await Promise.all([
    usageMeteringService.getUsage(orgId),
    usageMeteringService.checkLimits(orgId),
    usageMeteringService.getUsagePercentages(orgId),
    usageMeteringService.getOverageCosts(orgId),
  ]);

  return c.json({
    usage,
    limits: limits.limits,
    percentages,
    withinLimits: limits.withinLimits,
    overages: limits.overages,
    overageCosts,
  });
});

/**
 * Get usage history
 */
billing.get('/usage/history', async (c) => {
  const orgId = c.get('orgId');
  const limit = parseInt(c.req.query('limit') || '12');

  const history = await usageMeteringService.getUsageHistory(orgId, limit);

  return c.json(history);
});

/**
 * Create checkout session for new subscription
 */
billing.post('/checkout', async (c) => {
  const orgId = c.get('orgId');

  const schema = z.object({
    planId: z.enum(['starter', 'professional', 'enterprise']),
    billingPeriod: z.enum(['MONTHLY', 'ANNUAL']),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
  });

  const body = await c.req.json();
  const data = schema.parse(body);

  const checkoutUrl = await billingService.createCheckoutSession(
    orgId,
    data.planId as PlanId,
    data.billingPeriod,
    data.successUrl,
    data.cancelUrl
  );

  return c.json({ url: checkoutUrl });
});

/**
 * Update subscription plan
 */
billing.post('/subscription/update', async (c) => {
  const orgId = c.get('orgId');

  const schema = z.object({
    planId: z.enum(['starter', 'professional', 'enterprise']),
    billingPeriod: z.enum(['MONTHLY', 'ANNUAL']),
  });

  const body = await c.req.json();
  const data = schema.parse(body);

  const subscription = await billingService.updateSubscription(
    orgId,
    data.planId as PlanId,
    data.billingPeriod
  );

  return c.json(subscription);
});

/**
 * Cancel subscription
 */
billing.post('/subscription/cancel', async (c) => {
  const orgId = c.get('orgId');

  const schema = z.object({
    immediately: z.boolean().optional().default(false),
  });

  const body = await c.req.json();
  const data = schema.parse(body);

  const subscription = await billingService.cancelSubscription(orgId, data.immediately);

  return c.json(subscription);
});

/**
 * Reactivate canceled subscription
 */
billing.post('/subscription/reactivate', async (c) => {
  const orgId = c.get('orgId');

  const subscription = await billingService.reactivateSubscription(orgId);

  return c.json(subscription);
});

/**
 * Create customer portal session
 */
billing.post('/portal', async (c) => {
  const orgId = c.get('orgId');

  const schema = z.object({
    returnUrl: z.string().url(),
  });

  const body = await c.req.json();
  const data = schema.parse(body);

  const portalUrl = await billingService.createPortalSession(orgId, data.returnUrl);

  return c.json({ url: portalUrl });
});

/**
 * Get upcoming invoice
 */
billing.get('/invoice/upcoming', async (c) => {
  const orgId = c.get('orgId');

  const invoice = await billingService.getUpcomingInvoice(orgId);

  return c.json({
    id: invoice.id,
    amount: invoice.total,
    currency: invoice.currency,
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    lines: invoice.lines.data.map((line) => ({
      description: line.description,
      amount: line.amount,
      quantity: line.quantity,
    })),
  });
});

/**
 * Get invoice history
 */
billing.get('/invoices', async (c) => {
  const orgId = c.get('orgId');
  const limit = parseInt(c.req.query('limit') || '10');

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: orgId },
  });

  if (!subscription) {
    return c.json({ error: 'No subscription found' }, 404);
  }

  const invoices = await prisma.invoice.findMany({
    where: { subscriptionId: subscription.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return c.json(invoices);
});

/**
 * Get specific invoice
 */
billing.get('/invoices/:id', async (c) => {
  const orgId = c.get('orgId');
  const invoiceId = c.req.param('id');

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      subscription: {
        organizationId: orgId,
      },
    },
  });

  if (!invoice) {
    return c.json({ error: 'Invoice not found' }, 404);
  }

  return c.json(invoice);
});

/**
 * Get billing analytics
 */
billing.get('/analytics', async (c) => {
  const orgId = c.get('orgId');

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: orgId },
  });

  if (!subscription) {
    return c.json({ error: 'No subscription found' }, 404);
  }

  // Get usage history for last 12 months
  const usageHistory = await prisma.usageRecord.findMany({
    where: { subscriptionId: subscription.id },
    orderBy: { periodStart: 'desc' },
    take: 12,
  });

  // Get invoice history
  const invoices = await prisma.invoice.findMany({
    where: { subscriptionId: subscription.id },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  // Calculate totals
  const totalSpent = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalMessages = usageHistory.reduce((sum, usage) => sum + usage.messages, 0);
  const avgMessagesPerMonth = totalMessages / Math.max(1, usageHistory.length);

  return c.json({
    subscription: {
      plan: subscription.planType,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
    },
    usage: {
      history: usageHistory,
      total: totalMessages,
      average: Math.round(avgMessagesPerMonth),
    },
    billing: {
      invoices,
      totalSpent,
      currency: 'BRL',
    },
  });
});

/**
 * Health check for billing routes
 */
billing.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'billing',
    timestamp: new Date().toISOString(),
  });
});

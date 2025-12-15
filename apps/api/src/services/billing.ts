import Stripe from 'stripe';
import { prisma } from '../lib/db';
import type { Organization, Subscription, PlanType, BillingPeriod } from '@prisma/client';
import { PRICING_TIERS, type PlanId } from '@integrasaude/shared';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export class BillingService {
  /**
   * Create Stripe customer on organization signup
   */
  async createCustomer(org: Organization): Promise<string> {
    const customer = await stripe.customers.create({
      email: org.billingEmail || undefined,
      name: org.name,
      metadata: {
        orgId: org.id,
        cnpj: org.cnpj || '',
      },
    });

    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Create subscription for organization
   */
  async createSubscription(
    orgId: string,
    planId: PlanId,
    billingPeriod: 'MONTHLY' | 'ANNUAL',
    trialDays?: number
  ): Promise<Subscription> {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // Ensure customer exists
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      customerId = await this.createCustomer(org);
    }

    const plan = PRICING_TIERS[planId];
    const priceId =
      billingPeriod === 'MONTHLY' ? plan.stripePriceIdMonthly : plan.stripePriceIdAnnual;

    if (!priceId) {
      throw new Error(`No Stripe price ID configured for ${planId} ${billingPeriod}`);
    }

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      trial_period_days: trialDays,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Create subscription in database
    const subscription = await prisma.subscription.create({
      data: {
        organizationId: orgId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeSubscriptionItemId: stripeSubscription.items.data[0].id,
        stripePriceId: priceId,
        status: this.mapStripeStatus(stripeSubscription.status),
        planType: planId.toUpperCase() as PlanType,
        billingPeriod: billingPeriod,
        messageLimit: plan.features.messages,
        connectorLimit: plan.features.connectors,
        userLimit: plan.features.users,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart: stripeSubscription.trial_start
          ? new Date(stripeSubscription.trial_start * 1000)
          : null,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
      },
    });

    // Update organization plan type
    await prisma.organization.update({
      where: { id: orgId },
      data: { planType: planId.toUpperCase() as PlanType },
    });

    return subscription;
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(
    orgId: string,
    newPlanId: PlanId,
    newBillingPeriod: 'MONTHLY' | 'ANNUAL'
  ): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    const newPlan = PRICING_TIERS[newPlanId];
    const newPriceId =
      newBillingPeriod === 'MONTHLY' ? newPlan.stripePriceIdMonthly : newPlan.stripePriceIdAnnual;

    if (!newPriceId) {
      throw new Error(`No Stripe price ID configured for ${newPlanId} ${newBillingPeriod}`);
    }

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: subscription.stripeSubscriptionItemId || undefined,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      }
    );

    // Update database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        stripePriceId: newPriceId,
        planType: newPlanId.toUpperCase() as PlanType,
        billingPeriod: newBillingPeriod,
        messageLimit: newPlan.features.messages,
        connectorLimit: newPlan.features.connectors,
        userLimit: newPlan.features.users,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    // Update organization plan type
    await prisma.organization.update({
      where: { id: orgId },
      data: { planType: newPlanId.toUpperCase() as PlanType },
    });

    return updatedSubscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(orgId: string, immediately: boolean = false): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (immediately) {
      // Cancel immediately
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

      return prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      return prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: true,
        },
      });
    }
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(orgId: string): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new Error('Subscription is not scheduled for cancellation');
    }

    // Reactivate in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    return prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
      },
    });
  }

  /**
   * Report usage to Stripe for metered billing
   */
  async reportUsage(subscriptionItemId: string, quantity: number): Promise<void> {
    await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment',
    });
  }

  /**
   * Create checkout session for new subscription
   */
  async createCheckoutSession(
    orgId: string,
    planId: PlanId,
    billingPeriod: 'MONTHLY' | 'ANNUAL',
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // Ensure customer exists
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      customerId = await this.createCustomer(org);
    }

    const plan = PRICING_TIERS[planId];
    const priceId =
      billingPeriod === 'MONTHLY' ? plan.stripePriceIdMonthly : plan.stripePriceIdAnnual;

    if (!priceId) {
      throw new Error(`No Stripe price ID configured for ${planId} ${billingPeriod}`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orgId,
        planId,
        billingPeriod,
      },
      subscription_data: {
        trial_period_days: 14, // 14-day trial
        metadata: {
          orgId,
        },
      },
    });

    return session.url!;
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(orgId: string, returnUrl: string): Promise<string> {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org || !org.stripeCustomerId) {
      throw new Error('Organization not found or no Stripe customer');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Get upcoming invoice
   */
  async getUpcomingInvoice(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { subscription: true },
    });

    if (!org || !org.stripeCustomerId) {
      throw new Error('Organization not found or no Stripe customer');
    }

    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: org.stripeCustomerId,
    });

    return invoice;
  }

  /**
   * Map Stripe subscription status to our enum
   */
  private mapStripeStatus(status: Stripe.Subscription.Status): any {
    const statusMap: Record<Stripe.Subscription.Status, string> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      incomplete: 'INCOMPLETE',
      incomplete_expired: 'INCOMPLETE_EXPIRED',
      trialing: 'TRIALING',
      unpaid: 'UNPAID',
      paused: 'CANCELED',
    };

    return statusMap[status] || 'INCOMPLETE';
  }

  /**
   * Sync subscription from Stripe
   */
  async syncSubscriptionFromStripe(stripeSubscriptionId: string): Promise<Subscription> {
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found in database');
    }

    return prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: this.mapStripeStatus(stripeSubscription.status),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });
  }
}

export const billingService = new BillingService();

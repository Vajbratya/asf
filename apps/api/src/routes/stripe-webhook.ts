import { Hono } from 'hono';
import Stripe from 'stripe';
import { prisma } from '../lib/db';
import { billingService } from '../services/billing';
import { usageMeteringService } from '../services/usage-metering';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export const stripeWebhook = new Hono();

/**
 * Stripe webhook endpoint
 * Handles all Stripe events for billing automation
 */
stripeWebhook.post('/', async (c) => {
  const sig = c.req.header('stripe-signature');

  if (!sig) {
    return c.json({ error: 'Missing stripe-signature header' }, 400);
  }

  const body = await c.req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return c.json({ error: 'Webhook signature verification failed' }, 400);
  }

  console.log(`Received Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.created':
        await handleInvoiceCreated(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.finalized':
        await handleInvoiceFinalized(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (err: any) {
    console.error(`Error handling webhook ${event.type}:`, err);
    return c.json({ error: 'Webhook handler failed', message: err.message }, 500);
  }
});

/**
 * Handle successful checkout session
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.orgId;

  if (!orgId) {
    console.error('No orgId in checkout session metadata');
    return;
  }

  console.log(`Checkout completed for organization: ${orgId}`);

  // Subscription will be created via customer.subscription.created event
  // This event can be used for additional actions like sending welcome email
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata?.orgId;

  if (!orgId) {
    console.error('No orgId in subscription metadata');
    return;
  }

  console.log(`Subscription created for organization: ${orgId}`);

  // Sync subscription to database
  await billingService.syncSubscriptionFromStripe(subscription.id);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`Subscription updated: ${subscription.id}`);

  try {
    const existingSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!existingSubscription) {
      console.error(`Subscription not found in database: ${subscription.id}`);
      return;
    }

    // Sync updates from Stripe
    await billingService.syncSubscriptionFromStripe(subscription.id);

    // If subscription was canceled
    if (subscription.status === 'canceled') {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });
    }

    // If subscription period changed, reset usage
    const periodChanged =
      new Date(subscription.current_period_start * 1000).getTime() !==
      existingSubscription.currentPeriodStart.getTime();

    if (periodChanged) {
      await usageMeteringService.resetUsage(existingSubscription.organizationId);
    }
  } catch (err) {
    console.error('Error handling subscription update:', err);
    throw err;
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Subscription deleted: ${subscription.id}`);

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    },
  });
}

/**
 * Handle invoice creation
 */
async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  if (!invoice.subscription) {
    return;
  }

  console.log(`Invoice created: ${invoice.id}`);

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });

  if (!subscription) {
    console.error(`Subscription not found for invoice: ${invoice.id}`);
    return;
  }

  // Save invoice to database
  await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      stripeInvoiceNumber: invoice.number || null,
      stripeInvoiceUrl: invoice.hosted_invoice_url || null,
      stripeInvoicePdf: invoice.invoice_pdf || null,
      amount: invoice.total,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status || 'draft',
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      subscriptionAmount: invoice.subscription_details?.metadata?.base_amount
        ? parseInt(invoice.subscription_details.metadata.base_amount)
        : invoice.total,
      overageAmount: 0, // Will be calculated from line items if needed
    },
  });
}

/**
 * Handle invoice finalization
 */
async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  console.log(`Invoice finalized: ${invoice.id}`);

  await prisma.invoice.update({
    where: { stripeInvoiceId: invoice.id },
    data: {
      stripeInvoiceNumber: invoice.number || null,
      stripeInvoiceUrl: invoice.hosted_invoice_url || null,
      stripeInvoicePdf: invoice.invoice_pdf || null,
      status: invoice.status || 'open',
    },
  });
}

/**
 * Handle successful payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`Invoice paid: ${invoice.id}`);

  await prisma.invoice.update({
    where: { stripeInvoiceId: invoice.id },
    data: {
      status: 'paid',
      paidAt: new Date(),
    },
  });

  // Update subscription status if it was past_due
  if (invoice.subscription) {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (subscription && subscription.status === 'PAST_DUE') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' },
      });
    }
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice: ${invoice.id}`);

  await prisma.invoice.update({
    where: { stripeInvoiceId: invoice.id },
    data: {
      status: invoice.status || 'open',
    },
  });

  // Update subscription status to past_due
  if (invoice.subscription) {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: { organization: true },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'PAST_DUE' },
      });

      // TODO: Send notification email to organization
      console.log(`Payment failed for organization: ${subscription.organization.name}`);
    }
  }
}

/**
 * Handle trial ending soon
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  console.log(`Trial will end for subscription: ${subscription.id}`);

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { organization: true },
  });

  if (dbSubscription) {
    // TODO: Send trial ending notification email
    console.log(`Trial ending soon for organization: ${dbSubscription.organization.name}`);
  }
}

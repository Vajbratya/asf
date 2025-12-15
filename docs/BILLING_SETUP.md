# IntegraSaúde Billing System Setup Guide

Complete guide for setting up the Stripe billing integration for IntegraSaúde.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Stripe Configuration](#stripe-configuration)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)

## Overview

IntegraSaúde uses a hybrid B2B SaaS billing model with:

- **Subscription-based pricing** (3 tiers: Starter, Professional, Enterprise)
- **Usage-based billing** for overages
- **Monthly and Annual** billing periods
- **14-day free trial** for all plans

### Revenue Model

```
Monthly Recurring Revenue (MRR) =
  Base Subscription Fees +
  Overage Charges (messages, connectors, users)
```

## Prerequisites

Before setting up billing, ensure you have:

- [x] Stripe account (https://dashboard.stripe.com)
- [x] PostgreSQL database running
- [x] Upstash Redis account (for usage metering)
- [x] WorkOS account (for authentication)

## Stripe Configuration

### 1. Create Stripe Products and Prices

Login to [Stripe Dashboard](https://dashboard.stripe.com/test/products) and create the following products:

#### Starter Plan

**Product Details:**

- Name: `IntegraSaúde - Starter`
- Description: `For small clinics and practices`

**Prices:**

1. Monthly: R$ 499/month
   - Price ID: Save as `STRIPE_PRICE_STARTER_MONTHLY`
   - Billing period: Monthly
   - Currency: BRL

2. Annual: R$ 4,990/year
   - Price ID: Save as `STRIPE_PRICE_STARTER_ANNUAL`
   - Billing period: Yearly
   - Currency: BRL

#### Professional Plan

**Product Details:**

- Name: `IntegraSaúde - Professional`
- Description: `For growing healthcare organizations`

**Prices:**

1. Monthly: R$ 1,499/month
   - Price ID: Save as `STRIPE_PRICE_PROFESSIONAL_MONTHLY`

2. Annual: R$ 14,990/year
   - Price ID: Save as `STRIPE_PRICE_PROFESSIONAL_ANNUAL`

#### Enterprise Plan

**Product Details:**

- Name: `IntegraSaúde - Enterprise`
- Description: `Custom pricing for large hospitals`
- Pricing: Custom (handled via sales team)

### 2. Configure Webhook Endpoint

#### Development (Stripe CLI)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local API
stripe listen --forward-to http://localhost:3001/webhooks/stripe
```

Copy the webhook signing secret from CLI output and save as `STRIPE_WEBHOOK_SECRET`

#### Production

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Endpoint URL: `https://api.integrasaude.com/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.created`
   - `invoice.finalized`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Enable Customer Portal

1. Go to [Customer Portal Settings](https://dashboard.stripe.com/settings/billing/portal)
2. Enable the following features:
   - Invoice history
   - Update payment method
   - Cancel subscription
   - Update subscription (plan changes)
3. Configure cancellation behavior:
   - Allow cancellation at period end
   - Prevent immediate cancellation (optional)
4. Customize branding (optional)

### 4. Configure Payment Methods

1. Go to [Payment Methods](https://dashboard.stripe.com/settings/payment_methods)
2. Enable:
   - Cards (Visa, Mastercard, Amex, Elo)
   - Pix (for Brazilian customers)
   - Boleto (optional, for invoicing)

## Database Setup

### 1. Run Migrations

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Or push schema (development)
pnpm db:push
```

### 2. Verify Schema

Check that these tables were created:

- `Subscription`
- `UsageRecord`
- `Invoice`

```sql
-- Verify tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('Subscription', 'UsageRecord', 'Invoice');
```

## Environment Variables

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Stripe Variables

```bash
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY="sk_test_..." # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # or pk_live_...

# Webhook Secret (from Stripe CLI or Dashboard)
STRIPE_WEBHOOK_SECRET="whsec_..."

# Price IDs (from Stripe Products page)
STRIPE_PRICE_STARTER_MONTHLY="price_..."
STRIPE_PRICE_STARTER_ANNUAL="price_..."
STRIPE_PRICE_PROFESSIONAL_MONTHLY="price_..."
STRIPE_PRICE_PROFESSIONAL_ANNUAL="price_..."
```

### 3. Configure Redis (Upstash)

```bash
# Get from https://console.upstash.com
UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REDIS_REST_TOKEN="..."
```

### 4. Configure App URLs

```bash
# Development
NEXT_PUBLIC_APP_URL="http://localhost:3000"
API_URL="http://localhost:3001"

# Production
# NEXT_PUBLIC_APP_URL="https://app.integrasaude.com"
# API_URL="https://api.integrasaude.com"
```

## Testing

### 1. Test Subscription Flow

```bash
# Start development servers
pnpm dev

# In another terminal, start Stripe CLI
stripe listen --forward-to http://localhost:3001/webhooks/stripe
```

**Test Steps:**

1. Navigate to http://localhost:3000/dashboard/billing
2. Click "Select Plan" on Starter or Professional
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Complete checkout
7. Verify:
   - Subscription created in database
   - Customer created in Stripe
   - Webhook events received

### 2. Test Usage Metering

```bash
# Create a test message (triggers usage tracking)
curl -X POST http://localhost:3001/api/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "connectorId": "...",
    "payload": {...}
  }'

# Check usage
curl http://localhost:3001/api/v1/billing/usage
```

### 3. Test Overage Billing

```typescript
// In browser console or API test
const usage = await fetch('/api/v1/billing/usage').then((r) => r.json());
console.log('Current usage:', usage);

// Verify overage calculation when limits exceeded
if (!usage.withinLimits) {
  console.log('Overage charges:', usage.overageCosts);
}
```

### 4. Test Webhooks

```bash
# Trigger a test webhook
stripe trigger customer.subscription.created

# Check API logs for webhook processing
```

### 5. Test Stripe Test Cards

| Card Number         | Scenario                               |
| ------------------- | -------------------------------------- |
| 4242 4242 4242 4242 | Success                                |
| 4000 0000 0000 0341 | Requires authentication (3D Secure)    |
| 4000 0000 0000 0002 | Card declined                          |
| 4000 0025 0000 3155 | Requires authentication, then succeeds |

See more: https://stripe.com/docs/testing

## Production Deployment

### 1. Switch to Live Mode

```bash
# Update .env with live keys
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### 2. Configure Production Webhooks

1. Create webhook endpoint in Stripe Dashboard (live mode)
2. Point to production URL: `https://api.integrasaude.com/webhooks/stripe`
3. Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

### 3. Set Up Recurring Jobs

Configure cron jobs or scheduled tasks for:

#### Daily Usage Sync (recommended: 00:00 UTC)

```typescript
// Sync overages to Stripe daily
import { usageMeteringService } from './services/usage-metering';

await usageMeteringService.syncOveragesToStripe();
```

#### Monthly Billing Period Reset (1st of each month)

```typescript
// Reset usage counters for new billing period
import { usageMeteringService } from './services/usage-metering';
import { prisma } from './lib/db';

const orgs = await prisma.organization.findMany({
  where: { subscription: { status: 'ACTIVE' } },
});

for (const org of orgs) {
  await usageMeteringService.resetUsage(org.id);
}
```

#### Example Cron Setup (using QStash)

```typescript
// apps/api/src/routes/cron.ts
import { Hono } from 'hono';
import { verifySignature } from '@upstash/qstash/nextjs';

export const cron = new Hono();

cron.post('/sync-usage', async (c) => {
  // Verify QStash signature
  const signature = c.req.header('upstash-signature');
  // ... verify signature ...

  await usageMeteringService.syncOveragesToStripe();
  return c.json({ success: true });
});
```

### 4. Monitor Billing Health

Set up monitoring for:

- Failed payments (alert immediately)
- High overage usage (notify customer)
- Subscription cancellations (track churn)
- Webhook failures (retry/alert)

```typescript
// Example: Monitor failed payments
app.post('/webhooks/stripe', async (c) => {
  // ... webhook handling ...

  if (event.type === 'invoice.payment_failed') {
    // Send alert to ops team
    await sendAlert({
      type: 'payment_failed',
      customer: invoice.customer,
      amount: invoice.amount_due,
    });
  }
});
```

## API Endpoints

### Billing Routes

| Method | Endpoint                                  | Description                  |
| ------ | ----------------------------------------- | ---------------------------- |
| GET    | `/api/v1/billing/subscription`            | Get current subscription     |
| GET    | `/api/v1/billing/usage`                   | Get current usage and limits |
| GET    | `/api/v1/billing/usage/history`           | Get usage history            |
| POST   | `/api/v1/billing/checkout`                | Create checkout session      |
| POST   | `/api/v1/billing/subscription/update`     | Update subscription plan     |
| POST   | `/api/v1/billing/subscription/cancel`     | Cancel subscription          |
| POST   | `/api/v1/billing/subscription/reactivate` | Reactivate subscription      |
| POST   | `/api/v1/billing/portal`                  | Get customer portal URL      |
| GET    | `/api/v1/billing/invoices`                | Get invoice history          |
| GET    | `/api/v1/billing/invoice/upcoming`        | Get upcoming invoice         |

### Webhook Endpoint

| Method | Endpoint           | Description            |
| ------ | ------------------ | ---------------------- |
| POST   | `/webhooks/stripe` | Stripe webhook handler |

## Troubleshooting

### Webhook not receiving events

1. Check webhook endpoint is publicly accessible
2. Verify webhook secret is correct
3. Check Stripe Dashboard > Webhooks > Events
4. Look for failed delivery attempts

### Subscription not created

1. Check API logs for errors
2. Verify customer exists in Stripe
3. Check price IDs are correct
4. Ensure database migration ran successfully

### Usage not tracking

1. Verify Redis connection
2. Check usage metering service is called on message processing
3. Verify Redis keys with: `redis-cli KEYS "usage:*"`

### Overage charges not applied

1. Verify daily sync job is running
2. Check subscription has `stripeSubscriptionItemId`
3. Verify usage exceeds limits
4. Check Stripe Dashboard > Subscriptions > Usage

## Support

For issues or questions:

- **Stripe Support:** https://support.stripe.com
- **Documentation:** https://stripe.com/docs
- **IntegraSaúde Team:** dev@integrasaude.com

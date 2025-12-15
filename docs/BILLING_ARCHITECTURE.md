# IntegraSaúde Billing Architecture

Complete technical architecture documentation for the billing system.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web Application                          │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │  Pricing     │  │  Billing    │  │  Stripe Checkout     │   │
│  │  Table       │  │  Dashboard  │  │  Session             │   │
│  └──────────────┘  └─────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API Server                              │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │  Billing     │  │  Usage      │  │  Stripe Webhook      │   │
│  │  Routes      │  │  Metering   │  │  Handler             │   │
│  └──────────────┘  └─────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           │                    │                      ▲
           ▼                    ▼                      │
┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│   PostgreSQL     │  │  Upstash Redis   │  │     Stripe API      │
│   Database       │  │  (Usage Cache)   │  │                     │
│                  │  │                  │  │  - Subscriptions    │
│  - Subscription  │  │  usage:{orgId}:  │  │  - Customers        │
│  - UsageRecord   │  │    {period}      │  │  - Invoices         │
│  - Invoice       │  │                  │  │  - Webhooks         │
└──────────────────┘  └──────────────────┘  └─────────────────────┘
```

## Data Flow

### 1. Subscription Creation Flow

```
User selects plan → Create checkout → Stripe checkout → Success
                                            ↓
                                    Webhook: checkout.session.completed
                                            ↓
                                    Create subscription in DB
                                            ↓
                                    Create customer in Stripe
                                            ↓
                                    Initialize usage tracking
```

### 2. Usage Tracking Flow

```
Message processed → Track in Redis → Daily sync → Stripe usage record
                         ↓
                    Update counters
                         ↓
                 Check against limits
                         ↓
                  Calculate overages
```

### 3. Billing Cycle Flow

```
Billing period ends → Stripe creates invoice → Webhook: invoice.created
                                                        ↓
                                                Save invoice to DB
                                                        ↓
                                            Webhook: invoice.paid
                                                        ↓
                                                Mark as paid in DB
                                                        ↓
                                                Reset usage counters
```

## Database Schema

### Subscription Model

```prisma
model Subscription {
  id                       String             @id @default(cuid())
  organizationId           String             @unique
  organization             Organization       @relation(...)

  // Stripe IDs
  stripeSubscriptionId     String             @unique
  stripeSubscriptionItemId String?
  stripePriceId            String

  // Plan details
  status                   SubscriptionStatus
  planType                 PlanType
  billingPeriod            BillingPeriod

  // Limits
  messageLimit             Int
  connectorLimit           Int
  userLimit                Int

  // Current period
  currentPeriodStart       DateTime
  currentPeriodEnd         DateTime
  cancelAtPeriodEnd        Boolean            @default(false)
  canceledAt               DateTime?

  // Trial
  trialStart               DateTime?
  trialEnd                 DateTime?

  usageRecords             UsageRecord[]
  invoices                 Invoice[]
}
```

### UsageRecord Model

```prisma
model UsageRecord {
  id             String       @id @default(cuid())
  subscriptionId String
  subscription   Subscription @relation(...)

  // Usage metrics
  messages       Int          @default(0)
  connectors     Int          @default(0)
  users          Int          @default(0)

  // Message type breakdown
  messageTypeADT Int          @default(0)
  messageTypeORM Int          @default(0)
  messageTypeORU Int          @default(0)
  messageTypeOther Int        @default(0)

  // Period
  periodStart    DateTime
  periodEnd      DateTime

  // Synced to Stripe
  syncedToStripe Boolean      @default(false)
  syncedAt       DateTime?
}
```

### Invoice Model

```prisma
model Invoice {
  id                   String       @id @default(cuid())
  subscriptionId       String
  subscription         Subscription @relation(...)

  // Stripe data
  stripeInvoiceId      String       @unique
  stripeInvoiceNumber  String?
  stripeInvoiceUrl     String?
  stripeInvoicePdf     String?

  // Invoice details
  amount               Int          // Amount in cents
  currency             String       @default("BRL")
  status               String

  // Dates
  periodStart          DateTime
  periodEnd            DateTime
  dueDate              DateTime?
  paidAt               DateTime?

  // Breakdown
  subscriptionAmount   Int
  overageAmount        Int          @default(0)
}
```

## Service Architecture

### BillingService

Handles all Stripe-related operations:

```typescript
class BillingService {
  // Customer management
  createCustomer(org: Organization): Promise<string>

  // Subscription management
  createSubscription(orgId, planId, billingPeriod, trialDays?): Promise<Subscription>
  updateSubscription(orgId, newPlanId, newBillingPeriod): Promise<Subscription>
  cancelSubscription(orgId, immediately): Promise<Subscription>
  reactivateSubscription(orgId): Promise<Subscription>

  // Checkout & Portal
  createCheckoutSession(...): Promise<string>
  createPortalSession(orgId, returnUrl): Promise<string>

  // Invoicing
  getUpcomingInvoice(orgId): Promise<Stripe.Invoice>

  // Usage reporting
  reportUsage(subscriptionItemId, quantity): Promise<void>

  // Sync
  syncSubscriptionFromStripe(stripeSubscriptionId): Promise<Subscription>
}
```

### UsageMeteringService

Tracks and manages usage metrics:

```typescript
class UsageMeteringService {
  // Tracking
  trackMessage(orgId, messageType): Promise<void>
  updateConnectorCount(orgId): Promise<void>
  updateUserCount(orgId): Promise<void>

  // Retrieval
  getUsage(orgId, period?): Promise<UsageData>
  getUsageHistory(orgId, limit): Promise<UsageRecord[]>
  getUsagePercentages(orgId): Promise<{...}>

  // Validation
  checkLimits(orgId): Promise<{withinLimits, usage, limits, overages}>

  // Billing
  getOverageCosts(orgId): Promise<{messages, connectors, users, total}>
  saveUsageRecord(orgId, period?): Promise<void>
  syncOveragesToStripe(): Promise<void>
  resetUsage(orgId): Promise<void>
}
```

## Redis Data Structure

### Usage Tracking Keys

```
Key format: usage:{orgId}:{period}
Period format: YYYY-MM

Example:
  usage:org_123:2024-01
  usage:org_456:2024-01

Hash fields:
  messages: 15234
  connectors: 3
  users: 12
  type:ADT: 8500
  type:ORM: 4234
  type:ORU: 2000
  type:OTHER: 500

TTL: 90 days (to support max retention period)
```

## Stripe Integration

### Products & Prices

```
Product: IntegraSaúde - Starter
├── Price: price_starter_monthly (R$ 499/month)
└── Price: price_starter_annual (R$ 4,990/year)

Product: IntegraSaúde - Professional
├── Price: price_professional_monthly (R$ 1,499/month)
└── Price: price_professional_annual (R$ 14,990/year)

Product: IntegraSaúde - Enterprise
└── Custom pricing (contact sales)
```

### Webhook Events

| Event                                  | Handler                     | Action                                   |
| -------------------------------------- | --------------------------- | ---------------------------------------- |
| `checkout.session.completed`           | `handleCheckoutComplete`    | Log completion                           |
| `customer.subscription.created`        | `handleSubscriptionCreated` | Sync to DB                               |
| `customer.subscription.updated`        | `handleSubscriptionUpdated` | Update DB, reset usage if period changed |
| `customer.subscription.deleted`        | `handleSubscriptionDeleted` | Mark as canceled                         |
| `invoice.created`                      | `handleInvoiceCreated`      | Save invoice to DB                       |
| `invoice.finalized`                    | `handleInvoiceFinalized`    | Update invoice details                   |
| `invoice.paid`                         | `handleInvoicePaid`         | Mark paid, update subscription status    |
| `invoice.payment_failed`               | `handlePaymentFailed`       | Mark past_due, send notification         |
| `customer.subscription.trial_will_end` | `handleTrialWillEnd`        | Send notification                        |

## API Endpoints

### Subscription Management

```http
GET /api/v1/billing/subscription
Response: {
  id, status, planType, billingPeriod,
  currentPeriodStart, currentPeriodEnd,
  messageLimit, connectorLimit, userLimit
}

POST /api/v1/billing/checkout
Body: { planId, billingPeriod, successUrl, cancelUrl }
Response: { url: "https://checkout.stripe.com/..." }

POST /api/v1/billing/subscription/update
Body: { planId, billingPeriod }
Response: Subscription

POST /api/v1/billing/subscription/cancel
Body: { immediately: boolean }
Response: Subscription

POST /api/v1/billing/subscription/reactivate
Response: Subscription

POST /api/v1/billing/portal
Body: { returnUrl }
Response: { url: "https://billing.stripe.com/..." }
```

### Usage & Analytics

```http
GET /api/v1/billing/usage
Response: {
  usage: { messages, connectors, users, messagesByType },
  limits: { messages, connectors, users },
  percentages: { messages, connectors, users },
  withinLimits: boolean,
  overageCosts: { messages, connectors, users, total }
}

GET /api/v1/billing/usage/history?limit=12
Response: UsageRecord[]

GET /api/v1/billing/analytics
Response: {
  subscription: {...},
  usage: { history, total, average },
  billing: { invoices, totalSpent }
}
```

### Invoicing

```http
GET /api/v1/billing/invoices?limit=10
Response: Invoice[]

GET /api/v1/billing/invoices/:id
Response: Invoice

GET /api/v1/billing/invoice/upcoming
Response: {
  id, amount, currency, periodStart, periodEnd,
  lines: [...]
}
```

## Pricing Model

### Base Subscription Pricing

```typescript
const PRICING_TIERS = {
  STARTER: {
    monthlyPrice: 499, // R$ 499/month
    annualPrice: 4990, // R$ 4,990/year (17% discount)
    features: {
      messages: 10000,
      connectors: 2,
      users: 5,
    },
  },
  PROFESSIONAL: {
    monthlyPrice: 1499, // R$ 1,499/month
    annualPrice: 14990, // R$ 14,990/year (17% discount)
    features: {
      messages: 50000,
      connectors: 5,
      users: 20,
    },
  },
  ENTERPRISE: {
    // Custom pricing
  },
};
```

### Overage Pricing

```typescript
const OVERAGE_PRICING = {
  messages: 0.01, // R$ 0.01 per message
  connectors: 200, // R$ 200 per connector/month
  users: 50, // R$ 50 per user/month
};
```

### Revenue Calculation

```typescript
// Monthly Revenue = Base + Overages
const calculateRevenue = (usage, planType) => {
  const plan = PRICING_TIERS[planType];
  const base = plan.monthlyPrice;

  const messageOverage = Math.max(0, usage.messages - plan.features.messages);
  const connectorOverage = Math.max(0, usage.connectors - plan.features.connectors);
  const userOverage = Math.max(0, usage.users - plan.features.users);

  const overages =
    messageOverage * OVERAGE_PRICING.messages +
    connectorOverage * OVERAGE_PRICING.connectors +
    userOverage * OVERAGE_PRICING.users;

  return base + overages;
};
```

## Security Considerations

### 1. Webhook Security

```typescript
// Verify Stripe webhook signature
const signature = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
```

### 2. API Authentication

All billing endpoints require authentication via WorkOS:

```typescript
billing.use('*', authMiddleware);
// Ensures orgId is available via c.get('orgId')
```

### 3. Data Privacy

- Store only necessary Stripe IDs
- Never log full credit card numbers
- Encrypt sensitive fields in database
- Use Stripe Customer Portal for payment method updates

### 4. Rate Limiting

Apply rate limits to billing endpoints:

```typescript
billing.use(
  '*',
  rateLimiter({
    max: 100,
    window: '1m',
  })
);
```

## Monitoring & Observability

### Key Metrics to Track

1. **Revenue Metrics**
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - Churn rate
   - Average revenue per user (ARPU)

2. **Usage Metrics**
   - Messages per organization
   - Overage frequency
   - Plan distribution

3. **Health Metrics**
   - Failed payments
   - Subscription cancellations
   - Webhook failures
   - API response times

### Logging

```typescript
// Log all billing events
logger.info('subscription_created', {
  orgId,
  planType,
  amount,
  stripeSubscriptionId,
});

logger.error('payment_failed', {
  orgId,
  invoiceId,
  amount,
  reason,
});
```

## Testing Strategy

### Unit Tests

```typescript
describe('BillingService', () => {
  it('should create subscription', async () => {
    const subscription = await billingService.createSubscription(orgId, 'starter', 'MONTHLY');
    expect(subscription.planType).toBe('STARTER');
  });

  it('should calculate overages correctly', async () => {
    const costs = await usageMeteringService.getOverageCosts(orgId);
    expect(costs.total).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
describe('Billing Flow', () => {
  it('should complete checkout to subscription', async () => {
    // 1. Create checkout session
    const checkoutUrl = await createCheckoutSession(...);

    // 2. Simulate Stripe checkout
    await stripeHelper.completeCheckout(checkoutUrl);

    // 3. Verify subscription created
    const subscription = await getSubscription(orgId);
    expect(subscription.status).toBe('ACTIVE');
  });
});
```

### Webhook Tests

```typescript
describe('Stripe Webhooks', () => {
  it('should handle invoice.paid', async () => {
    const event = stripeHelper.createEvent('invoice.paid', {...});
    await webhookHandler(event);

    const invoice = await getInvoice(invoiceId);
    expect(invoice.status).toBe('paid');
  });
});
```

## Performance Optimization

### 1. Caching

```typescript
// Cache subscription data (5 minutes)
const subscription = await cache.get(`subscription:${orgId}`, async () => {
  return await prisma.subscription.findUnique({...});
}, { ttl: 300 });
```

### 2. Batch Operations

```typescript
// Sync usage for all orgs in batch
const syncUsageBatch = async () => {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
  });

  await Promise.all(subscriptions.map((sub) => syncUsageForSubscription(sub)));
};
```

### 3. Database Indexing

Ensure indexes on:

- `Subscription.stripeSubscriptionId`
- `Invoice.stripeInvoiceId`
- `UsageRecord.subscriptionId_periodStart`
- `Organization.stripeCustomerId`

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Daily automated backups
   - Point-in-time recovery enabled
   - Test restore monthly

2. **Stripe Data**
   - Stripe maintains all payment data
   - Use Stripe Dashboard for historical data
   - Export invoices monthly

3. **Usage Data**
   - Redis persistence enabled
   - Backup to S3 daily
   - Store usage records in PostgreSQL

### Recovery Procedures

**Scenario: Lost subscription data**

```bash
# Sync from Stripe
for subscription in $(stripe subscriptions list); do
  node scripts/sync-subscription.js $subscription
done
```

**Scenario: Usage data corruption**

```bash
# Restore from latest UsageRecord
node scripts/restore-usage-from-db.js --org $orgId
```

## Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Revenue forecasting
   - Churn prediction
   - Usage trends

2. **Custom Plans**
   - Per-organization custom limits
   - Volume discounts
   - Contract-based pricing

3. **Self-Service Upgrades**
   - In-app plan comparison
   - Feature gating
   - Usage notifications

4. **Payment Methods**
   - Boleto support
   - Payment plans
   - Multi-currency support

5. **Referral Program**
   - Credits for referrals
   - Affiliate tracking
   - Commission management

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Billing Best Practices](https://stripe.com/docs/billing/lifecycle)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)

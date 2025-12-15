/**
 * IntegraSaúde Pricing Configuration
 * B2B SaaS Pricing Model for Healthcare Integration
 */

export const PRICING_TIERS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 499, // R$ 499/month
    annualPrice: 4990, // R$ 4.990/year (2 months free)
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL || '',
    features: {
      messages: 10000, // 10k messages/month
      connectors: 2, // 2 hospital connectors
      users: 5,
      support: 'email' as const,
      sla: '99.5%',
      retention: 30, // 30 days data retention
      customWebhooks: false,
      apiAccess: false,
      dedicatedSupport: false,
      onPremise: false,
      customIntegrations: false,
    },
    highlights: [
      '10,000 messages/month',
      '2 hospital connectors',
      'Up to 5 users',
      'Email support',
      '99.5% SLA uptime',
      '30 days data retention',
    ],
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 1499, // R$ 1.499/month
    annualPrice: 14990, // R$ 14.990/year (2 months free)
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL || '',
    features: {
      messages: 50000,
      connectors: 5,
      users: 20,
      support: 'priority' as const,
      sla: '99.9%',
      retention: 90,
      customWebhooks: true,
      apiAccess: true,
      dedicatedSupport: false,
      onPremise: false,
      customIntegrations: false,
    },
    highlights: [
      '50,000 messages/month',
      '5 hospital connectors',
      'Up to 20 users',
      'Priority support',
      '99.9% SLA uptime',
      '90 days data retention',
      'Custom webhooks',
      'Full API access',
    ],
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null, // Custom pricing
    annualPrice: null,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    features: {
      messages: Infinity, // Unlimited
      connectors: Infinity, // Unlimited
      users: Infinity, // Unlimited
      support: '24/7' as const,
      sla: '99.99%',
      retention: 365,
      customWebhooks: true,
      apiAccess: true,
      dedicatedSupport: true,
      onPremise: true,
      customIntegrations: true,
    },
    highlights: [
      'Unlimited messages',
      'Unlimited connectors',
      'Unlimited users',
      '24/7 dedicated support',
      '99.99% SLA uptime',
      '365 days data retention',
      'Custom webhooks',
      'Full API access',
      'On-premise deployment',
      'Custom integrations',
      'Dedicated account manager',
    ],
  },
} as const;

export const OVERAGE_PRICING = {
  messages: 0.01, // R$ 0.01 per message over limit
  connectors: 200, // R$ 200 per additional connector/month
  users: 50, // R$ 50 per additional user/month
};

export type PlanId = keyof typeof PRICING_TIERS;
export type PlanFeatures = (typeof PRICING_TIERS)[PlanId]['features'];

/**
 * Get plan by ID
 */
export function getPlan(planId: PlanId) {
  return PRICING_TIERS[planId];
}

/**
 * Get all available plans
 */
export function getAllPlans() {
  return Object.values(PRICING_TIERS);
}

/**
 * Check if usage is within plan limits
 */
export function isWithinLimits(
  usage: {
    messages: number;
    connectors: number;
    users: number;
  },
  planId: PlanId
): boolean {
  const plan = getPlan(planId);

  return (
    usage.messages <= plan.features.messages &&
    usage.connectors <= plan.features.connectors &&
    usage.users <= plan.features.users
  );
}

/**
 * Calculate overage charges
 */
export function calculateOverage(
  usage: {
    messages: number;
    connectors: number;
    users: number;
  },
  planId: PlanId
): {
  messages: number;
  connectors: number;
  users: number;
  total: number;
} {
  const plan = getPlan(planId);

  const messageOverage = Math.max(0, usage.messages - plan.features.messages);
  const connectorOverage = Math.max(0, usage.connectors - plan.features.connectors);
  const userOverage = Math.max(0, usage.users - plan.features.users);

  const messageCost = messageOverage * OVERAGE_PRICING.messages;
  const connectorCost = connectorOverage * OVERAGE_PRICING.connectors;
  const userCost = userOverage * OVERAGE_PRICING.users;

  return {
    messages: messageCost,
    connectors: connectorCost,
    users: userCost,
    total: messageCost + connectorCost + userCost,
  };
}

/**
 * Format price in Brazilian Real
 */
export function formatPrice(price: number | null): string {
  if (price === null) return 'Custom';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

/**
 * Calculate annual savings
 */
export function calculateAnnualSavings(planId: PlanId): number {
  const plan = getPlan(planId);
  if (!plan.monthlyPrice || !plan.annualPrice) return 0;
  return plan.monthlyPrice * 12 - plan.annualPrice;
}

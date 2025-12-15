'use client';

import {
  PRICING_TIERS,
  formatPrice,
  calculateAnnualSavings,
  type PlanId,
} from '@integrasaude/shared';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check } from 'lucide-react';

interface PricingTableProps {
  currentPlan?: PlanId;
  onSelectPlan?: (planId: PlanId, billingPeriod: 'MONTHLY' | 'ANNUAL') => void;
  billingPeriod?: 'MONTHLY' | 'ANNUAL';
}

export function PricingTable({
  currentPlan,
  onSelectPlan,
  billingPeriod = 'MONTHLY',
}: PricingTableProps) {
  const plans = Object.entries(PRICING_TIERS);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map(([id, plan]) => {
        const planId = id.toLowerCase() as PlanId;
        const isCurrentPlan = currentPlan === planId;
        const price = billingPeriod === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice;
        const savings = billingPeriod === 'ANNUAL' ? calculateAnnualSavings(planId) : 0;

        return (
          <Card
            key={id}
            className={`relative flex flex-col ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
          >
            {isCurrentPlan && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
                Current Plan
              </Badge>
            )}

            {plan.name === 'Professional' && !isCurrentPlan && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="secondary">
                Popular
              </Badge>
            )}

            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <div className="mt-4 flex items-baseline">
                  {price !== null ? (
                    <>
                      <span className="text-4xl font-bold">{formatPrice(price)}</span>
                      <span className="ml-2 text-muted-foreground">
                        /{billingPeriod === 'MONTHLY' ? 'mês' : 'ano'}
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold">Custom</span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="mt-2 text-sm text-green-600">
                    Economize {formatPrice(savings)}/ano
                  </p>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.highlights.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="mr-2 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              {plan.name === 'Enterprise' ? (
                <Button className="w-full" variant="outline" asChild>
                  <a href="mailto:sales@integrasaude.com">Contact Sales</a>
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : 'default'}
                  disabled={isCurrentPlan}
                  onClick={() => onSelectPlan?.(planId, billingPeriod)}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

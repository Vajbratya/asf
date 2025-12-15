'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PricingTable } from '@/components/pricing-table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPrice, type PlanId } from '@integrasaude/shared';
import {
  CreditCard,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Download,
  ExternalLink,
} from 'lucide-react';

interface Subscription {
  id: string;
  planType: string;
  status: string;
  billingPeriod: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  messageLimit: number;
  connectorLimit: number;
  userLimit: number;
}

interface Usage {
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

interface UsageResponse {
  usage: Usage;
  limits: {
    messages: number;
    connectors: number;
    users: number;
  };
  percentages: {
    messages: number;
    connectors: number;
    users: number;
  };
  withinLimits: boolean;
  overageCosts: {
    messages: number;
    connectors: number;
    users: number;
    total: number;
  };
}

interface Invoice {
  id: string;
  stripeInvoiceNumber: string;
  amount: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  stripeInvoiceUrl: string | null;
  stripeInvoicePdf: string | null;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageData, setUsageData] = useState<UsageResponse | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  useEffect(() => {
    loadBillingData();
  }, []);

  async function loadBillingData() {
    try {
      const [subRes, usageRes, invoicesRes] = await Promise.all([
        fetch('/api/v1/billing/subscription'),
        fetch('/api/v1/billing/usage'),
        fetch('/api/v1/billing/invoices?limit=5'),
      ]);

      if (subRes.ok) {
        const sub = await subRes.json();
        setSubscription(sub);
        setBillingPeriod(sub.billingPeriod);
      }

      if (usageRes.ok) {
        setUsageData(await usageRes.json());
      }

      if (invoicesRes.ok) {
        setInvoices(await invoicesRes.json());
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleManageBilling() {
    try {
      const res = await fetch('/api/v1/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
    }
  }

  async function handleUpgrade(planId: PlanId, period: 'MONTHLY' | 'ANNUAL') {
    try {
      // If already has subscription, update it
      if (subscription) {
        const res = await fetch('/api/v1/billing/subscription/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId,
            billingPeriod: period,
          }),
        });

        if (res.ok) {
          await loadBillingData();
          setShowUpgrade(false);
        }
      } else {
        // Create new subscription via checkout
        const res = await fetch('/api/v1/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId,
            billingPeriod: period,
            successUrl: `${window.location.origin}/dashboard/billing?success=true`,
            cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
          }),
        });

        if (res.ok) {
          const { url } = await res.json();
          window.location.href = url;
        }
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const res = await fetch('/api/v1/billing/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediately: false }),
      });

      if (res.ok) {
        await loadBillingData();
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  }

  async function handleReactivate() {
    try {
      const res = await fetch('/api/v1/billing/subscription/reactivate', {
        method: 'POST',
      });

      if (res.ok) {
        await loadBillingData();
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Get Started with IntegraSaúde</h1>
          <p className="mt-2 text-muted-foreground">
            Choose a plan to start integrating your healthcare systems
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 rounded-lg border p-4">
          <span className="text-sm font-medium">Billing Period:</span>
          <div className="flex gap-2">
            <Button
              variant={billingPeriod === 'MONTHLY' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingPeriod('MONTHLY')}
            >
              Monthly
            </Button>
            <Button
              variant={billingPeriod === 'ANNUAL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingPeriod('ANNUAL')}
            >
              Annual
              <Badge variant="secondary" className="ml-2">
                Save 17%
              </Badge>
            </Button>
          </div>
        </div>

        <PricingTable onSelectPlan={handleUpgrade} billingPeriod={billingPeriod} />
      </div>
    );
  }

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    TRIALING: 'bg-blue-100 text-blue-800',
    PAST_DUE: 'bg-yellow-100 text-yellow-800',
    CANCELED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Usage</h1>
          <p className="mt-2 text-muted-foreground">Manage your subscription and monitor usage</p>
        </div>
        <Button onClick={handleManageBilling}>
          <CreditCard className="mr-2 h-4 w-4" />
          Manage Billing
        </Button>
      </div>

      {/* Alerts */}
      {subscription.cancelAtPeriodEnd && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your subscription will be canceled on{' '}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}. You can reactivate it
            anytime before then.
            <Button variant="link" className="ml-2 h-auto p-0" onClick={handleReactivate}>
              Reactivate
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {usageData && !usageData.withinLimits && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have exceeded your plan limits. Overage charges will apply:{' '}
            {formatPrice(usageData.overageCosts.total * 100)}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <Badge className={statusColors[subscription.status as keyof typeof statusColors]}>
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-2xl font-bold">{subscription.planType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Billing Period</p>
              <p className="text-2xl font-bold">
                {subscription.billingPeriod === 'MONTHLY' ? 'Monthly' : 'Annual'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Period</p>
              <p className="text-sm">
                {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowUpgrade(!showUpgrade)}>
                {showUpgrade ? 'Hide Plans' : 'Change Plan'}
              </Button>
              {!subscription.cancelAtPeriodEnd && (
                <Button variant="outline" onClick={handleCancelSubscription}>
                  Cancel Plan
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Section */}
      {showUpgrade && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 rounded-lg border p-4">
            <span className="text-sm font-medium">Billing Period:</span>
            <div className="flex gap-2">
              <Button
                variant={billingPeriod === 'MONTHLY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBillingPeriod('MONTHLY')}
              >
                Monthly
              </Button>
              <Button
                variant={billingPeriod === 'ANNUAL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBillingPeriod('ANNUAL')}
              >
                Annual
                <Badge variant="secondary" className="ml-2">
                  Save 17%
                </Badge>
              </Button>
            </div>
          </div>
          <PricingTable
            currentPlan={subscription.planType.toLowerCase() as PlanId}
            onSelectPlan={handleUpgrade}
            billingPeriod={billingPeriod}
          />
        </div>
      )}

      {/* Usage */}
      {usageData && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageData.usage.messages.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                of {usageData.limits.messages.toLocaleString()} included
              </p>
              <Progress value={usageData.percentages.messages} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connectors</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageData.usage.connectors}</div>
              <p className="text-xs text-muted-foreground">
                of {usageData.limits.connectors} allowed
              </p>
              <Progress value={usageData.percentages.connectors} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageData.usage.users}</div>
              <p className="text-xs text-muted-foreground">of {usageData.limits.users} allowed</p>
              <Progress value={usageData.percentages.users} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Message Type Breakdown */}
      {usageData && (
        <Card>
          <CardHeader>
            <CardTitle>Message Type Breakdown</CardTitle>
            <CardDescription>Messages processed this billing period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(usageData.usage.messagesByType).map(([type, count]) => (
                <div key={type} className="space-y-2">
                  <p className="text-sm font-medium">{type}</p>
                  <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                  <Progress value={(count / usageData.usage.messages) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Your billing history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{invoice.stripeInvoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.periodStart).toLocaleDateString()} -{' '}
                        {new Date(invoice.periodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(invoice.amount)}</p>
                      <Badge
                        variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {invoice.stripeInvoiceUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noopener">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {invoice.stripeInvoicePdf && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={invoice.stripeInvoicePdf} target="_blank" rel="noopener">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  period: 'monthly' | 'annual';
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfeito para pequenas clínicas',
    price: 299,
    period: 'monthly',
    features: [
      'Até 1.000 mensagens/mês',
      '1 conector',
      'Suporte por email',
      'Análise básica',
      'Acesso à API',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Para hospitais em crescimento',
    price: 899,
    period: 'monthly',
    popular: true,
    features: [
      'Até 10.000 mensagens/mês',
      'Até 5 conectores',
      'Suporte prioritário',
      'Análise avançada',
      'Acesso à API',
      'Webhooks customizados',
      'Garantia de SLA',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes redes de saúde',
    price: 2499,
    period: 'monthly',
    features: [
      'Mensagens ilimitadas',
      'Conectores ilimitados',
      'Suporte dedicado 24/7',
      'Análise avançada',
      'Acesso à API',
      'Webhooks customizados',
      'Garantia de SLA 99.9%',
      'Integrações customizadas',
      'Opção on-premise',
    ],
  },
];

interface PlanSelectionFormProps {
  onNext: (data: { planId: string; period: 'monthly' | 'annual' }) => void;
  onBack: () => void;
  initialData?: { planId?: string; period?: 'monthly' | 'annual' };
}

export function PlanSelectionForm({ onNext, onBack, initialData = {} }: PlanSelectionFormProps) {
  const [selectedPlan, setSelectedPlan] = useState(initialData.planId || '');
  const [period, setPeriod] = useState<'monthly' | 'annual'>(initialData.period || 'monthly');

  const handleSubmit = () => {
    if (selectedPlan) {
      onNext({ planId: selectedPlan, period });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Escolha Seu Plano</h2>
        <p className="text-muted-foreground mt-2">
          Comece com 14 dias de teste grátis. Sem cartão de crédito.
        </p>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant={period === 'monthly' ? 'default' : 'outline'}
          onClick={() => setPeriod('monthly')}
        >
          Mensal
        </Button>
        <Button
          variant={period === 'annual' ? 'default' : 'outline'}
          onClick={() => setPeriod('annual')}
        >
          Anual
          <Badge variant="secondary" className="ml-2">
            -20%
          </Badge>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = period === 'annual' ? Math.round(plan.price * 0.8) : plan.price;
          const isSelected = selectedPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative cursor-pointer transition-all hover:border-primary',
                isSelected && 'border-primary ring-2 ring-primary'
              )}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Mais Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">R${price}</span>
                    <span className="text-muted-foreground ml-2">
                      /{period === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={handleSubmit} size="lg" disabled={!selectedPlan}>
          Continuar
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Steps } from '@/components/ui/steps';
import { OrganizationForm } from './organization-form';
import { AdminUserForm } from './admin-user-form';
import { PlanSelectionForm } from './plan-selection-form';
import { PaymentForm } from './payment-form';
import { SetupComplete } from './setup-complete';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    organization: {},
    user: {},
    plan: {},
    payment: {},
  });

  const updateFormData = (section: string, data: any) => {
    setFormData((prev) => ({ ...prev, [section]: data }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Criar Sua Conta</h1>
          <p className="text-muted-foreground mt-2">
            Comece a usar o IntegraSaude em poucos passos
          </p>
        </div>

        <Steps current={step} total={5} />

        <div className="mt-8">
          {step === 1 && (
            <OrganizationForm
              onNext={(data) => {
                updateFormData('organization', data);
                setStep(2);
              }}
              initialData={formData.organization}
            />
          )}
          {step === 2 && (
            <AdminUserForm
              onNext={(data) => {
                updateFormData('user', data);
                setStep(3);
              }}
              onBack={() => setStep(1)}
              initialData={formData.user}
            />
          )}
          {step === 3 && (
            <PlanSelectionForm
              onNext={(data) => {
                updateFormData('plan', data);
                setStep(4);
              }}
              onBack={() => setStep(2)}
              initialData={formData.plan}
            />
          )}
          {step === 4 && (
            <PaymentForm
              onNext={(data) => {
                updateFormData('payment', data);
                setStep(5);
              }}
              onBack={() => setStep(3)}
              initialData={formData.payment}
              formData={formData}
            />
          )}
          {step === 5 && <SetupComplete formData={formData} />}
        </div>
      </div>
    </div>
  );
}

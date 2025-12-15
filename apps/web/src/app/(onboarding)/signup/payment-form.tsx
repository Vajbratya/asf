'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface PaymentFormData {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
}

interface PaymentFormProps {
  onNext: (data: PaymentFormData) => void;
  onBack: () => void;
  initialData?: Partial<PaymentFormData>;
  formData: any;
}

export function PaymentForm({ onNext, onBack, initialData = {}, formData }: PaymentFormProps) {
  const [paymentData, setPaymentData] = useState<PaymentFormData>({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    ...initialData,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof PaymentFormData, value: string) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Here you would integrate with Stripe or another payment processor
      // For now, we'll simulate a successful payment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      onNext(paymentData);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipTrial = () => {
    // Skip payment and go to completion with trial
    onNext({
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Enter your payment details or start with a free 14-day trial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cardName">Cardholder Name</Label>
            <Input
              id="cardName"
              value={paymentData.cardName}
              onChange={(e) => handleChange('cardName', e.target.value)}
              placeholder="Maria Santos"
            />
          </div>

          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={paymentData.cardNumber}
              onChange={(e) => handleChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                value={paymentData.expiryDate}
                onChange={(e) => handleChange('expiryDate', e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>

            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="password"
                value={paymentData.cvv}
                onChange={(e) => handleChange('cvv', e.target.value)}
                placeholder="123"
                maxLength={4}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              You won't be charged during your 14-day trial. Cancel anytime before the trial ends to
              avoid charges.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleSkipTrial}>
            Start Free Trial
          </Button>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Processing...' : 'Complete Setup'}
          </Button>
        </div>
      </div>
    </form>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface SetupCompleteProps {
  formData: any;
}

export function SetupComplete({ formData }: SetupCompleteProps) {
  const router = useRouter();

  useEffect(() => {
    // Submit all form data to create the organization
    const createOrganization = async () => {
      try {
        const response = await fetch('/api/v1/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization: formData.organization,
            user: formData.user,
            plan: formData.plan,
            payment: formData.payment,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create organization');
        }

        // Organization created successfully
      } catch (error) {
        console.error('Error creating organization:', error);
      }
    };

    createOrganization();
  }, [formData]);

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-6">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold">Welcome to IntegraSaúde!</h2>
        <p className="text-muted-foreground mt-2">Your account has been created successfully</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="text-left space-y-4">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              1
            </div>
            <div>
              <h4 className="font-semibold">Connect Your Hospital System</h4>
              <p className="text-sm text-muted-foreground">
                Set up your first connector to start receiving messages
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              2
            </div>
            <div>
              <h4 className="font-semibold">Test Your Connection</h4>
              <p className="text-sm text-muted-foreground">
                Send a test message to verify everything is working
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              3
            </div>
            <div>
              <h4 className="font-semibold">Configure Webhooks</h4>
              <p className="text-sm text-muted-foreground">
                Set up webhooks to receive real-time notifications
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
        <Button size="lg" onClick={() => router.push('/setup/connector')}>
          Set Up First Connector
        </Button>
      </div>
    </div>
  );
}

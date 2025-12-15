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
        <h2 className="text-3xl font-bold">Bem-vindo ao IntegraSaúde!</h2>
        <p className="text-muted-foreground mt-2">Sua conta foi criada com sucesso</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="text-left space-y-4">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              1
            </div>
            <div>
              <h4 className="font-semibold">Conecte Seu Sistema Hospitalar</h4>
              <p className="text-sm text-muted-foreground">
                Configure seu primeiro conector para começar a receber mensagens
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              2
            </div>
            <div>
              <h4 className="font-semibold">Teste Sua Conexão</h4>
              <p className="text-sm text-muted-foreground">
                Envie uma mensagem de teste para verificar se tudo está funcionando
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
                Configure webhooks para receber notificações em tempo real
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Ir para o Dashboard
        </Button>
        <Button size="lg" onClick={() => router.push('/setup/connector')}>
          Configurar Primeiro Conector
        </Button>
      </div>
    </div>
  );
}

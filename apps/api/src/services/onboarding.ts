import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface OnboardingStep {
  id: string;
  name: string;
  completed: boolean;
  action?: {
    label: string;
    href: string;
  };
}

export interface OnboardingProgress {
  steps: OnboardingStep[];
  percentComplete: number;
}

export class OnboardingService {
  async getProgress(organizationId: string): Promise<OnboardingProgress> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        connectors: true,
        apiKeys: true,
        webhooks: true,
        _count: {
          select: {
            connectors: true,
            apiKeys: true,
            webhooks: true,
          },
        },
      },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // Check for first message
    const firstMessage = await prisma.message.findFirst({
      where: {
        connector: {
          organizationId,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Check if any connector has been tested
    const hasTestedConnector = org.connectors.some((c) => c.lastHealthCheck !== null);

    const steps: OnboardingStep[] = [
      {
        id: 'account',
        name: 'Create Account',
        completed: true,
      },
      {
        id: 'billing',
        name: 'Setup Billing',
        completed: !!org.stripeCustomerId,
        action: !org.stripeCustomerId
          ? {
              label: 'Add Payment',
              href: '/dashboard/settings/billing',
            }
          : undefined,
      },
      {
        id: 'connector',
        name: 'Add Connector',
        completed: org._count.connectors > 0,
        action:
          org._count.connectors === 0
            ? {
                label: 'Add Connector',
                href: '/setup/connector',
              }
            : undefined,
      },
      {
        id: 'test',
        name: 'Test Connection',
        completed: hasTestedConnector,
        action: !hasTestedConnector
          ? {
              label: 'Test Now',
              href: '/setup/connector',
            }
          : undefined,
      },
      {
        id: 'first_message',
        name: 'Receive First Message',
        completed: !!firstMessage,
        action: !firstMessage
          ? {
              label: 'View Guide',
              href: '/setup/first-message',
            }
          : undefined,
      },
      {
        id: 'webhook',
        name: 'Configure Webhook',
        completed: org._count.webhooks > 0,
        action:
          org._count.webhooks === 0
            ? {
                label: 'Add Webhook',
                href: '/dashboard/webhooks',
              }
            : undefined,
      },
      {
        id: 'api_key',
        name: 'Generate API Key',
        completed: org._count.apiKeys > 0,
        action:
          org._count.apiKeys === 0
            ? {
                label: 'Create Key',
                href: '/dashboard/api-keys',
              }
            : undefined,
      },
    ];

    const completedCount = steps.filter((step) => step.completed).length;
    const percentComplete = Math.round((completedCount / steps.length) * 100);

    return {
      steps,
      percentComplete,
    };
  }

  async markComplete(organizationId: string): Promise<void> {
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        onboardingCompletedAt: new Date(),
      },
    });
  }

  async isComplete(organizationId: string): Promise<boolean> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { onboardingCompletedAt: true },
    });

    return !!org?.onboardingCompletedAt;
  }
}

export const onboardingService = new OnboardingService();

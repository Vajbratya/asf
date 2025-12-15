import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { WebhookService } from '../services/webhooks.js';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { encrypt, decrypt } from '../lib/crypto';

const prisma = new PrismaClient();
const webhookService = new WebhookService();
const webhooksRouter = new Hono();

// Apply authentication to all routes
webhooksRouter.use('*', authMiddleware);

// Apply rate limiting (100 requests per minute)
webhooksRouter.use('*', rateLimitMiddleware({ limit: 100, window: 60 }));

const WebhookSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  secret: z.string(),
  events: z.array(z.string()),
  filters: z.record(z.any()).optional(),
  active: z.boolean().optional(),
});

// List webhooks
webhooksRouter.get('/', async (c) => {
  const organizationId = c.req.header('X-Organization-ID') || 'default';
  const webhooks = await prisma.webhook.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  // Remove secrets from response
  const webhooksWithoutSecrets = webhooks.map(({ secret, ...webhook }) => webhook);

  return c.json({ webhooks: webhooksWithoutSecrets });
});

// Create webhook
webhooksRouter.post('/', async (c) => {
  const organizationId = c.req.header('X-Organization-ID') || 'default';
  const body = await c.req.json();
  const validated = WebhookSchema.parse(body);

  // Encrypt the webhook secret before storing
  const encryptedSecret = encrypt(validated.secret);

  const webhook = await prisma.webhook.create({
    data: {
      ...validated,
      secret: encryptedSecret,
      organizationId,
    },
  });

  // Don't return the secret in the response
  const { secret, ...webhookWithoutSecret } = webhook;

  return c.json(webhookWithoutSecret, 201);
});

// Update webhook
webhooksRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const validated = WebhookSchema.partial().parse(body);

  // Encrypt secret if it's being updated
  const dataToUpdate = { ...validated };
  if (validated.secret) {
    dataToUpdate.secret = encrypt(validated.secret);
  }

  const webhook = await prisma.webhook.update({
    where: { id },
    data: dataToUpdate,
  });

  // Don't return the secret in the response
  const { secret, ...webhookWithoutSecret } = webhook;

  return c.json(webhookWithoutSecret);
});

// Delete webhook
webhooksRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await prisma.webhook.delete({ where: { id } });
  return c.json({ success: true });
});

// Manually trigger delivery
webhooksRouter.post('/deliveries/:id/retry', async (c) => {
  const id = c.req.param('id');
  const result = await webhookService.deliverToWebhook(id);
  return c.json(result);
});

export { webhooksRouter };

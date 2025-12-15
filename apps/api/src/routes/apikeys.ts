import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();
const apikeysRouter = new Hono();

// Apply authentication middleware to all routes
apikeysRouter.use('*', authMiddleware);

// List API keys
apikeysRouter.get('/', async (c) => {
  const organizationId = c.req.header('X-Organization-ID') || 'default';
  const apiKeys = await prisma.apiKey.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  // Mask keys in response
  const maskedKeys = apiKeys.map((key) => ({
    ...key,
    key: `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`,
  }));

  return c.json({ apiKeys: maskedKeys });
});

// Generate new API key
apikeysRouter.post('/', async (c) => {
  const organizationId = c.req.header('X-Organization-ID') || 'default';
  const body = await c.req.json();

  // Generate random API key
  const key = `sk_${randomBytes(32).toString('hex')}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      name: body.name || 'Unnamed Key',
      key,
      organizationId,
    },
  });

  return c.json(apiKey, 201);
});

// Revoke API key
apikeysRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await prisma.apiKey.update({
    where: { id },
    data: { active: false },
  });
  return c.json({ success: true });
});

// Verify API key (for internal use)
apikeysRouter.post('/verify', async (c) => {
  const body = await c.req.json();
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: body.key },
    include: { organization: true },
  });

  if (!apiKey || !apiKey.active) {
    return c.json({ valid: false }, 401);
  }

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return c.json({
    valid: true,
    organizationId: apiKey.organizationId,
    organization: apiKey.organization,
  });
});

export { apikeysRouter };

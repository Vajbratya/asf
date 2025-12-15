import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';

const organizations = new Hono();

const createOrgSchema = z.object({
  name: z.string().min(1),
  cnpj: z.string().optional(),
  type: z.enum(['HOSPITAL', 'CLINIC', 'LAB', 'PHARMACY', 'OTHER']),
});

organizations.get('/', async (c) => {
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        _count: {
          select: { users: true, connectors: true },
        },
      },
    });
    return c.json(orgs);
  } catch (error) {
    return c.json({ error: 'Failed to fetch organizations' }, 500);
  }
});

organizations.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const data = createOrgSchema.parse(body);

    const org = await prisma.organization.create({
      data,
    });

    return c.json(org, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to create organization' }, 500);
  }
});

organizations.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: true,
        connectors: true,
      },
    });

    if (!org) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    return c.json(org);
  } catch (error) {
    return c.json({ error: 'Failed to fetch organization' }, 500);
  }
});

export default organizations;

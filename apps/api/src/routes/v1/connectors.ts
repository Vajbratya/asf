import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';

const connectors = new Hono();

connectors.get('/', async (c) => {
  try {
    const connectors = await prisma.connector.findMany({
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });
    return c.json(connectors);
  } catch (error) {
    return c.json({ error: 'Failed to fetch connectors' }, 500);
  }
});

connectors.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const connector = await prisma.connector.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });

    if (!connector) {
      return c.json({ error: 'Connector not found' }, 404);
    }

    return c.json(connector);
  } catch (error) {
    return c.json({ error: 'Failed to fetch connector' }, 500);
  }
});

export default connectors;

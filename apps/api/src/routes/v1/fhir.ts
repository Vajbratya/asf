import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';

const fhir = new Hono();

fhir.get('/', (c) => {
  return c.json({
    resourceType: 'CapabilityStatement',
    status: 'active',
    date: new Date().toISOString(),
    kind: 'instance',
    fhirVersion: '4.0.1',
    format: ['application/fhir+json'],
    rest: [
      {
        mode: 'server',
        resource: [
          { type: 'Patient' },
          { type: 'Observation' },
          { type: 'Practitioner' },
          { type: 'Organization' },
        ],
      },
    ],
  });
});

fhir.get('/:resourceType', async (c) => {
  try {
    const resourceType = c.req.param('resourceType');

    const resources = await prisma.fhirResource.findMany({
      where: { resourceType },
    });

    return c.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: resources.length,
      entry: resources.map((r) => ({
        resource: r.data,
      })),
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch FHIR resources' }, 500);
  }
});

fhir.get('/:resourceType/:id', async (c) => {
  try {
    const resourceType = c.req.param('resourceType');
    const resourceId = c.req.param('id');

    const resource = await prisma.fhirResource.findUnique({
      where: {
        resourceType_resourceId: {
          resourceType,
          resourceId,
        },
      },
    });

    if (!resource) {
      return c.json({ error: 'Resource not found' }, 404);
    }

    return c.json(resource.data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch FHIR resource' }, 500);
  }
});

export default fhir;

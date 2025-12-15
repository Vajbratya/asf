import { Hono } from 'hono';
import organizationsRouter from './organizations';
import connectorsRouter from './connectors';
import fhirRouter from './fhir';
import jobsRouter from './jobs';

const v1 = new Hono();

v1.get('/', (c) => {
  return c.json({
    message: 'IntegraSaúde API v1',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      organizations: '/api/v1/organizations',
      connectors: '/api/v1/connectors',
      fhir: '/api/v1/fhir',
      jobs: '/api/v1/jobs',
    },
  });
});

v1.route('/organizations', organizationsRouter);
v1.route('/connectors', connectorsRouter);
v1.route('/fhir', fhirRouter);
v1.route('/jobs', jobsRouter);

export default v1;

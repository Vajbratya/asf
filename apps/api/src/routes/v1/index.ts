import { Hono } from 'hono';
import organizationsRouter from './organizations';
import connectorsRouter from './connectors';
import fhirRouter from './fhir';
import jobsRouter from './jobs';
import { authMiddleware } from '../../middleware/auth';
import { billing } from '../billing';
import setupRouter from '../setup';
import onboardingRouter from '../onboarding';

const v1 = new Hono();

// Apply authentication to all v1 routes
v1.use('*', authMiddleware);

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
      billing: '/api/v1/billing',
      setup: '/api/v1/setup',
      onboarding: '/api/v1/onboarding',
    },
  });
});

v1.route('/organizations', organizationsRouter);
v1.route('/connectors', connectorsRouter);
v1.route('/fhir', fhirRouter);
v1.route('/jobs', jobsRouter);
v1.route('/billing', billing);
v1.route('/setup', setupRouter);
v1.route('/onboarding', onboardingRouter);

export default v1;

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mock connectors
app.get('/api/v1/connectors', (c) => {
  return c.json({
    connectors: [
      { id: '1', name: 'Tasy', type: 'HL7', status: 'active' },
      { id: '2', name: 'MV Soul', type: 'FHIR', status: 'active' },
      { id: '3', name: 'Pixeon', type: 'HL7', status: 'pending' },
    ],
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

const port = process.env.PORT || 10000;
console.log(`Server running on port ${port}`);

serve({
  fetch: app.fetch,
  port: Number(port),
});

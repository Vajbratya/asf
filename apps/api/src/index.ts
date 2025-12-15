import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import healthRouter from './routes/health';
import v1Router from './routes/v1';
import { stripeWebhook } from './routes/stripe-webhook';
import { errorHandler } from './middleware/error-handler';
import { env, getAllowedOrigins } from './lib/env';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use(
  '*',
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
  })
);

// Routes
app.route('/health', healthRouter);
app.route('/webhooks/stripe', stripeWebhook);
app.route('/api/v1', v1Router);

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

console.log(`Server is running on port ${env.PORT}`);

serve({
  fetch: app.fetch,
  port: env.PORT,
});

export default app;

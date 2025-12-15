import { Hono } from 'hono';
import { queue } from '../../lib/upstash';

const jobs = new Hono();

// Endpoint to receive QStash job callbacks
jobs.post('/process-message', async (c) => {
  try {
    const body = await c.req.json();
    console.log('Processing queued message:', body);

    // Process the message here
    // This would typically handle message transformation, routing, etc.

    return c.json({ success: true, processed: body });
  } catch (error) {
    console.error('Job processing error:', error);
    return c.json({ error: 'Failed to process job' }, 500);
  }
});

// Endpoint to queue a new job
jobs.post('/queue', async (c) => {
  try {
    const body = await c.req.json();
    const { url, payload, delay } = body;

    const result = await queue.publish({
      url,
      body: payload,
      delay,
    });

    if (!result) {
      return c.json({ error: 'Failed to queue job' }, 500);
    }

    return c.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Job queue error:', error);
    return c.json({ error: 'Failed to queue job' }, 500);
  }
});

// List scheduled jobs
jobs.get('/schedules', async (c) => {
  try {
    const schedules = await queue.listSchedules();
    return c.json(schedules);
  } catch (error) {
    console.error('Failed to list schedules:', error);
    return c.json({ error: 'Failed to list schedules' }, 500);
  }
});

// Create a scheduled job
jobs.post('/schedules', async (c) => {
  try {
    const body = await c.req.json();
    const { url, cron, payload } = body;

    const result = await queue.schedule({
      url,
      cron,
      body: payload,
    });

    if (!result) {
      return c.json({ error: 'Failed to create schedule' }, 500);
    }

    return c.json({ success: true, scheduleId: result.scheduleId });
  } catch (error) {
    console.error('Schedule creation error:', error);
    return c.json({ error: 'Failed to create schedule' }, 500);
  }
});

export default jobs;

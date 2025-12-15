import { Redis } from '@upstash/redis';
import { Client as QStashClient } from '@upstash/qstash';

// Redis client for caching and session management
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// QStash client for job queue and scheduled tasks
export const qstash = new QStashClient({
  token: process.env.QSTASH_TOKEN!,
});

// Cache utilities
export const cache = {
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get<T>(key);
      return value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Set a value in cache with optional TTL (in seconds)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      // Upstash Redis client handles JSON serialization automatically
      // Only stringify if the value is not already a string to avoid double encoding
      const serializedValue = typeof value === 'string' ? value : value;

      if (ttl) {
        await redis.setex(key, ttl, serializedValue);
      } else {
        await redis.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    try {
      const result = await redis.incr(key);
      return result;
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  },

  /**
   * Set expiration on a key (in seconds)
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      await redis.expire(key, seconds);
      return true;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  },
};

// Queue utilities for background jobs
export const queue = {
  /**
   * Publish a message to QStash for delayed/scheduled processing
   */
  async publish(params: {
    url: string;
    body: unknown;
    delay?: number;
    headers?: Record<string, string>;
  }): Promise<{ messageId: string } | null> {
    try {
      const result = await qstash.publishJSON({
        url: params.url,
        body: params.body,
        delay: params.delay,
        headers: params.headers,
      });
      return { messageId: result.messageId };
    } catch (error) {
      console.error('Queue publish error:', error);
      return null;
    }
  },

  /**
   * Schedule a recurring job with cron syntax
   */
  async schedule(params: {
    url: string;
    cron: string;
    body?: unknown;
  }): Promise<{ scheduleId: string } | null> {
    try {
      const result = await qstash.schedules.create({
        destination: params.url,
        cron: params.cron,
        body: params.body ? JSON.stringify(params.body) : undefined,
      });
      return { scheduleId: result.scheduleId };
    } catch (error) {
      console.error('Queue schedule error:', error);
      return null;
    }
  },

  /**
   * List all schedules
   */
  async listSchedules() {
    try {
      const schedules = await qstash.schedules.list();
      return schedules;
    } catch (error) {
      console.error('Queue list schedules error:', error);
      return [];
    }
  },

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<boolean> {
    try {
      await qstash.schedules.delete(scheduleId);
      return true;
    } catch (error) {
      console.error('Queue delete schedule error:', error);
      return false;
    }
  },
};

// Session utilities using Redis
export const session = {
  /**
   * Create a new session
   */
  async create(userId: string, data: Record<string, unknown>, ttl = 86400): Promise<string> {
    const sessionId = `session:${crypto.randomUUID()}`;
    // Upstash Redis client handles JSON serialization automatically
    await redis.setex(sessionId, ttl, { userId, ...data });
    return sessionId;
  },

  /**
   * Get session data
   */
  async get(sessionId: string): Promise<Record<string, unknown> | null> {
    // Upstash Redis client handles JSON deserialization automatically
    const data = await redis.get<Record<string, unknown>>(sessionId);
    return data;
  },

  /**
   * Update session data
   */
  async update(sessionId: string, data: Record<string, unknown>): Promise<boolean> {
    const existing = await session.get(sessionId);
    if (!existing) return false;

    const ttl = await redis.ttl(sessionId);
    // Upstash Redis client handles JSON serialization automatically
    await redis.setex(sessionId, ttl > 0 ? ttl : 86400, { ...existing, ...data });
    return true;
  },

  /**
   * Delete a session
   */
  async destroy(sessionId: string): Promise<boolean> {
    await redis.del(sessionId);
    return true;
  },

  /**
   * Refresh session TTL
   */
  async refresh(sessionId: string, ttl = 86400): Promise<boolean> {
    await redis.expire(sessionId, ttl);
    return true;
  },
};

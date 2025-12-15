import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { redis } from '../lib/upstash';
import { getAuth } from './auth';

interface RateLimitConfig {
  limit: number; // Max requests
  window: number; // Time window in seconds
  keyPrefix?: string; // Optional prefix for Redis keys
}

/**
 * Rate limiting middleware using Upstash Redis
 * Provides distributed rate limiting across multiple instances
 *
 * Default limits:
 * - API keys: 100 requests/minute
 * - Internal (authenticated sessions): 1000 requests/minute
 * - Unauthenticated: 20 requests/minute
 */
export const rateLimitMiddleware = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    const auth = getAuth(c);
    const identifier = getIdentifier(c, auth);
    const keyPrefix = config.keyPrefix || 'ratelimit';
    const redisKey = `${keyPrefix}:${identifier}`;

    const now = Date.now();
    const windowMs = config.window * 1000;
    const resetAt = now + windowMs;

    try {
      // Use Redis INCR for atomic increment
      const count = await redis.incr(redisKey);

      if (count === 1) {
        // First request in this window, set expiration
        await redis.pexpire(redisKey, windowMs);
      }

      // Check if rate limit exceeded
      if (count > config.limit) {
        const ttl = await redis.pttl(redisKey);
        const retryAfter = Math.ceil((ttl || windowMs) / 1000);

        c.header('Retry-After', retryAfter.toString());
        c.header('X-RateLimit-Limit', config.limit.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', new Date(now + (ttl || windowMs)).toISOString());

        throw new HTTPException(429, {
          message: 'Too many requests. Please try again later.',
        });
      }

      // Get TTL for reset time
      const ttl = await redis.pttl(redisKey);
      const remaining = Math.max(0, config.limit - count);

      // Set rate limit headers
      c.header('X-RateLimit-Limit', config.limit.toString());
      c.header('X-RateLimit-Remaining', remaining.toString());
      c.header('X-RateLimit-Reset', new Date(now + (ttl || windowMs)).toISOString());

      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      // If Redis fails, log error but don't block requests
      console.error('Rate limiting error:', error);
      await next();
    }
  };
};

/**
 * Get identifier for rate limiting
 * Priority: API key > Session > Organization > IP address
 */
function getIdentifier(
  c: Context,
  auth?: { organizationId: string; userId?: string; authType: string }
): string {
  // Use API key ID if available
  const apiKeyId = c.get('apiKeyId');
  if (apiKeyId) {
    return `apikey:${apiKeyId}`;
  }

  // Use auth context if available
  if (auth) {
    if (auth.authType === 'api-key') {
      return `org:${auth.organizationId}`;
    }
    if (auth.authType === 'session' && auth.userId) {
      return `user:${auth.userId}`;
    }
  }

  // Fall back to IP address
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown';
  return `ip:${ip}`;
}

/**
 * Preset rate limit configurations
 */
export const RateLimits = {
  /**
   * For API key authentication: 100 requests per minute
   */
  apiKey: {
    limit: 100,
    window: 60,
    keyPrefix: 'ratelimit:apikey',
  },

  /**
   * For internal authenticated sessions: 1000 requests per minute
   */
  internal: {
    limit: 1000,
    window: 60,
    keyPrefix: 'ratelimit:internal',
  },

  /**
   * For unauthenticated requests: 20 requests per minute
   */
  public: {
    limit: 20,
    window: 60,
    keyPrefix: 'ratelimit:public',
  },

  /**
   * Strict rate limit: 10 requests per minute (for sensitive endpoints)
   */
  strict: {
    limit: 10,
    window: 60,
    keyPrefix: 'ratelimit:strict',
  },
};

/**
 * Adaptive rate limiting based on authentication type
 */
export const adaptiveRateLimit = async (c: Context, next: Next) => {
  const auth = getAuth(c);

  let config: RateLimitConfig;

  if (auth) {
    if (auth.authType === 'api-key') {
      config = RateLimits.apiKey;
    } else {
      config = RateLimits.internal;
    }
  } else {
    config = RateLimits.public;
  }

  return rateLimitMiddleware(config)(c, next);
};

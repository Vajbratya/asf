import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { redis } from '../lib/upstash';

/**
 * Authentication context that will be set by the middleware
 */
export interface AuthContext {
  organizationId: string;
  userId?: string;
  authType: 'api-key' | 'session';
}

/**
 * API Key format in Redis:
 * Key: api-key:{keyId}
 * Value: { organizationId: string, userId?: string, name: string, createdAt: number, lastUsedAt?: number }
 */
interface ApiKeyData {
  organizationId: string;
  userId?: string;
  name: string;
  createdAt: number;
  lastUsedAt?: number;
  disabled?: boolean;
}

/**
 * Session format in Redis:
 * Key: session:{sessionId}
 * Value: { organizationId: string, userId: string, ... }
 */
interface SessionData {
  organizationId: string;
  userId: string;
  [key: string]: unknown;
}

/**
 * Authentication middleware
 * Supports two authentication methods:
 * 1. API Key via X-API-Key header
 * 2. Session token via Authorization: Bearer <token> header
 */
export async function authMiddleware(c: Context, next: Next) {
  const apiKey = c.req.header('X-API-Key');
  const authHeader = c.req.header('Authorization');

  // Try API Key authentication first
  if (apiKey) {
    await authenticateApiKey(c, apiKey);
    return next();
  }

  // Try session token authentication
  if (authHeader?.startsWith('Bearer ')) {
    const sessionToken = authHeader.substring(7);
    await authenticateSession(c, sessionToken);
    return next();
  }

  // No valid authentication provided
  throw new HTTPException(401, {
    message:
      'Authentication required. Provide either X-API-Key or Authorization: Bearer <token> header.',
  });
}

/**
 * Authenticate using API Key
 */
async function authenticateApiKey(c: Context, apiKey: string): Promise<void> {
  // Validate API key format (should be a UUID or similar)
  if (!apiKey || apiKey.length < 32) {
    throw new HTTPException(401, {
      message: 'Invalid API key format',
    });
  }

  // Check if API key exists in Redis
  const keyData = await redis.get<ApiKeyData>(`api-key:${apiKey}`);

  if (!keyData) {
    throw new HTTPException(401, {
      message: 'Invalid API key',
    });
  }

  // Check if API key is disabled
  if (keyData.disabled) {
    throw new HTTPException(401, {
      message: 'API key has been disabled',
    });
  }

  // Update last used timestamp (fire and forget)
  redis
    .hset(`api-key:${apiKey}`, {
      lastUsedAt: Date.now(),
    })
    .catch((error) => {
      console.error('Failed to update API key last used timestamp:', error);
    });

  // Set auth context
  c.set('auth', {
    organizationId: keyData.organizationId,
    userId: keyData.userId,
    authType: 'api-key',
  } as AuthContext);

  // Set legacy context for backward compatibility
  c.set('organizationId', keyData.organizationId);
  c.set('orgId', keyData.organizationId);
}

/**
 * Authenticate using session token
 */
async function authenticateSession(c: Context, sessionToken: string): Promise<void> {
  // Validate session token format
  if (!sessionToken || sessionToken.length < 32) {
    throw new HTTPException(401, {
      message: 'Invalid session token format',
    });
  }

  // Check if session exists in Redis
  const sessionData = await redis.get<SessionData>(sessionToken);

  if (!sessionData) {
    throw new HTTPException(401, {
      message: 'Invalid or expired session',
    });
  }

  // Validate required session fields
  if (!sessionData.organizationId || !sessionData.userId) {
    throw new HTTPException(401, {
      message: 'Invalid session data',
    });
  }

  // Set auth context
  c.set('auth', {
    organizationId: sessionData.organizationId,
    userId: sessionData.userId,
    authType: 'session',
  } as AuthContext);

  // Set legacy context for backward compatibility
  c.set('organizationId', sessionData.organizationId);
  c.set('orgId', sessionData.organizationId);
}

/**
 * Require authentication middleware
 * Throws 401 if no valid authentication is found
 */
export async function requireAuth(c: Context, next: Next) {
  await authMiddleware(c, next);
}

/**
 * Optional authentication middleware
 * Sets auth context if valid authentication is found, but doesn't throw if missing
 */
export async function optionalAuth(c: Context, next: Next) {
  try {
    await authMiddleware(c, next);
  } catch (error) {
    if (error instanceof HTTPException && error.status === 401) {
      // Authentication failed, but that's okay for optional auth
      return next();
    }
    throw error;
  }
}

/**
 * Get auth context from request
 */
export function getAuth(c: Context): AuthContext | undefined {
  return c.get('auth') as AuthContext | undefined;
}

/**
 * Require auth context to exist
 * @throws HTTPException if auth context is not set
 */
export function requireAuthContext(c: Context): AuthContext {
  const auth = getAuth(c);
  if (!auth) {
    throw new HTTPException(401, {
      message: 'Authentication required',
    });
  }
  return auth;
}

// Legacy exports for backward compatibility
export const optionalAuthMiddleware = optionalAuth;

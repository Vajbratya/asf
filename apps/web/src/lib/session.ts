import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

const SESSION_COOKIE_NAME = 'integrasaude-session';

// Validate SESSION_SECRET at startup
if (!process.env.WORKOS_COOKIE_PASSWORD) {
  throw new Error(
    'WORKOS_COOKIE_PASSWORD environment variable is required and must be at least 32 characters long'
  );
}

if (process.env.WORKOS_COOKIE_PASSWORD.length < 32) {
  throw new Error(
    'WORKOS_COOKIE_PASSWORD must be at least 32 characters long for security. Current length: ' +
      process.env.WORKOS_COOKIE_PASSWORD.length
  );
}

const SESSION_SECRET = new TextEncoder().encode(process.env.WORKOS_COOKIE_PASSWORD);

export interface SessionData {
  userId: string;
  email: string;
  name?: string;
  organizationId?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export async function createSession(data: SessionData): Promise<string> {
  const token = await new SignJWT({ data })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SESSION_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload.data as SessionData;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

export async function updateSession(data: Partial<SessionData>): Promise<void> {
  const currentSession = await getSession();
  if (!currentSession) {
    throw new Error('No active session');
  }

  await createSession({
    ...currentSession,
    ...data,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

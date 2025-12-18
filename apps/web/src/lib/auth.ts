import { WorkOS } from '@workos-inc/node';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Lazy initialization to allow build without env vars
let workosInstance: WorkOS | null = null;

function getWorkOS(): WorkOS {
  if (!workosInstance) {
    if (!process.env.WORKOS_API_KEY) {
      throw new Error('WORKOS_API_KEY environment variable is required');
    }
    workosInstance = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workosInstance;
}

function getClientId(): string {
  if (!process.env.WORKOS_CLIENT_ID) {
    throw new Error('WORKOS_CLIENT_ID environment variable is required');
  }
  return process.env.WORKOS_CLIENT_ID;
}

const secretKey = new TextEncoder().encode(
  process.env.WORKOS_COOKIE_PASSWORD || 'default-secret-key-change-in-production'
);

export interface Session {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export async function getAuthorizationUrl(redirectUri?: string) {
  const authorizationUrl = getWorkOS().userManagement.getAuthorizationUrl({
    provider: 'authkit',
    clientId: getClientId(),
    redirectUri:
      redirectUri || process.env.WORKOS_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
  });
  return authorizationUrl;
}

export async function authenticateWithCode(code: string) {
  const { user, accessToken, refreshToken } = await getWorkOS().userManagement.authenticateWithCode(
    {
      code,
      clientId: getClientId(),
    }
  );
  return { user, accessToken, refreshToken };
}

export async function createSession(user: Session['user']): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
  return token;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, secretKey);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export { getWorkOS as workos };

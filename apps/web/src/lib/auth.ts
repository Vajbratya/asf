import { WorkOS } from '@workos-inc/node';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID!;

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
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: 'authkit',
    clientId,
    redirectUri:
      redirectUri || process.env.WORKOS_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
  });
  return authorizationUrl;
}

export async function authenticateWithCode(code: string) {
  const { user, accessToken, refreshToken } = await workos.userManagement.authenticateWithCode({
    code,
    clientId,
  });
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

export { workos };

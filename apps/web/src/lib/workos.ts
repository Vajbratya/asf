import { WorkOS } from '@workos-inc/node';

if (!process.env.WORKOS_API_KEY) {
  throw new Error('WORKOS_API_KEY is required');
}

if (!process.env.WORKOS_CLIENT_ID) {
  throw new Error('WORKOS_CLIENT_ID is required');
}

export const workos = new WorkOS(process.env.WORKOS_API_KEY);

export const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID;
export const WORKOS_REDIRECT_URI =
  process.env.WORKOS_REDIRECT_URI || 'http://localhost:3000/auth/callback';

export async function getAuthorizationUrl(params?: {
  state?: string;
  provider?: string;
  connection?: string;
  organization?: string;
}) {
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    clientId: WORKOS_CLIENT_ID,
    redirectUri: WORKOS_REDIRECT_URI,
    state: params?.state,
    provider: params?.provider,
    connectionId: params?.connection,
    organizationId: params?.organization,
  });

  return authorizationUrl;
}

export async function authenticateWithCode(code: string) {
  try {
    const { user, accessToken, refreshToken } = await workos.userManagement.authenticateWithCode({
      clientId: WORKOS_CLIENT_ID,
      code,
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

export async function getUser(accessToken: string) {
  try {
    const user = await workos.userManagement.getUser(accessToken);
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await workos.userManagement.authenticateWithRefreshToken({
        clientId: WORKOS_CLIENT_ID,
        refreshToken,
      });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
}

export async function revokeSession(accessToken: string) {
  try {
    await workos.userManagement.revokeSession({
      sessionId: accessToken,
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    throw error;
  }
}

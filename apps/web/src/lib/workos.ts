import { WorkOS } from '@workos-inc/node';

// Lazy initialization to allow build without env vars
let workosInstance: WorkOS | null = null;

function getWorkOS(): WorkOS {
  if (!workosInstance) {
    if (!process.env.WORKOS_API_KEY) {
      throw new Error('WORKOS_API_KEY is required');
    }
    workosInstance = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workosInstance;
}

function getClientId(): string {
  if (!process.env.WORKOS_CLIENT_ID) {
    throw new Error('WORKOS_CLIENT_ID is required');
  }
  return process.env.WORKOS_CLIENT_ID;
}

export const workos = {
  get instance() {
    return getWorkOS();
  },
  userManagement: {
    getAuthorizationUrl: (...args: Parameters<WorkOS['userManagement']['getAuthorizationUrl']>) =>
      getWorkOS().userManagement.getAuthorizationUrl(...args),
    authenticateWithCode: (...args: Parameters<WorkOS['userManagement']['authenticateWithCode']>) =>
      getWorkOS().userManagement.authenticateWithCode(...args),
    getUser: (...args: Parameters<WorkOS['userManagement']['getUser']>) =>
      getWorkOS().userManagement.getUser(...args),
    authenticateWithRefreshToken: (
      ...args: Parameters<WorkOS['userManagement']['authenticateWithRefreshToken']>
    ) => getWorkOS().userManagement.authenticateWithRefreshToken(...args),
    revokeSession: (...args: Parameters<WorkOS['userManagement']['revokeSession']>) =>
      getWorkOS().userManagement.revokeSession(...args),
  },
};

export const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID || '';
export const WORKOS_REDIRECT_URI =
  process.env.WORKOS_REDIRECT_URI || 'https://integrabrasil.vercel.app/api/auth/callback';

export async function getAuthorizationUrl(params?: {
  state?: string;
  provider?: string;
  connection?: string;
  organization?: string;
}) {
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    clientId: getClientId(),
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
      clientId: getClientId(),
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
        clientId: getClientId(),
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

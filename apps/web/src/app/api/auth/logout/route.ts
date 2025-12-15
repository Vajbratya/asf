import { NextRequest, NextResponse } from 'next/server';
import { destroySession, getSession } from '@/lib/session';
import { revokeSession } from '@/lib/workos';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (session?.accessToken) {
      // Revoke WorkOS session
      await revokeSession(session.accessToken).catch((err) =>
        console.error('Failed to revoke WorkOS session:', err)
      );
    }

    // Destroy local session
    await destroySession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}

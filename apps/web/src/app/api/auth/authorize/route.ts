import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/auth';

export async function GET() {
  try {
    const authorizationUrl = await getAuthorizationUrl();
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error('Authorization error:', error);
    return NextResponse.redirect(
      new URL(
        '/login?error=auth_failed',
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      )
    );
  }
}

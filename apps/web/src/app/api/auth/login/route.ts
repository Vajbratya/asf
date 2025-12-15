import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/workos';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider');
    const organization = searchParams.get('organization');

    const authUrl = await getAuthorizationUrl({
      provider: provider || undefined,
      organization: organization || undefined,
      state: crypto.randomUUID(),
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Login redirect error:', error);
    return NextResponse.json({ error: 'Failed to initialize authentication' }, { status: 500 });
  }
}

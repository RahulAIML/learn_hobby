import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { toPublicUser } from '@/lib/auth/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'unauthenticated', message: 'Not signed in.' } }, { status: 401 });
  }
  return NextResponse.json({ success: true, user: toPublicUser(user) });
}

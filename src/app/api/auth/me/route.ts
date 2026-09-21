import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'unauthenticated', message: 'Not signed in.' } }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, enrollments: user.enrollments },
  });
}

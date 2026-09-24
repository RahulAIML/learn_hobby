import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getUserById, updateProfile } from '@/lib/auth/store';
import { toPublicUser } from '@/lib/auth/types';
import { profileUpdateSchema } from '@/lib/profile/validation';

export const runtime = 'nodejs';

/**
 * The authenticated student's own profile only. `id` always comes from the
 * signed session, never from the request body or a query param — a student
 * can never read or edit another student's profile this way.
 */
export async function GET(req: NextRequest) {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: { code: 'unauthenticated', message: 'Please sign in.' } }, { status: 401 });
  }
  const user = await getUserById(sessionUser.id);
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'not_found', message: 'User not found.' } }, { status: 404 });
  }
  return NextResponse.json({ success: true, profile: toPublicUser(user) });
}

export async function PATCH(req: NextRequest) {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: { code: 'unauthenticated', message: 'Please sign in.' } }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Invalid request body.' } }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid profile data.' } },
      { status: 400 }
    );
  }

  const result = await updateProfile(sessionUser.id, parsed.data);
  if ('error' in result) {
    return NextResponse.json({ success: false, error: { code: result.error, message: 'User not found.' } }, { status: 404 });
  }

  return NextResponse.json({ success: true, profile: toPublicUser(result.user) });
}

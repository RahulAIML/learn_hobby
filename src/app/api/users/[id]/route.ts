import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { getUserById, updateUser, type UpdateUserError } from '@/lib/auth/store';
import { toPublicUser } from '@/lib/auth/types';

export const runtime = 'nodejs';

interface RouteParams {
  params: { id: string };
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/** A signed-in user may read their own profile, or (once real admin auth exists) an admin's. For now: self only. */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return errorResponse('unauthenticated', 'Please sign in.', 401);
  if (sessionUser.id !== params.id && sessionUser.role !== 'admin') {
    return errorResponse('forbidden', 'You can only view your own profile.', 403);
  }

  const user = await getUserById(params.id);
  if (!user) return errorResponse('user_not_found', 'User not found.', 404);

  return NextResponse.json({ success: true, user: toPublicUser(user) });
}

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  mobile: z.string().nullable().optional(),
  phoneNo: z.string().nullable().optional(),
});

const ERROR_MESSAGES: Record<UpdateUserError, string> = {
  invalid_name: 'Please enter a valid name.',
  invalid_mobile: 'Please enter a valid phone number (7-15 digits, optional leading +).',
  user_not_found: 'User not found.',
};

/** A signed-in user may update their own profile (name/mobile/phoneNo only — not email/username/password here). */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return errorResponse('unauthenticated', 'Please sign in.', 401);
  if (sessionUser.id !== params.id && sessionUser.role !== 'admin') {
    return errorResponse('forbidden', 'You can only update your own profile.', 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('invalid_request', 'Could not read the request body.', 400);
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('invalid_request', 'Malformed fields.', 400);
  }

  const result = await updateUser(params.id, parsed.data);
  if ('error' in result) {
    const status = result.error === 'user_not_found' ? 404 : 400;
    return errorResponse(result.error, ERROR_MESSAGES[result.error], status);
  }

  return NextResponse.json({ success: true, user: toPublicUser(result.user) });
}

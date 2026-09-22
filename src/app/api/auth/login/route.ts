import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByEmail, listEnrollments, recordLogin } from '@/lib/auth/store';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session';
import { toPublicUser } from '@/lib/auth/types';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Could not read the request body.' } }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Email and password are required.' } }, { status: 400 });
  }

  const user = await getUserByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ success: false, error: { code: 'invalid_credentials', message: 'Incorrect email or password.' } }, { status: 401 });
  }

  await recordLogin(user.id);
  const token = createSessionToken(toPublicUser(user), await listEnrollments(user.id));
  const res = NextResponse.json({ success: true, user: toPublicUser(user) });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}

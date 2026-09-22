import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser, enrollUser, type CreateUserError } from '@/lib/auth/store';
import { getCourse } from '@/lib/courses/store';
import { toPublicUser } from '@/lib/auth/types';

export const runtime = 'nodejs';

const createUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().min(1),
  password: z.string().min(1),
  name: z.string().min(1),
  mobile: z.string().optional(),
  phoneNo: z.string().optional(),
});

const ERROR_MESSAGES: Record<CreateUserError, string> = {
  invalid_username: 'Username must be 3-32 characters (letters, numbers, underscore, period, hyphen only).',
  invalid_email: 'Please enter a valid email address.',
  invalid_password: 'Password must be at least 6 characters.',
  invalid_name: 'Please enter a valid name.',
  invalid_mobile: 'Please enter a valid phone number (7-15 digits, optional leading +).',
  username_taken: 'That username is already taken.',
  email_taken: 'An account with that email already exists.',
};

/**
 * Create a user. This is the registration flow — POST /api/users, not a
 * duplicate of /api/auth/login (which only authenticates existing users).
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Could not read the request body.' } }, { status: 400 });
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Missing or malformed fields.' } }, { status: 400 });
  }

  const result = await createUser(parsed.data);
  if ('error' in result) {
    return NextResponse.json({ success: false, error: { code: result.error, message: ERROR_MESSAGES[result.error] } }, { status: 400 });
  }

  // No enrollment-selection UI exists yet — new self-registered students are
  // auto-enrolled in the flagship demo course if it exists, so signup leads
  // to something usable rather than an empty account. Real per-course
  // enrollment selection is a separate feature, not part of this one.
  const flagshipCourse = await getCourse('data-science');
  if (flagshipCourse) {
    await enrollUser(result.user.id, flagshipCourse.slug);
  }

  return NextResponse.json({ success: true, user: toPublicUser(result.user) }, { status: 201 });
}

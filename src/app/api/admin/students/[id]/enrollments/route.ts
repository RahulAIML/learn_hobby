import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { enrollUser, getUserById, listEnrollments } from '@/lib/auth/store';
import { getCourse } from '@/lib/courses/store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const student = await getUserById(params.id);
  if (!student || student.role !== 'student') {
    return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Student not found.' } }, { status: 404 });
  }

  const enrollments = await listEnrollments(params.id);
  return NextResponse.json({ success: true, enrollments });
}

const enrollSchema = z.object({ courseSlug: z.string().trim().min(1) });

/** Admin: enroll a student in a course. Idempotent — re-enrolling is a no-op (see enrollUser's onConflictDoNothing). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const student = await getUserById(params.id);
  if (!student || student.role !== 'student') {
    return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Student not found.' } }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Invalid request body.' } }, { status: 400 });
  }

  const parsed = enrollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: 'validation_error', message: 'A courseSlug is required.' } }, { status: 400 });
  }

  const course = await getCourse(parsed.data.courseSlug);
  if (!course) {
    return NextResponse.json({ success: false, error: { code: 'course_not_found', message: 'Course not found.' } }, { status: 404 });
  }

  await enrollUser(params.id, parsed.data.courseSlug);
  const enrollments = await listEnrollments(params.id);
  return NextResponse.json({ success: true, enrollments }, { status: 201 });
}

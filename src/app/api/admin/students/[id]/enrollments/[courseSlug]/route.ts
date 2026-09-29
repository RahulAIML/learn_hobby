import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { getUserById, unenrollUser } from '@/lib/auth/store';

export const runtime = 'nodejs';

/** Admin: remove a student's enrollment in a course. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string; courseSlug: string } }) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const student = await getUserById(params.id);
  if (!student || student.role !== 'student') {
    return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Student not found.' } }, { status: 404 });
  }

  const removed = await unenrollUser(params.id, params.courseSlug);
  if (!removed) {
    return NextResponse.json({ success: false, error: { code: 'not_enrolled', message: 'Student is not enrolled in that course.' } }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

import { createUser, enrollUser } from '@/lib/auth/store';
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth/session';
import { toPublicUser } from '@/lib/auth/types';

/** Creates a fresh admin user and returns a ready-to-use `Cookie` header value for tests that hit admin-gated routes. */
export async function createAdminCookie(): Promise<string> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await createUser({
    username: `admin_${suffix}`,
    email: `admin-${suffix}@gurukul.dev`,
    password: 'adminpass123',
    name: 'Test Admin',
    role: 'admin',
  });
  if (!('user' in result)) throw new Error('admin test user setup failed');
  return `${SESSION_COOKIE}=${createSessionToken(toPublicUser(result.user), [])}`;
}

/** Creates a fresh student user (optionally enrolled in a course) and returns { userId, cookie }. */
export async function createStudentCookie(enrolledCourseSlug?: string): Promise<{ userId: string; cookie: string }> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await createUser({
    username: `student_${suffix}`,
    email: `student-${suffix}@gurukul.dev`,
    password: 'studentpass123',
    name: 'Test Student',
    role: 'student',
  });
  if (!('user' in result)) throw new Error('student test user setup failed');
  const enrollments: string[] = [];
  if (enrolledCourseSlug) {
    await enrollUser(result.user.id, enrolledCourseSlug);
    enrollments.push(enrolledCourseSlug);
  }
  return {
    userId: result.user.id,
    cookie: `${SESSION_COOKIE}=${createSessionToken(toPublicUser(result.user), enrollments)}`,
  };
}

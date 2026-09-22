import { createUser } from '@/lib/auth/store';
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

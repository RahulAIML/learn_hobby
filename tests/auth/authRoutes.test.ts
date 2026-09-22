import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { GET as mePOST } from '@/app/api/auth/me/route';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { createUser } from '@/lib/auth/store';

const TEST_EMAIL = `authtest-${Date.now()}@gurukul.dev`;
const TEST_PASSWORD = 'student123';

function jsonRequest(url: string, body: unknown, cookie?: string): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

function meRequest(cookie?: string): NextRequest {
  return new NextRequest('http://localhost/api/auth/me', { headers: cookie ? { cookie } : undefined });
}

describe('auth routes', () => {
  beforeAll(async () => {
    const result = await createUser({
      username: `authtest_${Date.now()}`,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: 'Auth Test User',
    });
    if (!('user' in result)) throw new Error('setup failed');
  });

  it('rejects an incorrect password', async () => {
    const res = await loginPOST(jsonRequest('http://localhost/api/auth/login', { email: TEST_EMAIL, password: 'wrong' }));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('invalid_credentials');
  });

  it('rejects an unknown email', async () => {
    const res = await loginPOST(jsonRequest('http://localhost/api/auth/login', { email: 'nobody@gurukul.dev', password: 'whatever' }));
    expect(res.status).toBe(401);
  });

  it('logs in with correct credentials and sets a session cookie', async () => {
    const res = await loginPOST(jsonRequest('http://localhost/api/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.user.email).toBe(TEST_EMAIL);
    expect(res.cookies.get(SESSION_COOKIE)).toBeTruthy();
  });

  it('GET /me returns 401 when not signed in', async () => {
    const res = await mePOST(meRequest());
    expect(res.status).toBe(401);
  });

  it('GET /me returns the user when a valid session cookie is sent', async () => {
    const loginRes = await loginPOST(jsonRequest('http://localhost/api/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD }));
    const token = loginRes.cookies.get(SESSION_COOKIE)?.value;
    expect(token).toBeTruthy();

    const res = await mePOST(meRequest(`${SESSION_COOKIE}=${token}`));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.user.email).toBe(TEST_EMAIL);
  });
});

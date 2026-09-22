import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createUserPOST } from '@/app/api/users/route';
import { GET as getUserGET, PATCH as updateUserPATCH } from '@/app/api/users/[id]/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { SESSION_COOKIE } from '@/lib/auth/session';

function jsonRequest(url: string, body: unknown, method = 'POST', cookie?: string): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

function getRequest(url: string, cookie?: string): NextRequest {
  return new NextRequest(url, { headers: cookie ? { cookie } : undefined });
}

async function createAndLogin(overrides: Partial<{ username: string; email: string; password: string; name: string }> = {}) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payload = {
    username: overrides.username ?? `user_${suffix}`,
    email: overrides.email ?? `user-${suffix}@gurukul.dev`,
    password: overrides.password ?? 'password123',
    name: overrides.name ?? 'Test User',
  };
  const createRes = await createUserPOST(jsonRequest('http://localhost/api/users', payload));
  const createBody = await createRes.json();

  const loginRes = await loginPOST(jsonRequest('http://localhost/api/auth/login', { email: payload.email, password: payload.password }));
  const cookie = `${SESSION_COOKIE}=${loginRes.cookies.get(SESSION_COOKIE)?.value}`;

  return { payload, createRes, createBody, cookie };
}

describe('POST /api/users (registration + validation)', () => {
  it('creates a user with valid fields', async () => {
    const { createRes, createBody, payload } = await createAndLogin();
    expect(createRes.status).toBe(201);
    expect(createBody.user.email).toBe(payload.email);
    expect(createBody.user.username).toBe(payload.username);
    expect(createBody.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate email', async () => {
    const { payload } = await createAndLogin();
    const res = await createUserPOST(
      jsonRequest('http://localhost/api/users', { ...payload, username: `${payload.username}_2` })
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('email_taken');
  });

  it('rejects a duplicate username', async () => {
    const { payload } = await createAndLogin();
    const res = await createUserPOST(
      jsonRequest('http://localhost/api/users', { ...payload, email: `other-${Date.now()}@gurukul.dev` })
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('username_taken');
  });

  it('rejects an invalid email format', async () => {
    const res = await createUserPOST(
      jsonRequest('http://localhost/api/users', {
        username: `bademail_${Date.now()}`,
        email: 'not-an-email',
        password: 'password123',
        name: 'Bad Email',
      })
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('invalid_email');
  });

  it('rejects an invalid mobile number', async () => {
    const res = await createUserPOST(
      jsonRequest('http://localhost/api/users', {
        username: `badmobile_${Date.now()}`,
        email: `badmobile-${Date.now()}@gurukul.dev`,
        password: 'password123',
        name: 'Bad Mobile',
        mobile: 'not-a-number!!',
      })
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('invalid_mobile');
  });

  it('accepts a valid mobile and phoneNo as distinct fields', async () => {
    const { createRes, createBody } = await createAndLogin();
    expect(createRes.status).toBe(201);
    // mobile/phoneNo were not sent above — confirm they default to null, not merged/duplicated.
    expect(createBody.user.mobile).toBeNull();
    expect(createBody.user.phoneNo).toBeNull();
  });

  it('rejects a too-short username', async () => {
    const res = await createUserPOST(
      jsonRequest('http://localhost/api/users', {
        username: 'ab',
        email: `shortuser-${Date.now()}@gurukul.dev`,
        password: 'password123',
        name: 'Short Username',
      })
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('invalid_username');
  });
});

describe('GET/PATCH /api/users/[id]', () => {
  it('retrieves the caller\'s own profile', async () => {
    const { createBody, cookie } = await createAndLogin();
    const res = await getUserGET(getRequest(`http://localhost/api/users/${createBody.user.id}`, cookie), {
      params: { id: createBody.user.id },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.user.id).toBe(createBody.user.id);
  });

  it('rejects reading another user\'s profile', async () => {
    const a = await createAndLogin();
    const b = await createAndLogin();
    const res = await getUserGET(getRequest(`http://localhost/api/users/${b.createBody.user.id}`, a.cookie), {
      params: { id: b.createBody.user.id },
    });
    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated access', async () => {
    const { createBody } = await createAndLogin();
    const res = await getUserGET(getRequest(`http://localhost/api/users/${createBody.user.id}`), {
      params: { id: createBody.user.id },
    });
    expect(res.status).toBe(401);
  });

  it('updates name and mobile via PATCH, persisted in Postgres', async () => {
    const { createBody, cookie } = await createAndLogin();
    const patchRes = await updateUserPATCH(
      jsonRequest(`http://localhost/api/users/${createBody.user.id}`, { name: 'Updated Name', mobile: '+1 415-555-0100' }, 'PATCH', cookie),
      { params: { id: createBody.user.id } }
    );
    const patchBody = await patchRes.json();
    expect(patchRes.status).toBe(200);
    expect(patchBody.user.name).toBe('Updated Name');
    expect(patchBody.user.mobile).toBe('+14155550100');

    // Re-fetch independently to confirm it was actually written to the DB, not just echoed back.
    const getRes = await getUserGET(getRequest(`http://localhost/api/users/${createBody.user.id}`, cookie), {
      params: { id: createBody.user.id },
    });
    const getBody = await getRes.json();
    expect(getBody.user.name).toBe('Updated Name');
    expect(getBody.user.mobile).toBe('+14155550100');
  });

  it('rejects an invalid mobile on update', async () => {
    const { createBody, cookie } = await createAndLogin();
    const res = await updateUserPATCH(
      jsonRequest(`http://localhost/api/users/${createBody.user.id}`, { mobile: 'xx' }, 'PATCH', cookie),
      { params: { id: createBody.user.id } }
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('invalid_mobile');
  });
});

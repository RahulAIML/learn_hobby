import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/courses/route';
import { createAdminCookie } from '../helpers/adminAuth';

let adminCookie: string;

function jsonRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify(body),
  });
}

describe('courses API routes', () => {
  beforeAll(async () => {
    adminCookie = await createAdminCookie();
  });

  it('POST rejects an unauthenticated caller', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'No Auth' }),
      })
    );
    expect(res.status).toBe(401);
  });

  it('GET lists a created course', async () => {
    await POST(jsonRequest({ title: 'Data Science' }));
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.courses.some((c: { slug: string }) => c.slug === 'data-science')).toBe(true);
  });

  it('POST rejects an empty title', async () => {
    const res = await POST(jsonRequest({ title: '   ' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('invalid_title');
  });

  it('POST creates a new course with a slugified title', async () => {
    const res = await POST(jsonRequest({ title: 'Full-Stack Web Dev 101' }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.course.slug).toBe('full-stack-web-dev-101');
    expect(body.course.title).toBe('Full-Stack Web Dev 101');

    const listRes = await GET();
    const listBody = await listRes.json();
    expect(listBody.courses.some((c: { slug: string }) => c.slug === 'full-stack-web-dev-101')).toBe(true);
  });

  it('POST rejects a duplicate slug', async () => {
    await POST(jsonRequest({ title: 'Duplicate Course' }));
    const res = await POST(jsonRequest({ title: 'Duplicate Course' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('slug_taken');
  });
});

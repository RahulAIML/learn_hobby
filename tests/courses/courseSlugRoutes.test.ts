import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createCoursePOST, GET as listCoursesGET } from '@/app/api/courses/route';
import { PATCH, DELETE } from '@/app/api/courses/[courseSlug]/route';
import { POST as listDocsPOST } from '@/app/api/courses/[courseSlug]/documents/route';
import { GET as documentsGET } from '@/app/api/courses/[courseSlug]/documents/route';
import { createAdminCookie } from '../helpers/adminAuth';

let adminCookie: string;

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      cookie: adminCookie,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function pdfFile(name = 'doc.pdf'): File {
  const header = new TextEncoder().encode('%PDF-1.4\n');
  const bytes = new Uint8Array(Math.max(header.length, 64));
  bytes.set(header, 0);
  return new File([bytes], name, { type: 'application/pdf' });
}

describe('/api/courses/[courseSlug] (rename/delete)', () => {
  beforeAll(async () => {
    adminCookie = await createAdminCookie();
  });

  it('PATCH renames a course, keeping its slug', async () => {
    await createCoursePOST(jsonRequest('http://localhost/api/courses', 'POST', { title: 'Rename Me' }));

    const res = await PATCH(jsonRequest('http://localhost/api/courses/rename-me', 'PATCH', { title: 'Renamed Course' }), {
      params: { courseSlug: 'rename-me' },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.course.slug).toBe('rename-me');
    expect(body.course.title).toBe('Renamed Course');
  });

  it('PATCH 404s for an unknown course', async () => {
    const res = await PATCH(jsonRequest('http://localhost/api/courses/nope', 'PATCH', { title: 'X' }), {
      params: { courseSlug: 'nope' },
    });
    expect(res.status).toBe(404);
  });

  it('PATCH rejects an empty title', async () => {
    await createCoursePOST(jsonRequest('http://localhost/api/courses', 'POST', { title: 'Keep Title' }));
    const res = await PATCH(jsonRequest('http://localhost/api/courses/keep-title', 'PATCH', { title: '   ' }), {
      params: { courseSlug: 'keep-title' },
    });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('invalid_title');
  });

  it('DELETE removes a course and cascades to its documents', async () => {
    await createCoursePOST(jsonRequest('http://localhost/api/courses', 'POST', { title: 'Delete Me' }));

    const formData = new FormData();
    formData.append('file', pdfFile());
    await listDocsPOST(
      new NextRequest('http://localhost/api/courses/delete-me/documents', { method: 'POST', body: formData, headers: { cookie: adminCookie } }),
      { params: { courseSlug: 'delete-me' } }
    );

    const deleteRes = await DELETE(jsonRequest('http://localhost/api/courses/delete-me', 'DELETE'), {
      params: { courseSlug: 'delete-me' },
    });
    expect(deleteRes.status).toBe(200);

    const listRes = await listCoursesGET();
    const listBody = await listRes.json();
    expect(listBody.courses.some((c: { slug: string }) => c.slug === 'delete-me')).toBe(false);

    const docsRes = await documentsGET(jsonRequest('http://localhost/api/courses/delete-me/documents', 'GET'), {
      params: { courseSlug: 'delete-me' },
    });
    expect(docsRes.status).toBe(404);
  });

  it('DELETE 404s for an unknown course', async () => {
    const res = await DELETE(jsonRequest('http://localhost/api/courses/nope', 'DELETE'), { params: { courseSlug: 'nope' } });
    expect(res.status).toBe(404);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as listGET, POST as listPOST } from '@/app/api/courses/[courseSlug]/documents/route';
import {
  GET as docGET,
  PUT as docPUT,
  DELETE as docDELETE,
} from '@/app/api/courses/[courseSlug]/documents/[docId]/route';
import { listDocuments, deleteDocument } from '@/lib/courseDocuments/store';
import { getUserByEmail, createUser, enrollUser } from '@/lib/auth/store';
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth/session';

const COURSE = 'data-science';

const enrolledStudent = getUserByEmail('student@gurukul.dev')!;
const enrolledCookie = `${SESSION_COOKIE}=${createSessionToken(enrolledStudent.id)}`;

const outsiderResult = createUser({ email: 'outsider@gurukul.dev', password: 'outsider123', name: 'Outsider' });
const outsider = 'user' in outsiderResult ? outsiderResult.user : (() => { throw new Error('setup failed'); })();
enrollUser(outsider.id, 'some-other-course');
const outsiderCookie = `${SESSION_COOKIE}=${createSessionToken(outsider.id)}`;

function pdfFile(name = 'doc.pdf'): File {
  const header = new TextEncoder().encode('%PDF-1.4\n');
  const bytes = new Uint8Array(Math.max(header.length, 64));
  bytes.set(header, 0);
  return new File([bytes], name, { type: 'application/pdf' });
}

function requestWithForm(url: string, formData: FormData, method: string, cookie?: string): NextRequest {
  return new NextRequest(url, { method, body: formData, headers: cookie ? { cookie } : undefined });
}

function plainRequest(url: string, method: string, cookie?: string): NextRequest {
  return new NextRequest(url, { method, headers: cookie ? { cookie } : undefined });
}

describe('course documents API routes', () => {
  beforeEach(() => {
    listDocuments(COURSE).forEach((doc) => deleteDocument(COURSE, doc.id));
  });

  it('GET list returns 404 for an unknown course', async () => {
    const res = await listGET(plainRequest('http://localhost/api/courses/nope/documents', 'GET'), {
      params: { courseSlug: 'nope' },
    });
    expect(res.status).toBe(404);
  });

  it('POST rejects a request with no file', async () => {
    const fd = new FormData();
    const res = await listPOST(requestWithForm('http://localhost/api/courses/data-science/documents', fd, 'POST'), {
      params: { courseSlug: COURSE },
    });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('missing_file');
  });

  it('POST rejects an unsupported file type', async () => {
    const fd = new FormData();
    fd.append('file', new File([new Uint8Array(10)], 'virus.exe', { type: 'application/octet-stream' }));
    const res = await listPOST(requestWithForm('http://localhost/api/courses/data-science/documents', fd, 'POST'), {
      params: { courseSlug: COURSE },
    });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('invalid_file');
  });

  it('full lifecycle: create -> list -> download -> replace -> delete', async () => {
    // Create
    const createFd = new FormData();
    createFd.append('file', pdfFile('syllabus.pdf'));
    createFd.append('title', 'Course Syllabus');
    const createRes = await listPOST(
      requestWithForm('http://localhost/api/courses/data-science/documents', createFd, 'POST'),
      { params: { courseSlug: COURSE } }
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.success).toBe(true);
    const docId = created.document.id;

    // List
    const listRes = await listGET(plainRequest('http://localhost/api/courses/data-science/documents', 'GET'), {
      params: { courseSlug: COURSE },
    });
    const listed = await listRes.json();
    expect(listed.documents).toHaveLength(1);
    expect(listed.documents[0].title).toBe('Course Syllabus');
    // The summary must never leak the raw base64 payload.
    expect(listed.documents[0].data).toBeUndefined();

    // Download / view — requires an authenticated, enrolled student
    const downloadRes = await docGET(
      plainRequest(`http://localhost/api/courses/data-science/documents/${docId}?download=1`, 'GET', enrolledCookie),
      { params: { courseSlug: COURSE, docId } }
    );
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers.get('Content-Disposition')).toContain('attachment');
    const bytes = Buffer.from(await downloadRes.arrayBuffer());
    expect(bytes.toString('utf-8')).toContain('%PDF-1.4');

    // Unauthenticated caller is rejected outright
    const anonRes = await docGET(plainRequest(`http://localhost/api/courses/data-science/documents/${docId}`, 'GET'), {
      params: { courseSlug: COURSE, docId },
    });
    expect(anonRes.status).toBe(401);

    // A signed-in student who is NOT enrolled in this course is rejected too —
    // an unguessable document id is not treated as sufficient protection.
    const forbiddenRes = await docGET(
      plainRequest(`http://localhost/api/courses/data-science/documents/${docId}`, 'GET', outsiderCookie),
      { params: { courseSlug: COURSE, docId } }
    );
    expect(forbiddenRes.status).toBe(403);

    // Replace
    const replaceFd = new FormData();
    replaceFd.append('file', pdfFile('syllabus-v2.pdf'));
    const replaceRes = await docPUT(
      requestWithForm(`http://localhost/api/courses/data-science/documents/${docId}`, replaceFd, 'PUT'),
      { params: { courseSlug: COURSE, docId } }
    );
    expect(replaceRes.status).toBe(200);
    const replaced = await replaceRes.json();
    expect(replaced.document.id).toBe(docId);
    expect(replaced.document.filename).toBe('syllabus-v2.pdf');

    // Delete
    const deleteRes = await docDELETE(
      plainRequest(`http://localhost/api/courses/data-science/documents/${docId}`, 'DELETE'),
      { params: { courseSlug: COURSE, docId } }
    );
    expect(deleteRes.status).toBe(200);

    const afterDelete = await listGET(plainRequest('http://localhost/api/courses/data-science/documents', 'GET'), {
      params: { courseSlug: COURSE },
    });
    const afterDeleteBody = await afterDelete.json();
    expect(afterDeleteBody.documents).toHaveLength(0);
  });

  it('returns 404 when replacing or deleting a document that does not exist', async () => {
    const fd = new FormData();
    fd.append('file', pdfFile());
    const replaceRes = await docPUT(
      requestWithForm('http://localhost/api/courses/data-science/documents/missing-id', fd, 'PUT'),
      { params: { courseSlug: COURSE, docId: 'missing-id' } }
    );
    expect(replaceRes.status).toBe(404);

    const deleteRes = await docDELETE(
      plainRequest('http://localhost/api/courses/data-science/documents/missing-id', 'DELETE'),
      { params: { courseSlug: COURSE, docId: 'missing-id' } }
    );
    expect(deleteRes.status).toBe(404);
  });
});

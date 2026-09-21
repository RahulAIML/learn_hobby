import { NextRequest, NextResponse } from 'next/server';
import { validateUploadedFile } from '@/lib/assessment/fileValidation.server';
import { getDocument, replaceDocument, deleteDocument } from '@/lib/courseDocuments/store';
import { toSummary } from '@/lib/courseDocuments/types';
import { getSessionUser } from '@/lib/auth/session';
import { isEnrolled } from '@/lib/auth/store';

export const runtime = 'nodejs';

interface RouteParams {
  params: { courseSlug: string; docId: string };
}

/**
 * Streams the raw file bytes back — used for both "view online" (PDF/images)
 * and "download".
 *
 * AUTHORIZATION (critical): this is the actual content-delivery endpoint,
 * so it is the one that must genuinely enforce access — not just hide a
 * button in the UI. The caller must be signed in, and if they are a
 * student, they must be enrolled in this document's course. An unguessable
 * document id is NOT treated as sufficient protection on its own.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const user = getSessionUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'unauthenticated', message: 'Please sign in to view this document.' } }, { status: 401 });
  }
  if (user.role === 'student' && !isEnrolled(user.id, params.courseSlug)) {
    return NextResponse.json({ success: false, error: { code: 'forbidden', message: 'You are not enrolled in this course.' } }, { status: 403 });
  }

  const doc = getDocument(params.courseSlug, params.docId);
  if (!doc) {
    return NextResponse.json({ success: false, error: { code: 'document_not_found', message: 'Document not found.' } }, { status: 404 });
  }

  const download = new URL(req.url).searchParams.get('download') === '1';
  const bytes = Buffer.from(doc.data, 'base64');

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Length': String(bytes.length),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${doc.filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

/** Admin: replace a document's file content in place (keeps the same id/URL). See POST route for the access-control note. */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const existing = getDocument(params.courseSlug, params.docId);
  if (!existing) {
    return NextResponse.json({ success: false, error: { code: 'document_not_found', message: 'Document not found.' } }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Could not read the submitted form data.' } }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: { code: 'missing_file', message: 'Please attach a replacement file.' } }, { status: 400 });
  }

  const title = formData.get('title')?.toString().trim();
  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = await validateUploadedFile(file.name, buffer);
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: { code: 'invalid_file', message: validation.error } }, { status: 400 });
  }

  const updated = replaceDocument(params.courseSlug, params.docId, {
    title,
    filename: validation.safeFilename ?? file.name,
    mimeType: validation.detectedMime ?? file.type,
    data: buffer.toString('base64'),
    sizeBytes: buffer.length,
  });

  if (!updated) {
    return NextResponse.json({ success: false, error: { code: 'document_not_found', message: 'Document not found.' } }, { status: 404 });
  }

  return NextResponse.json({ success: true, document: toSummary(updated) });
}

/** Admin: delete a document. See POST route for the access-control note. */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const removed = deleteDocument(params.courseSlug, params.docId);
  if (!removed) {
    return NextResponse.json({ success: false, error: { code: 'document_not_found', message: 'Document not found.' } }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

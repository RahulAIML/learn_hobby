import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { listDocuments, createDocument, replaceDocument, deleteDocument, getDocument } from '@/lib/courseDocuments/store';
import { createCourse } from '@/lib/courses/store';

const COURSE = 'test-course-store';
const COURSE_2 = 'test-course-store-2';

describe('courseDocuments store', () => {
  beforeAll(async () => {
    await createCourse(COURSE);
    await createCourse(COURSE_2);
  });

  beforeEach(async () => {
    // Clean slate: delete anything left over from a previous test in this file.
    const docs = await listDocuments(COURSE);
    await Promise.all(docs.map((doc) => deleteDocument(COURSE, doc.id)));
  });

  it('starts empty for an unknown course', async () => {
    expect(await listDocuments('never-seen-course')).toEqual([]);
  });

  it('creates and lists a document', async () => {
    const doc = await createDocument({
      courseSlug: COURSE,
      title: 'Syllabus',
      filename: 'syllabus.pdf',
      mimeType: 'application/pdf',
      data: Buffer.from('fake pdf bytes').toString('base64'),
      sizeBytes: 14,
    });

    expect(doc.id).toBeTruthy();
    expect(await listDocuments(COURSE)).toHaveLength(1);
    expect((await getDocument(COURSE, doc.id))?.title).toBe('Syllabus');
  });

  it('replaces a document in place, keeping its id', async () => {
    const doc = await createDocument({
      courseSlug: COURSE,
      title: 'Notes v1',
      filename: 'notes.txt',
      mimeType: 'text/plain',
      data: Buffer.from('v1').toString('base64'),
      sizeBytes: 2,
    });

    const updated = await replaceDocument(COURSE, doc.id, {
      filename: 'notes.txt',
      mimeType: 'text/plain',
      data: Buffer.from('v2').toString('base64'),
      sizeBytes: 2,
    });

    expect(updated?.id).toBe(doc.id);
    expect(Buffer.from(updated!.data, 'base64').toString()).toBe('v2');
    expect(await listDocuments(COURSE)).toHaveLength(1);
  });

  it('returns undefined when replacing a document that does not exist', async () => {
    const result = await replaceDocument(COURSE, 'does-not-exist', {
      filename: 'x.txt',
      mimeType: 'text/plain',
      data: 'ZmFrZQ==',
      sizeBytes: 4,
    });
    expect(result).toBeUndefined();
  });

  it('deletes a document', async () => {
    const doc = await createDocument({
      courseSlug: COURSE,
      title: 'To delete',
      filename: 'temp.txt',
      mimeType: 'text/plain',
      data: 'eA==',
      sizeBytes: 1,
    });
    expect(await deleteDocument(COURSE, doc.id)).toBe(true);
    expect(await listDocuments(COURSE)).toHaveLength(0);
    expect(await deleteDocument(COURSE, doc.id)).toBe(false);
  });

  it('keeps documents scoped to their own course', async () => {
    await createDocument({
      courseSlug: COURSE,
      title: 'Course A doc',
      filename: 'a.txt',
      mimeType: 'text/plain',
      data: 'YQ==',
      sizeBytes: 1,
    });
    await createDocument({
      courseSlug: COURSE_2,
      title: 'Course B doc',
      filename: 'b.txt',
      mimeType: 'text/plain',
      data: 'Yg==',
      sizeBytes: 1,
    });

    expect(await listDocuments(COURSE)).toHaveLength(1);
    const course2Docs = await listDocuments(COURSE_2);
    expect(course2Docs).toHaveLength(1);
    await deleteDocument(COURSE_2, course2Docs[0].id);
  });
});

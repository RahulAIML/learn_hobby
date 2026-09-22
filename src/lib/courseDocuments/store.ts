import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { courseDocuments } from '@/lib/db/schema';
import { isUuid } from '@/lib/db/isUuid';
import type { CourseDocument } from './types';

/** Postgres-backed document store (Drizzle). Real, durable persistence. */

function rowToDocument(row: typeof courseDocuments.$inferSelect): CourseDocument {
  return {
    id: row.id,
    courseSlug: row.courseSlug,
    moduleId: row.moduleId,
    title: row.title,
    filename: row.filename,
    mimeType: row.mimeType,
    data: row.data,
    sizeBytes: row.sizeBytes,
    uploadedAt: row.uploadedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listDocuments(courseSlug: string): Promise<CourseDocument[]> {
  const db = await getDb();
  const rows = await db.select().from(courseDocuments).where(eq(courseDocuments.courseSlug, courseSlug));
  return rows.map(rowToDocument);
}

export async function getDocument(courseSlug: string, id: string): Promise<CourseDocument | undefined> {
  if (!isUuid(id)) return undefined;
  const db = await getDb();
  const [row] = await db
    .select()
    .from(courseDocuments)
    .where(and(eq(courseDocuments.courseSlug, courseSlug), eq(courseDocuments.id, id)))
    .limit(1);
  return row ? rowToDocument(row) : undefined;
}

export interface CreateDocumentInput {
  courseSlug: string;
  moduleId?: string | null;
  title: string;
  filename: string;
  mimeType: string;
  data: string; // base64
  sizeBytes: number;
}

export async function createDocument(input: CreateDocumentInput): Promise<CourseDocument> {
  const db = await getDb();
  const now = new Date();
  const [row] = await db
    .insert(courseDocuments)
    .values({
      id: randomUUID(),
      courseSlug: input.courseSlug,
      moduleId: input.moduleId ?? null,
      title: input.title,
      filename: input.filename,
      mimeType: input.mimeType,
      data: input.data,
      sizeBytes: input.sizeBytes,
      uploadedAt: now,
      updatedAt: now,
    })
    .returning();
  return rowToDocument(row);
}

export interface ReplaceDocumentInput {
  title?: string;
  filename: string;
  mimeType: string;
  data: string;
  sizeBytes: number;
}

/** Replaces a document's file content (and optionally its title) in place, preserving its id. */
export async function replaceDocument(
  courseSlug: string,
  id: string,
  input: ReplaceDocumentInput
): Promise<CourseDocument | undefined> {
  if (!isUuid(id)) return undefined;
  const db = await getDb();
  const patch: Partial<typeof courseDocuments.$inferInsert> = {
    filename: input.filename,
    mimeType: input.mimeType,
    data: input.data,
    sizeBytes: input.sizeBytes,
    updatedAt: new Date(),
  };
  if (input.title !== undefined) patch.title = input.title;

  const [row] = await db
    .update(courseDocuments)
    .set(patch)
    .where(and(eq(courseDocuments.courseSlug, courseSlug), eq(courseDocuments.id, id)))
    .returning();
  return row ? rowToDocument(row) : undefined;
}

export async function deleteDocument(courseSlug: string, id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const db = await getDb();
  const deleted = await db
    .delete(courseDocuments)
    .where(and(eq(courseDocuments.courseSlug, courseSlug), eq(courseDocuments.id, id)))
    .returning();
  return deleted.length > 0;
}

/** Deletes every document belonging to a course — used when the course itself is deleted. */
export async function deleteAllDocuments(courseSlug: string): Promise<void> {
  const db = await getDb();
  await db.delete(courseDocuments).where(eq(courseDocuments.courseSlug, courseSlug));
}

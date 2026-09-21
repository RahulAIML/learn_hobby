import { randomUUID } from 'crypto';
import type { CourseDocument } from './types';

/**
 * In-memory, server-only document store.
 *
 * LIMITATION (documented, same pattern as rateLimit.ts): this project has
 * no database or blob storage configured. Vercel's serverless filesystem
 * is read-only at runtime, so writing to disk is not an option either.
 * This store lives in a single function instance's memory — it works
 * correctly for the lifetime of a warm instance, but is NOT durable
 * across cold starts or multiple instances, and documents added here
 * will NOT survive a redeploy. It is real, working CRUD, not a fake —
 * just not yet backed by persistent storage. Swapping the functions
 * below for real database calls does not require changing any caller
 * (API routes and components only import these functions).
 */

const documentsByCourse = new Map<string, CourseDocument[]>();

export function listDocuments(courseSlug: string): CourseDocument[] {
  return documentsByCourse.get(courseSlug) ?? [];
}

export function getDocument(courseSlug: string, id: string): CourseDocument | undefined {
  return listDocuments(courseSlug).find((doc) => doc.id === id);
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

export function createDocument(input: CreateDocumentInput): CourseDocument {
  const now = new Date().toISOString();
  const doc: CourseDocument = {
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
  };
  const existing = documentsByCourse.get(input.courseSlug) ?? [];
  documentsByCourse.set(input.courseSlug, [...existing, doc]);
  return doc;
}

export interface ReplaceDocumentInput {
  title?: string;
  filename: string;
  mimeType: string;
  data: string;
  sizeBytes: number;
}

/** Replaces a document's file content (and optionally its title) in place, preserving its id. */
export function replaceDocument(
  courseSlug: string,
  id: string,
  input: ReplaceDocumentInput
): CourseDocument | undefined {
  const list = documentsByCourse.get(courseSlug);
  if (!list) return undefined;
  const idx = list.findIndex((doc) => doc.id === id);
  if (idx === -1) return undefined;

  const updated: CourseDocument = {
    ...list[idx],
    title: input.title ?? list[idx].title,
    filename: input.filename,
    mimeType: input.mimeType,
    data: input.data,
    sizeBytes: input.sizeBytes,
    updatedAt: new Date().toISOString(),
  };
  const nextList = [...list];
  nextList[idx] = updated;
  documentsByCourse.set(courseSlug, nextList);
  return updated;
}

export function deleteDocument(courseSlug: string, id: string): boolean {
  const list = documentsByCourse.get(courseSlug);
  if (!list) return false;
  const next = list.filter((doc) => doc.id !== id);
  const removed = next.length !== list.length;
  documentsByCourse.set(courseSlug, next);
  return removed;
}

/** Deletes every document belonging to a course — used when the course itself is deleted. */
export function deleteAllDocuments(courseSlug: string): void {
  documentsByCourse.delete(courseSlug);
}

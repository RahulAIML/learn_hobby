import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { courses as coursesTable } from '@/lib/db/schema';
import type { Course } from '@/lib/courseDocuments/types';

/** Postgres-backed course catalog store (Drizzle). Real, durable persistence. */

export async function listCourses(): Promise<Course[]> {
  const db = await getDb();
  return db.select().from(coursesTable);
}

export async function getCourse(slug: string): Promise<Course | undefined> {
  const db = await getDb();
  const [row] = await db.select().from(coursesTable).where(eq(coursesTable.slug, slug)).limit(1);
  return row;
}

function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type CreateCourseError = 'invalid_title' | 'slug_taken';

export async function createCourse(title: string): Promise<{ course: Course } | { error: CreateCourseError }> {
  const trimmed = title.trim();
  if (!trimmed) return { error: 'invalid_title' };

  const slug = slugify(trimmed);
  if (!slug) return { error: 'invalid_title' };

  const db = await getDb();
  if (await getCourse(slug)) return { error: 'slug_taken' };

  const course: Course = { slug, title: trimmed };
  await db.insert(coursesTable).values(course);
  return { course };
}

export type UpdateCourseError = 'invalid_title' | 'course_not_found';

/** Renames a course. The slug (and therefore its URL/documents) stays the same — only the display title changes. */
export async function updateCourse(slug: string, title: string): Promise<{ course: Course } | { error: UpdateCourseError }> {
  const trimmed = title.trim();
  if (!trimmed) return { error: 'invalid_title' };

  const db = await getDb();
  const [row] = await db.update(coursesTable).set({ title: trimmed }).where(eq(coursesTable.slug, slug)).returning();
  if (!row) return { error: 'course_not_found' };

  return { course: row };
}

export async function deleteCourse(slug: string): Promise<boolean> {
  const db = await getDb();
  const deleted = await db.delete(coursesTable).where(eq(coursesTable.slug, slug)).returning();
  return deleted.length > 0;
}

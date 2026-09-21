import type { Course } from '@/lib/courseDocuments/types';

/**
 * In-memory course catalog store. Same limitation as
 * courseDocuments/store.ts: no database is configured, so this lives in a
 * single function instance's memory and does NOT survive a redeploy or
 * cold start. Real, working CRUD — not a fake — just not yet durable.
 */

const SEED_COURSES: Course[] = [{ slug: 'data-science', title: 'Data Science Championship Program™' }];

const courses = new Map<string, Course>(SEED_COURSES.map((c) => [c.slug, c]));

export function listCourses(): Course[] {
  return Array.from(courses.values());
}

export function getCourse(slug: string): Course | undefined {
  return courses.get(slug);
}

function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type CreateCourseError = 'invalid_title' | 'slug_taken';

export function createCourse(title: string): { course: Course } | { error: CreateCourseError } {
  const trimmed = title.trim();
  if (!trimmed) return { error: 'invalid_title' };

  const slug = slugify(trimmed);
  if (!slug) return { error: 'invalid_title' };
  if (courses.has(slug)) return { error: 'slug_taken' };

  const course: Course = { slug, title: trimmed };
  courses.set(slug, course);
  return { course };
}

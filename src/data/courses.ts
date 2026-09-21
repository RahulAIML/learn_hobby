import { listCourses, getCourse as getCourseFromStore } from '@/lib/courses/store';

/** Seed list for static param generation at build time. New courses created at runtime are still resolved via getCourse() — see src/lib/courses/store.ts. */
export const courses = listCourses();

export function getCourse(slug: string) {
  return getCourseFromStore(slug);
}

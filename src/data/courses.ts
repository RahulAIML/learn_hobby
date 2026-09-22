import { getCourse as getCourseFromStore } from '@/lib/courses/store';

export function getCourse(slug: string) {
  return getCourseFromStore(slug);
}

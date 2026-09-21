import { randomUUID } from 'crypto';
import type { Module } from './types';

/** In-memory module store — same non-durability limitation as courses/courseDocuments. */

const modulesByCourse = new Map<string, Module[]>();

function seed() {
  const id = randomUUID();
  const mod: Module = {
    id,
    courseSlug: 'data-science',
    title: 'Module 2: Python for Data Analysis',
    order: 1,
    createdAt: new Date().toISOString(),
  };
  modulesByCourse.set('data-science', [mod]);
  return mod;
}
const seedModule = seed();

export function listModules(courseSlug: string): Module[] {
  return [...(modulesByCourse.get(courseSlug) ?? [])].sort((a, b) => a.order - b.order);
}

export function getModule(courseSlug: string, moduleId: string): Module | undefined {
  return modulesByCourse.get(courseSlug)?.find((m) => m.id === moduleId);
}

export function getModuleById(moduleId: string): Module | undefined {
  for (const list of Array.from(modulesByCourse.values())) {
    const found = list.find((m: Module) => m.id === moduleId);
    if (found) return found;
  }
  return undefined;
}

export function createModule(courseSlug: string, title: string): Module {
  const list = modulesByCourse.get(courseSlug) ?? [];
  const mod: Module = {
    id: randomUUID(),
    courseSlug,
    title: title.trim(),
    order: list.length + 1,
    createdAt: new Date().toISOString(),
  };
  modulesByCourse.set(courseSlug, [...list, mod]);
  return mod;
}

export function deleteModule(courseSlug: string, moduleId: string): boolean {
  const list = modulesByCourse.get(courseSlug);
  if (!list) return false;
  const next = list.filter((m) => m.id !== moduleId);
  const removed = next.length !== list.length;
  modulesByCourse.set(courseSlug, next);
  return removed;
}

/** The seeded demo module id, used to seed a matching demo assessment. */
export const SEED_MODULE_ID = seedModule.id;

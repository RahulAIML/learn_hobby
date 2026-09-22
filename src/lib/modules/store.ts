import { randomUUID } from 'crypto';
import { eq, and, asc, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { modules as modulesTable } from '@/lib/db/schema';
import { isUuid } from '@/lib/db/isUuid';
import type { Module } from './types';

/** Postgres-backed module store (Drizzle). Real, durable persistence. */

function rowToModule(row: typeof modulesTable.$inferSelect): Module {
  return {
    id: row.id,
    courseSlug: row.courseSlug,
    title: row.title,
    order: row.order,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listModules(courseSlug: string): Promise<Module[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(modulesTable)
    .where(eq(modulesTable.courseSlug, courseSlug))
    .orderBy(asc(modulesTable.order));
  return rows.map(rowToModule);
}

export async function getModule(courseSlug: string, moduleId: string): Promise<Module | undefined> {
  if (!isUuid(moduleId)) return undefined;
  const db = await getDb();
  const [row] = await db
    .select()
    .from(modulesTable)
    .where(and(eq(modulesTable.courseSlug, courseSlug), eq(modulesTable.id, moduleId)))
    .limit(1);
  return row ? rowToModule(row) : undefined;
}

export async function getModuleById(moduleId: string): Promise<Module | undefined> {
  if (!isUuid(moduleId)) return undefined;
  const db = await getDb();
  const [row] = await db.select().from(modulesTable).where(eq(modulesTable.id, moduleId)).limit(1);
  return row ? rowToModule(row) : undefined;
}

export async function createModule(courseSlug: string, title: string): Promise<Module> {
  const db = await getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(modulesTable)
    .where(eq(modulesTable.courseSlug, courseSlug));

  const [row] = await db
    .insert(modulesTable)
    .values({
      id: randomUUID(),
      courseSlug,
      title: title.trim(),
      order: count + 1,
      createdAt: new Date(),
    })
    .returning();
  return rowToModule(row);
}

export async function deleteModule(courseSlug: string, moduleId: string): Promise<boolean> {
  if (!isUuid(moduleId)) return false;
  const db = await getDb();
  const deleted = await db
    .delete(modulesTable)
    .where(and(eq(modulesTable.courseSlug, courseSlug), eq(modulesTable.id, moduleId)))
    .returning();
  return deleted.length > 0;
}

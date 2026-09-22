import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { assessments as assessmentsTable } from '@/lib/db/schema';
import { isUuid } from '@/lib/db/isUuid';
import type { Assessment } from './types';

/** Postgres-backed assessment store (Drizzle), one assessment per module. Real, durable persistence. */

const DEFAULT_ALLOWED_FORMATS = ['.pdf', '.docx', '.xlsx', '.txt', '.png', '.jpg', '.jpeg'];

function rowToAssessment(row: typeof assessmentsTable.$inferSelect): Assessment {
  return {
    id: row.id,
    moduleId: row.moduleId,
    courseSlug: row.courseSlug,
    title: row.title,
    instructions: row.instructions,
    rubric: row.rubric,
    maxScore: row.maxScore,
    allowedFormats: row.allowedFormats,
    status: row.status as Assessment['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAssessmentByModule(moduleId: string): Promise<Assessment | undefined> {
  if (!isUuid(moduleId)) return undefined;
  const db = await getDb();
  const [row] = await db.select().from(assessmentsTable).where(eq(assessmentsTable.moduleId, moduleId)).limit(1);
  return row ? rowToAssessment(row) : undefined;
}

export async function getAssessmentById(assessmentId: string): Promise<Assessment | undefined> {
  if (!isUuid(assessmentId)) return undefined;
  const db = await getDb();
  const [row] = await db.select().from(assessmentsTable).where(eq(assessmentsTable.id, assessmentId)).limit(1);
  return row ? rowToAssessment(row) : undefined;
}

export interface UpsertAssessmentInput {
  title: string;
  instructions: string;
  rubric?: string;
  maxScore?: number;
  allowedFormats?: string[];
  status?: 'active' | 'draft';
}

export async function upsertAssessment(moduleId: string, courseSlug: string, input: UpsertAssessmentInput): Promise<Assessment> {
  const db = await getDb();
  const existing = await getAssessmentByModule(moduleId);
  const now = new Date();

  const values = {
    id: existing?.id ?? randomUUID(),
    moduleId,
    courseSlug,
    title: input.title.trim(),
    instructions: input.instructions.trim(),
    rubric: input.rubric?.trim() ?? existing?.rubric ?? '',
    maxScore: input.maxScore ?? existing?.maxScore ?? 100,
    allowedFormats: input.allowedFormats ?? existing?.allowedFormats ?? DEFAULT_ALLOWED_FORMATS,
    status: input.status ?? existing?.status ?? 'active',
    updatedAt: now,
  };

  const [row] = existing
    ? await db.update(assessmentsTable).set(values).where(eq(assessmentsTable.moduleId, moduleId)).returning()
    : await db
        .insert(assessmentsTable)
        .values({ ...values, createdAt: now })
        .returning();

  return rowToAssessment(row);
}

export async function deleteAssessmentForModule(moduleId: string): Promise<boolean> {
  if (!isUuid(moduleId)) return false;
  const db = await getDb();
  const deleted = await db.delete(assessmentsTable).where(eq(assessmentsTable.moduleId, moduleId)).returning();
  return deleted.length > 0;
}

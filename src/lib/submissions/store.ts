import { randomUUID } from 'crypto';
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { submissions as submissionsTable } from '@/lib/db/schema';
import { isUuid } from '@/lib/db/isUuid';
import type { EvaluationResult } from '@/lib/assessment/schema';
import type { Submission, SubmissionSummary } from './types';

/** Postgres-backed submission + evaluation store (Drizzle). Real, durable persistence. */

function rowToSubmission(row: typeof submissionsTable.$inferSelect): Submission {
  return {
    id: row.id,
    assessmentId: row.assessmentId,
    moduleId: row.moduleId,
    courseSlug: row.courseSlug,
    studentId: row.studentId,
    filename: row.filename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    submittedAt: row.submittedAt.toISOString(),
    status: row.status as Submission['status'],
  };
}

function rowToSummary(row: typeof submissionsTable.$inferSelect): SubmissionSummary {
  return { ...rowToSubmission(row), evaluation: (row.evaluation as EvaluationResult | null) ?? null };
}

export interface CreateSubmissionInput {
  assessmentId: string;
  moduleId: string;
  courseSlug: string;
  studentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export async function createSubmission(input: CreateSubmissionInput): Promise<Submission> {
  const db = await getDb();
  const [row] = await db
    .insert(submissionsTable)
    .values({
      id: randomUUID(),
      assessmentId: input.assessmentId,
      moduleId: input.moduleId,
      courseSlug: input.courseSlug,
      studentId: input.studentId,
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      submittedAt: new Date(),
      status: 'evaluating',
    })
    .returning();
  return rowToSubmission(row);
}

export async function saveEvaluation(submissionId: string, evaluation: EvaluationResult): Promise<void> {
  const db = await getDb();
  await db.update(submissionsTable).set({ evaluation, status: 'evaluated' }).where(eq(submissionsTable.id, submissionId));
}

export async function markFailed(submissionId: string): Promise<void> {
  const db = await getDb();
  await db.update(submissionsTable).set({ status: 'failed' }).where(eq(submissionsTable.id, submissionId));
}

export async function getSubmission(submissionId: string): Promise<Submission | undefined> {
  const db = await getDb();
  const [row] = await db.select().from(submissionsTable).where(eq(submissionsTable.id, submissionId)).limit(1);
  return row ? rowToSubmission(row) : undefined;
}

export async function getEvaluation(submissionId: string): Promise<EvaluationResult | undefined> {
  const db = await getDb();
  const [row] = await db.select().from(submissionsTable).where(eq(submissionsTable.id, submissionId)).limit(1);
  return (row?.evaluation as EvaluationResult | null) ?? undefined;
}

/** Submission history for a student on a given assessment, most recent first. */
export async function listSubmissionsForStudent(assessmentId: string, studentId: string): Promise<SubmissionSummary[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(submissionsTable)
    .where(and(eq(submissionsTable.assessmentId, assessmentId), eq(submissionsTable.studentId, studentId)))
    .orderBy(desc(submissionsTable.submittedAt));
  return rows.map(rowToSummary);
}

export async function getSubmissionSummary(submissionId: string): Promise<SubmissionSummary | undefined> {
  const db = await getDb();
  const [row] = await db.select().from(submissionsTable).where(eq(submissionsTable.id, submissionId)).limit(1);
  return row ? rowToSummary(row) : undefined;
}

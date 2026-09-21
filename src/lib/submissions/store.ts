import { randomUUID } from 'crypto';
import type { EvaluationResult } from '@/lib/assessment/schema';
import type { Submission, SubmissionSummary } from './types';

/** In-memory submission + evaluation store — same non-durability limitation as other stores. */

const submissions = new Map<string, Submission>();
const evaluations = new Map<string, EvaluationResult>(); // keyed by submission id

export interface CreateSubmissionInput {
  assessmentId: string;
  moduleId: string;
  courseSlug: string;
  studentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export function createSubmission(input: CreateSubmissionInput): Submission {
  const submission: Submission = {
    id: randomUUID(),
    assessmentId: input.assessmentId,
    moduleId: input.moduleId,
    courseSlug: input.courseSlug,
    studentId: input.studentId,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    submittedAt: new Date().toISOString(),
    status: 'evaluating',
  };
  submissions.set(submission.id, submission);
  return submission;
}

export function saveEvaluation(submissionId: string, evaluation: EvaluationResult): void {
  evaluations.set(submissionId, evaluation);
  const submission = submissions.get(submissionId);
  if (submission) submissions.set(submissionId, { ...submission, status: 'evaluated' });
}

export function markFailed(submissionId: string): void {
  const submission = submissions.get(submissionId);
  if (submission) submissions.set(submissionId, { ...submission, status: 'failed' });
}

export function getSubmission(submissionId: string): Submission | undefined {
  return submissions.get(submissionId);
}

export function getEvaluation(submissionId: string): EvaluationResult | undefined {
  return evaluations.get(submissionId);
}

function toSummary(submission: Submission): SubmissionSummary {
  return { ...submission, evaluation: evaluations.get(submission.id) ?? null };
}

/** Submission history for a student on a given assessment, most recent first. */
export function listSubmissionsForStudent(assessmentId: string, studentId: string): SubmissionSummary[] {
  return Array.from(submissions.values())
    .filter((s) => s.assessmentId === assessmentId && s.studentId === studentId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .map(toSummary);
}

export function getSubmissionSummary(submissionId: string): SubmissionSummary | undefined {
  const submission = submissions.get(submissionId);
  return submission ? toSummary(submission) : undefined;
}

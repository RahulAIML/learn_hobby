import type { EvaluationResult } from '@/lib/assessment/schema';

export interface Submission {
  id: string;
  assessmentId: string;
  moduleId: string;
  courseSlug: string;
  studentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  submittedAt: string;
  status: 'evaluating' | 'evaluated' | 'failed';
}

export interface SubmissionSummary extends Submission {
  evaluation: EvaluationResult | null;
}

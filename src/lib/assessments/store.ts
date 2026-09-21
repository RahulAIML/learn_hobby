import { randomUUID } from 'crypto';
import { SEED_MODULE_ID } from '@/lib/modules/store';
import type { Assessment } from './types';

/** In-memory assessment store, one assessment per module — same non-durability limitation as other stores. */

const assessmentsByModule = new Map<string, Assessment>();

function seed() {
  const now = new Date().toISOString();
  const assessment: Assessment = {
    id: randomUUID(),
    moduleId: SEED_MODULE_ID,
    courseSlug: 'data-science',
    title: 'Module 2 Assessment: Lists vs. Tuples',
    instructions:
      'Answer the questions about Python lists and tuples covered in the module document. Explain mutability, syntax differences, and give one real-world use case for each. Upload your answers as a single file.',
    rubric:
      'Full credit requires: correct mutability explanation, correct syntax examples, at least one valid use case per data structure, and clear writing.',
    maxScore: 100,
    allowedFormats: ['.pdf', '.docx', '.xlsx', '.txt', '.png', '.jpg', '.jpeg'],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  assessmentsByModule.set(SEED_MODULE_ID, assessment);
}
seed();

export function getAssessmentByModule(moduleId: string): Assessment | undefined {
  return assessmentsByModule.get(moduleId);
}

export function getAssessmentById(assessmentId: string): Assessment | undefined {
  for (const assessment of Array.from(assessmentsByModule.values())) {
    if (assessment.id === assessmentId) return assessment;
  }
  return undefined;
}

export interface UpsertAssessmentInput {
  title: string;
  instructions: string;
  rubric?: string;
  maxScore?: number;
  allowedFormats?: string[];
  status?: 'active' | 'draft';
}

export function upsertAssessment(moduleId: string, courseSlug: string, input: UpsertAssessmentInput): Assessment {
  const existing = assessmentsByModule.get(moduleId);
  const now = new Date().toISOString();
  const assessment: Assessment = {
    id: existing?.id ?? randomUUID(),
    moduleId,
    courseSlug,
    title: input.title.trim(),
    instructions: input.instructions.trim(),
    rubric: input.rubric?.trim() ?? existing?.rubric ?? '',
    maxScore: input.maxScore ?? existing?.maxScore ?? 100,
    allowedFormats: input.allowedFormats ?? existing?.allowedFormats ?? ['.pdf', '.docx', '.xlsx', '.txt', '.png', '.jpg', '.jpeg'],
    status: input.status ?? existing?.status ?? 'active',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  assessmentsByModule.set(moduleId, assessment);
  return assessment;
}

export function deleteAssessmentForModule(moduleId: string): boolean {
  return assessmentsByModule.delete(moduleId);
}

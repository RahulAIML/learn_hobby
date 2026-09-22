export type CbtQuestionType = 'mcq' | 'fill_blank';
export type CbtAssessmentStatus = 'draft' | 'generated' | 'published' | 'archived';
export type CbtAttemptStatus = 'in_progress' | 'submitted' | 'expired';

export interface CbtQuestionInput {
  type: CbtQuestionType;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  explanation: string;
  difficulty: string;
  topic: string;
  orderIndex: number;
}

export interface CbtAssessmentInput {
  courseSlug: string;
  moduleId: string;
  title: string;
  topic: string;
  description: string;
  difficulty: string;
  timeLimitMinutes: number;
  mcqCount: number;
  fillBlankCount: number;
  optionsPerMcq: number;
}

export interface StudentQuestion {
  id: string;
  type: CbtQuestionType;
  questionText: string;
  options: { id: string; optionText: string; orderIndex: number }[];
  orderIndex: number;
}

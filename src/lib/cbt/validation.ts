import { z } from 'zod';

export const assessmentInputSchema = z.object({
  courseSlug: z.string().min(1).max(100), moduleId: z.string().uuid(),
  title: z.string().trim().min(3).max(300), topic: z.string().trim().min(2).max(300),
  description: z.string().trim().min(3).max(8000), difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  timeLimitMinutes: z.number().int().min(1).max(300), mcqCount: z.number().int().min(0).max(100),
  fillBlankCount: z.number().int().min(0).max(100), optionsPerMcq: z.number().int().min(2).max(6),
}).refine((data) => data.mcqCount + data.fillBlankCount > 0, { message: 'At least one question is required.' });

export const assessmentUpdateSchema = z.object({
  courseSlug: z.string().min(1).max(100).optional(),
  moduleId: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(300).optional(),
  topic: z.string().trim().min(2).max(300).optional(),
  description: z.string().trim().min(3).max(8000).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  timeLimitMinutes: z.number().int().min(1).max(300).optional(),
  mcqCount: z.number().int().min(0).max(100).optional(),
  fillBlankCount: z.number().int().min(0).max(100).optional(),
  optionsPerMcq: z.number().int().min(2).max(6).optional(),
});

export const questionInputSchema = z.object({
  type: z.enum(['mcq', 'fill_blank']), questionText: z.string().trim().min(3).max(5000),
  options: z.array(z.string().trim().min(1).max(1000)).min(2).max(6).optional(),
  correctAnswer: z.string().trim().min(1).max(1000), acceptableAnswers: z.array(z.string().trim().min(1).max(1000)).max(20).optional(),
  explanation: z.string().trim().min(1).max(5000), difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  topic: z.string().trim().min(2).max(300), orderIndex: z.number().int().min(1).max(1000),
}).superRefine((data, ctx) => {
  if (data.type === 'mcq' && (!data.options || !data.options.includes(data.correctAnswer))) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'MCQ correct answer must be one of its options.' });
  if (data.type === 'fill_blank' && data.options?.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Fill-in-the-blank questions cannot have options.' });
});

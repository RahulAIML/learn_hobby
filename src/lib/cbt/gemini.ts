import { z } from 'zod';
import { questionInputSchema } from './validation';
import type { CbtAssessmentInput, CbtQuestionInput } from './types';

const generatedQuestionSchema = z.object({
  type: z.enum(['mcq', 'fill_blank']),
  questionText: z.string().trim().min(3).max(5000),
  options: z.array(z.string().trim().min(1).max(1000)).min(2).max(6).optional(),
  correctAnswer: z.string().trim().min(1).max(1000),
  acceptableAnswers: z.array(z.string().trim().min(1).max(1000)).max(20).optional(),
  explanation: z.string().trim().min(1).max(5000),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  topic: z.string().trim().min(2).max(300),
}).superRefine((data, ctx) => {
  if (data.type === 'mcq' && (!data.options || !data.options.includes(data.correctAnswer))) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'MCQ correct answer must be one of its options.' });
  if (data.type === 'fill_blank' && data.options?.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Fill-in-the-blank questions cannot have options.' });
});

const generatedSetSchema = z.object({ questions: z.array(generatedQuestionSchema).min(1).max(200) });

export class CbtGenerationError extends Error {}

/** Server-only Gemini call. Generated questions are checked again before any DB write. */
export async function generateCbtQuestions(input: CbtAssessmentInput): Promise<CbtQuestionInput[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new CbtGenerationError('Gemini is not configured.');
  const total = input.mcqCount + input.fillBlankCount;
  const prompt = `Generate exactly ${input.mcqCount} multiple-choice and ${input.fillBlankCount} fill-in-the-blank questions for a ${input.difficulty} assessment.\nCourse: ${input.courseSlug}\nTopic: ${input.topic}\nInstructions: ${input.description}\nEach MCQ MUST contain exactly ${input.optionsPerMcq} distinct options and its correctAnswer must exactly match one option. Fill-in-the-blank questions must have no options; they MUST still include a "correctAnswer" string (not just acceptableAnswers). Return JSON only: {"questions":[{"type":"mcq|fill_blank","questionText":"...","options":["..."],"correctAnswer":"...","acceptableAnswers":["..."],"explanation":"...","difficulty":"beginner|intermediate|advanced","topic":"..."}]}.`;
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const body = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, responseMimeType: 'application/json' } });

  let response: Response | undefined;
  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    } catch {
      response = undefined;
    }
    if (response?.ok) break;
    // Retry only on transient server-side failures (overload, timeout); never on a network exception we can't diagnose or a 4xx (bad request/key).
    if (response && response.status < 500) break;
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
  }
  if (!response) throw new CbtGenerationError('Could not reach Gemini.');
  if (!response.ok) throw new CbtGenerationError('Gemini could not generate questions.');
  const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = payload.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
  if (!text) throw new CbtGenerationError('Gemini returned no questions.');
  let parsed: unknown; try { parsed = JSON.parse(text); } catch { throw new CbtGenerationError('Gemini returned invalid JSON.'); }
  // Gemini sometimes omits `correctAnswer` for fill_blank questions and only returns `acceptableAnswers`.
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { questions?: unknown }).questions)) {
    for (const q of (parsed as { questions: Record<string, unknown>[] }).questions) {
      if (q.type === 'fill_blank' && !q.correctAnswer && Array.isArray(q.acceptableAnswers) && q.acceptableAnswers.length > 0) {
        q.correctAnswer = q.acceptableAnswers[0];
      }
    }
  }
  const result = generatedSetSchema.safeParse(parsed);
  if (!result.success || result.data.questions.length !== total) {
    console.error('[cbt-generate] validation failed', {
      issues: result.success ? null : result.error.issues,
      questionCount: result.success ? result.data.questions.length : (parsed as { questions?: unknown[] })?.questions?.length,
      expectedTotal: total,
      rawText: text.slice(0, 4000),
    });
    throw new CbtGenerationError('Gemini did not return the requested number of valid questions.');
  }
  const mcqs = result.data.questions.filter((question) => question.type === 'mcq');
  const fills = result.data.questions.filter((question) => question.type === 'fill_blank');
  if (mcqs.length !== input.mcqCount || fills.length !== input.fillBlankCount || mcqs.some((question) => question.options?.length !== input.optionsPerMcq)) throw new CbtGenerationError('Gemini did not satisfy the requested question configuration.');
  return result.data.questions.map((question, index) => ({ ...question, orderIndex: index + 1 }));
}

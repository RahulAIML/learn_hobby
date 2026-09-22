import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { assessmentInputSchema } from '@/lib/cbt/validation';
import { createCbtAssessment, replaceQuestions } from '@/lib/cbt/store';
import { CbtGenerationError, generateCbtQuestions } from '@/lib/cbt/gemini';

export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req); if ('response' in auth) return auth.response;
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ success:false, error:{code:'invalid_request',message:'Invalid request.'}},{status:400}); }
  const parsed = assessmentInputSchema.safeParse(body); if (!parsed.success) return NextResponse.json({success:false,error:{code:'validation_error',message:parsed.error.issues[0]?.message ?? 'Invalid assessment configuration.'}},{status:400});
  try { const questions = await generateCbtQuestions(parsed.data); const assessment = await createCbtAssessment(parsed.data, auth.user.id, 'generated'); await replaceQuestions(assessment.id, questions); return NextResponse.json({success:true,assessment,questions},{status:201}); }
  catch (error) { return NextResponse.json({success:false,error:{code:'generation_failed',message:error instanceof CbtGenerationError ? error.message : 'Could not generate assessment.'}},{status:502}); }
}

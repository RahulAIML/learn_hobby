import { randomUUID } from 'crypto';
import { and, asc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { cbtAnswers, cbtAssessments, cbtAttempts, cbtQuestionOptions, cbtQuestions } from '@/lib/db/schema';
import type { CbtAssessmentInput, CbtQuestionInput, CbtAssessmentStatus, StudentQuestion } from './types';

export async function createCbtAssessment(input: CbtAssessmentInput, createdBy: string, status: CbtAssessmentStatus = 'draft') {
  const db = await getDb(); const id = randomUUID();
  const [row] = await db.insert(cbtAssessments).values({ id, ...input, createdBy, status, createdAt: new Date(), updatedAt: new Date() }).returning();
  return row;
}
export async function getCbtAssessment(id: string) { const db = await getDb(); const [row] = await db.select().from(cbtAssessments).where(eq(cbtAssessments.id, id)).limit(1); return row; }
/** Used by the student module page to show a "Take CBT Assessment" link — only ever surfaces a published assessment. */
export async function getPublishedCbtAssessmentByModule(moduleId: string) { const db = await getDb(); const [row] = await db.select().from(cbtAssessments).where(and(eq(cbtAssessments.moduleId, moduleId), eq(cbtAssessments.status, 'published'))).limit(1); return row; }
export async function listCbtAssessments(courseSlug?: string) { const db=await getDb(); return courseSlug ? db.select().from(cbtAssessments).where(eq(cbtAssessments.courseSlug, courseSlug)).orderBy(asc(cbtAssessments.createdAt)) : db.select().from(cbtAssessments).orderBy(asc(cbtAssessments.createdAt)); }
export async function updateCbtAssessment(id: string, values: Partial<CbtAssessmentInput> & { status?: CbtAssessmentStatus }) { const db=await getDb(); const [row]=await db.update(cbtAssessments).set({...values, updatedAt:new Date()}).where(eq(cbtAssessments.id,id)).returning(); return row; }
export async function replaceQuestions(assessmentId: string, questions: CbtQuestionInput[]) {
  const db=await getDb(); await db.delete(cbtQuestions).where(eq(cbtQuestions.assessmentId, assessmentId));
  for (const item of questions) await addQuestion(assessmentId, item);
}
export async function addQuestion(assessmentId: string, input: CbtQuestionInput) {
  const db=await getDb(); const id=randomUUID();
  const [question]=await db.insert(cbtQuestions).values({ id, assessmentId, type:input.type, questionText:input.questionText, correctAnswer:input.correctAnswer, acceptableAnswers:input.acceptableAnswers ?? [], explanation:input.explanation, difficulty:input.difficulty, topic:input.topic, orderIndex:input.orderIndex, createdAt:new Date(), updatedAt:new Date() }).returning();
  if (input.type==='mcq') for (let index = 0; index < (input.options ?? []).length; index++) { const optionText = input.options![index]; await db.insert(cbtQuestionOptions).values({id:randomUUID(),questionId:id,optionText,orderIndex:index+1,createdAt:new Date()}); }
  return question;
}
export async function listAdminQuestions(assessmentId: string) {
 const db=await getDb(); const rows=await db.select().from(cbtQuestions).where(eq(cbtQuestions.assessmentId,assessmentId)).orderBy(asc(cbtQuestions.orderIndex));
 return Promise.all(rows.map(async q=>({...q,options:await db.select().from(cbtQuestionOptions).where(eq(cbtQuestionOptions.questionId,q.id)).orderBy(asc(cbtQuestionOptions.orderIndex))})));
}
export async function listStudentQuestions(assessmentId: string): Promise<StudentQuestion[]> {
 const rows=await listAdminQuestions(assessmentId);
 return rows.map(({id,type,questionText,orderIndex,options})=>({id,type:type as StudentQuestion['type'],questionText,orderIndex,options:options.map(({id,optionText,orderIndex})=>({id,optionText,orderIndex}))}));
}
export async function getQuestion(id:string) { const db=await getDb(); const [row]=await db.select().from(cbtQuestions).where(eq(cbtQuestions.id,id)).limit(1); return row; }
export async function updateQuestion(id:string, input:CbtQuestionInput) { const db=await getDb(); const [row]=await db.update(cbtQuestions).set({type:input.type,questionText:input.questionText,correctAnswer:input.correctAnswer,acceptableAnswers:input.acceptableAnswers??[],explanation:input.explanation,difficulty:input.difficulty,topic:input.topic,orderIndex:input.orderIndex,updatedAt:new Date()}).where(eq(cbtQuestions.id,id)).returning(); await db.delete(cbtQuestionOptions).where(eq(cbtQuestionOptions.questionId,id)); if (input.type==='mcq') for(let i=0;i<(input.options??[]).length;i++){const optionText=input.options![i];await db.insert(cbtQuestionOptions).values({id:randomUUID(),questionId:id,optionText,orderIndex:i+1,createdAt:new Date()});} return row; }
export async function deleteQuestion(id:string) { const db=await getDb(); return (await db.delete(cbtQuestions).where(eq(cbtQuestions.id,id)).returning()).length>0; }
export async function getActiveAttempt(assessmentId:string, studentId:string) { const db=await getDb(); const [row]=await db.select().from(cbtAttempts).where(and(eq(cbtAttempts.assessmentId,assessmentId),eq(cbtAttempts.studentId,studentId),eq(cbtAttempts.status,'in_progress'))).limit(1); return row; }
export async function startAttempt(assessmentId:string, studentId:string) { const active=await getActiveAttempt(assessmentId,studentId); if(active)return active; const db=await getDb(); const [row]=await db.insert(cbtAttempts).values({id:randomUUID(),assessmentId,studentId,startedAt:new Date(),status:'in_progress',createdAt:new Date()}).returning(); return row; }
export async function getAttempt(id:string) {const db=await getDb();const [row]=await db.select().from(cbtAttempts).where(eq(cbtAttempts.id,id)).limit(1);return row;}
export async function listAttemptAnswers(attemptId:string) {const db=await getDb();return db.select().from(cbtAnswers).where(eq(cbtAnswers.attemptId,attemptId));}
export async function saveAnswer(attemptId:string,questionId:string,answer:string|null,markedForReview:boolean) {const db=await getDb(); const found=(await db.select().from(cbtAnswers).where(and(eq(cbtAnswers.attemptId,attemptId),eq(cbtAnswers.questionId,questionId))).limit(1))[0]; const values={answer,markedForReview:markedForReview?1:0,updatedAt:new Date()}; return found ? (await db.update(cbtAnswers).set(values).where(eq(cbtAnswers.id,found.id)).returning())[0] : (await db.insert(cbtAnswers).values({id:randomUUID(),attemptId,questionId,...values,createdAt:new Date()}).returning())[0];}
/** Post-submission review data — correct answers/explanations only ever returned for a non-in-progress attempt. */
export async function getAttemptResult(attemptId: string) {
  const attempt = await getAttempt(attemptId);
  if (!attempt || attempt.status === 'in_progress') return null;
  const assessment = await getCbtAssessment(attempt.assessmentId);
  if (!assessment) return null;
  const questions = await listAdminQuestions(assessment.id);
  const answers = await listAttemptAnswers(attemptId);
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));
  return {
    attempt,
    assessment,
    questions: questions.map((q) => ({
      id: q.id,
      type: q.type,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      acceptableAnswers: q.acceptableAnswers ?? [],
      explanation: q.explanation,
      orderIndex: q.orderIndex,
      studentAnswer: answerByQuestion.get(q.id)?.answer ?? null,
      isCorrect: answerByQuestion.get(q.id)?.isCorrect === 1,
    })),
  };
}
function normalize(value:string){return value.trim().toLocaleLowerCase().replace(/\s+/g,' ');}
export async function submitAttempt(attemptId:string) { const attempt=await getAttempt(attemptId); if(!attempt) return null; if(attempt.status!=='in_progress') return attempt; const assessment=await getCbtAssessment(attempt.assessmentId); if(!assessment)return null; const now=new Date(); const elapsed=Math.floor((now.getTime()-attempt.startedAt.getTime())/1000); const expired=elapsed>=assessment.timeLimitMinutes*60; const questions=await listAdminQuestions(assessment.id); const answers=await listAttemptAnswers(attemptId); const db=await getDb(); let score=0; for(const question of questions){const answer=answers.find(item=>item.questionId===question.id); const submitted=answer?.answer??null; const isCorrect=!!submitted && (question.type==='mcq'?submitted===question.correctAnswer:[question.correctAnswer,...(question.acceptableAnswers??[])].some(value=>normalize(value)===normalize(submitted))); if(answer) await db.update(cbtAnswers).set({isCorrect:isCorrect?1:0,marksAwarded:isCorrect?1:0,updatedAt:now}).where(eq(cbtAnswers.id,answer.id)); if(isCorrect)score++;} const [saved]=await db.update(cbtAttempts).set({status:expired?'expired':'submitted',submittedAt:now,score,maxScore:questions.length,percentage:questions.length?Math.round(score/questions.length*100):0,timeTakenSeconds:Math.min(elapsed,assessment.timeLimitMinutes*60)}).where(eq(cbtAttempts.id,attemptId)).returning(); return saved; }

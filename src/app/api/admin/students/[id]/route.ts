import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { getUserById, listEnrollments, updateProfile, updateUser } from '@/lib/auth/store';
import { getPaidUser } from '@/lib/auth/paidUsers';
import { toPublicUser } from '@/lib/auth/types';
import { getStudentPerformanceSummary, listAttemptsByStudent } from '@/lib/cbt/store';
import { isValidGoalPath } from '@/lib/profile/goalTaxonomy';

export const runtime = 'nodejs';

/** Full admin view of one student: profile + performance summary + every attempt (not just the latest). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const user = await getUserById(params.id);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Student not found.' } }, { status: 404 });
  }

  const [performance, attemptRows, enrollments, paidRecord] = await Promise.all([
    getStudentPerformanceSummary(user.id),
    listAttemptsByStudent(user.id),
    listEnrollments(user.id),
    getPaidUser(user.id),
  ]);

  const attempts = attemptRows.map(({ attempt, assessment }) => ({
    attemptId: attempt.id,
    assessmentId: assessment.id,
    title: assessment.title,
    topic: assessment.topic,
    status: attempt.status,
    score: attempt.score,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
  }));

  return NextResponse.json({
    success: true,
    profile: {
      ...toPublicUser(user),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    enrollments,
    paid: paidRecord ?? null,
    performance: {
      totalAttempts: performance.totalAttempts,
      completedAttempts: performance.completedAttempts,
      averagePercentage: performance.averagePercentage,
      bestPercentage: performance.bestPercentage,
      topicPerformance: performance.topicPerformance,
    },
    attempts,
  });
}

const adminUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    mobile: z.string().trim().min(1).max(20).nullable().optional(),
    age: z.number().int().min(10).max(100).optional(),
    goalCategory: z.string().trim().min(1).max(100).optional(),
    goalSubcategory: z.string().trim().min(1).max(100).optional(),
    goalOption: z.string().trim().min(1).max(150).optional(),
  })
  .superRefine((data, ctx) => {
    const goalFields = [data.goalCategory, data.goalSubcategory, data.goalOption];
    const provided = goalFields.filter((v) => v !== undefined).length;
    if (provided > 0 && provided < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'goalCategory, goalSubcategory, and goalOption must be provided together.' });
      return;
    }
    if (provided === 3 && !isValidGoalPath(data.goalCategory!, data.goalSubcategory!, data.goalOption!)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'That goal selection is not a valid option.' });
    }
  });

/** Admin editing a student's own profile fields (name/mobile via updateUser, age/goal via updateProfile). */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const existing = await getUserById(params.id);
  if (!existing || existing.role !== 'student') {
    return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Student not found.' } }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Invalid request body.' } }, { status: 400 });
  }

  const parsed = adminUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid profile data.' } },
      { status: 400 }
    );
  }

  const { name, mobile, ...profileFields } = parsed.data;

  if (name !== undefined || mobile !== undefined) {
    const result = await updateUser(params.id, { name, mobile });
    if ('error' in result) {
      return NextResponse.json({ success: false, error: { code: result.error, message: 'Could not update profile.' } }, { status: 400 });
    }
  }

  if (Object.keys(profileFields).length > 0) {
    const result = await updateProfile(params.id, profileFields);
    if ('error' in result) {
      return NextResponse.json({ success: false, error: { code: result.error, message: 'Could not update profile.' } }, { status: 404 });
    }
  }

  const updated = await getUserById(params.id);
  if (!updated) {
    return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Student not found.' } }, { status: 404 });
  }
  return NextResponse.json({ success: true, profile: toPublicUser(updated) });
}

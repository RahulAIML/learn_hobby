import { desc, eq, ne, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { cbtAssessments, cbtAttempts, courses, submissions, users } from '@/lib/db/schema';
import { getCbtAssessmentStats } from '@/lib/cbt/store';

/**
 * Real platform aggregates for the admin dashboard — every number here is a
 * live query against Postgres, nothing mocked. Replaces the placeholder
 * data the UI-shell step shipped with.
 */

export interface PlatformOverview {
  totalStudents: number;
  totalCourses: number;
  totalCbtAssessments: number;
  pendingReviews: number;
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const db = await getDb();
  const [[studentRow], [courseRow], [assessmentRow], [pendingRow]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'student')),
    db.select({ count: sql<number>`count(*)::int` }).from(courses),
    db.select({ count: sql<number>`count(*)::int` }).from(cbtAssessments).where(eq(cbtAssessments.status, 'published')),
    db.select({ count: sql<number>`count(*)::int` }).from(submissions).where(eq(submissions.status, 'evaluating')),
  ]);
  return {
    totalStudents: studentRow?.count ?? 0,
    totalCourses: courseRow?.count ?? 0,
    totalCbtAssessments: assessmentRow?.count ?? 0,
    pendingReviews: pendingRow?.count ?? 0,
  };
}

export interface RecentAssessmentRow {
  id: string;
  title: string;
  topic: string;
  status: string;
  attempts: number;
  avgPercentage: number | null;
}

/** Published/generated/draft CBT assessments, newest first, each with its real attempt count and average score. */
export async function getRecentCbtAssessments(limit = 5): Promise<RecentAssessmentRow[]> {
  const db = await getDb();
  const assessments = await db.select().from(cbtAssessments).orderBy(desc(cbtAssessments.createdAt)).limit(limit);
  return Promise.all(
    assessments.map(async (assessment) => {
      const stats = await getCbtAssessmentStats(assessment.id);
      return { id: assessment.id, title: assessment.title, topic: assessment.topic, status: assessment.status, ...stats };
    })
  );
}

export interface RecentAttemptActivity {
  attemptId: string;
  studentName: string;
  assessmentTitle: string;
  status: string;
  submittedAt: string;
}

/** Most recently submitted/expired CBT attempts across every student — the platform's real activity feed. */
export async function getRecentAttemptActivity(limit = 6): Promise<RecentAttemptActivity[]> {
  const db = await getDb();
  const rows = await db
    .select({ attempt: cbtAttempts, studentName: users.name, assessmentTitle: cbtAssessments.title })
    .from(cbtAttempts)
    .innerJoin(users, eq(cbtAttempts.studentId, users.id))
    .innerJoin(cbtAssessments, eq(cbtAttempts.assessmentId, cbtAssessments.id))
    .where(ne(cbtAttempts.status, 'in_progress'))
    .orderBy(desc(cbtAttempts.submittedAt))
    .limit(limit);

  return rows
    .filter((r) => r.attempt.submittedAt)
    .map((r) => ({
      attemptId: r.attempt.id,
      studentName: r.studentName,
      assessmentTitle: r.assessmentTitle,
      status: r.attempt.status,
      submittedAt: r.attempt.submittedAt!.toISOString(),
    }));
}

export interface RecentActiveStudent {
  id: string;
  name: string;
  email: string;
  attempts: number;
  avgPercentage: number | null;
  lastActive: string;
}

/** Students ordered by their most recent submitted attempt, each with real attempt count + average score. */
export async function getRecentActiveStudents(limit = 5): Promise<RecentActiveStudent[]> {
  const db = await getDb();
  const rows = await db
    .select({ attempt: cbtAttempts, studentId: users.id, studentName: users.name, studentEmail: users.email })
    .from(cbtAttempts)
    .innerJoin(users, eq(cbtAttempts.studentId, users.id))
    .where(ne(cbtAttempts.status, 'in_progress'))
    .orderBy(desc(cbtAttempts.submittedAt));

  const byStudent = new Map<string, { name: string; email: string; attempts: number; scoredSum: number; scoredCount: number; lastActive: string }>();
  for (const row of rows) {
    if (!row.attempt.submittedAt) continue;
    const existing = byStudent.get(row.studentId);
    if (existing) {
      existing.attempts += 1;
      if (row.attempt.percentage !== null) {
        existing.scoredSum += row.attempt.percentage;
        existing.scoredCount += 1;
      }
    } else {
      byStudent.set(row.studentId, {
        name: row.studentName,
        email: row.studentEmail,
        attempts: 1,
        scoredSum: row.attempt.percentage ?? 0,
        scoredCount: row.attempt.percentage !== null ? 1 : 0,
        lastActive: row.attempt.submittedAt.toISOString(),
      });
    }
  }

  return Array.from(byStudent.entries())
    .slice(0, limit)
    .map(([id, s]) => ({
      id,
      name: s.name,
      email: s.email,
      attempts: s.attempts,
      avgPercentage: s.scoredCount ? Math.round(s.scoredSum / s.scoredCount) : null,
      lastActive: s.lastActive,
    }));
}

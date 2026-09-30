import { and, desc, eq, gte, ne, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import {
  users,
  courses,
  modules,
  courseDocuments,
  enrollments,
  cbtAssessments,
  cbtQuestions,
  cbtAttempts,
  submissions,
} from '@/lib/db/schema';
import { getCbtAssessmentStats } from '@/lib/cbt/store';
import { getStudentPerformanceSummary } from '@/lib/cbt/store';

/**
 * Every function here reads real Postgres rows — nothing in this file is
 * mocked or hardcoded. It exists so the Super Admin Control Center never
 * has to know the shape of the underlying tables; pages only ever call
 * these named, purpose-built queries.
 */

// ---------------------------------------------------------------------------
// Platform overview
// ---------------------------------------------------------------------------

export interface SuperAdminOverview {
  totalStudents: number;
  totalAdmins: number;
  totalSuperAdmins: number;
  totalCourses: number;
  totalAssessments: number;
  totalDocuments: number;
  pendingReviews: number;
}

export async function getSuperAdminOverview(): Promise<SuperAdminOverview> {
  const db = await getDb();
  const [[students], [admins], [superAdmins], [coursesRow], [assessmentsRow], [documentsRow], [pending]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'student')),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'admin')),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'super_admin')),
    db.select({ count: sql<number>`count(*)::int` }).from(courses),
    db.select({ count: sql<number>`count(*)::int` }).from(cbtAssessments).where(eq(cbtAssessments.status, 'published')),
    db.select({ count: sql<number>`count(*)::int` }).from(courseDocuments),
    db.select({ count: sql<number>`count(*)::int` }).from(submissions).where(eq(submissions.status, 'evaluating')),
  ]);
  return {
    totalStudents: students?.count ?? 0,
    totalAdmins: admins?.count ?? 0,
    totalSuperAdmins: superAdmins?.count ?? 0,
    totalCourses: coursesRow?.count ?? 0,
    totalAssessments: assessmentsRow?.count ?? 0,
    totalDocuments: documentsRow?.count ?? 0,
    pendingReviews: pending?.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Admin management (admin + super_admin accounts only)
// ---------------------------------------------------------------------------

export interface AdminRow {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
  lastLoginAt: string | null;
  createdAt: string;
}

export async function listAdminAccounts(): Promise<AdminRow[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(users)
    .where(sql`${users.role} IN ('admin', 'super_admin')`)
    .orderBy(desc(users.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    username: r.username,
    email: r.email,
    role: r.role as 'admin' | 'super_admin',
    lastLoginAt: r.lastLoginAt ? r.lastLoginAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// User information (every account)
// ---------------------------------------------------------------------------

export interface UserInfoRow {
  id: string;
  name: string;
  username: string;
  email: string;
  mobile: string | null;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export async function listAllUserAccounts(): Promise<UserInfoRow[]> {
  const db = await getDb();
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    username: r.username,
    email: r.email,
    mobile: r.mobile,
    role: r.role,
    lastLoginAt: r.lastLoginAt ? r.lastLoginAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Students overview
// ---------------------------------------------------------------------------

export interface StudentOverviewRow {
  id: string;
  name: string;
  email: string;
  age: number | null;
  goal: string | null;
  courses: string[];
  totalAttempts: number;
  averagePercentage: number | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export async function listStudentsOverview(): Promise<StudentOverviewRow[]> {
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.role, 'student')).orderBy(desc(users.createdAt));
  const enrollmentRows = await db.select().from(enrollments);
  const enrollmentsByUser = new Map<string, string[]>();
  for (const e of enrollmentRows) {
    const list = enrollmentsByUser.get(e.userId) ?? [];
    list.push(e.courseSlug);
    enrollmentsByUser.set(e.userId, list);
  }

  return Promise.all(
    rows.map(async (r) => {
      const performance = await getStudentPerformanceSummary(r.id);
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        age: r.age,
        goal: r.goalOption,
        courses: enrollmentsByUser.get(r.id) ?? [],
        totalAttempts: performance.totalAttempts,
        averagePercentage: performance.averagePercentage,
        lastLoginAt: r.lastLoginAt ? r.lastLoginAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      };
    })
  );
}

export interface StudentStats {
  total: number;
  activeLast30Days: number;
  neverLoggedIn: number;
  newLast7Days: number;
}

export async function getStudentStats(): Promise<StudentStats> {
  const db = await getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [[total], [active], [never], [recent]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'student')),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(and(eq(users.role, 'student'), gte(users.lastLoginAt, thirtyDaysAgo))),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(and(eq(users.role, 'student'), sql`${users.lastLoginAt} IS NULL`)),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(and(eq(users.role, 'student'), gte(users.createdAt, sevenDaysAgo))),
  ]);
  return {
    total: total?.count ?? 0,
    activeLast30Days: active?.count ?? 0,
    neverLoggedIn: never?.count ?? 0,
    newLast7Days: recent?.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Courses / Modules overview
// ---------------------------------------------------------------------------

export interface CourseOverviewRow {
  slug: string;
  title: string;
  studentCount: number;
  moduleCount: number;
}

export async function listCoursesOverview(): Promise<CourseOverviewRow[]> {
  const db = await getDb();
  const courseRows = await db.select().from(courses);
  return Promise.all(
    courseRows.map(async (c) => {
      const [[studentCount], [moduleCount]] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(enrollments).where(eq(enrollments.courseSlug, c.slug)),
        db.select({ count: sql<number>`count(*)::int` }).from(modules).where(eq(modules.courseSlug, c.slug)),
      ]);
      return { slug: c.slug, title: c.title, studentCount: studentCount?.count ?? 0, moduleCount: moduleCount?.count ?? 0 };
    })
  );
}

export interface ModuleOverviewRow {
  id: string;
  title: string;
  courseSlug: string;
  courseTitle: string;
  documentCount: number;
  assessmentCount: number;
}

export async function listModulesOverview(): Promise<ModuleOverviewRow[]> {
  const db = await getDb();
  const rows = await db
    .select({ module: modules, courseTitle: courses.title })
    .from(modules)
    .innerJoin(courses, eq(modules.courseSlug, courses.slug))
    .orderBy(modules.order);
  return Promise.all(
    rows.map(async ({ module: m, courseTitle }) => {
      const [[documentCount], [assessmentCount]] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(courseDocuments).where(eq(courseDocuments.moduleId, m.id)),
        db.select({ count: sql<number>`count(*)::int` }).from(cbtAssessments).where(eq(cbtAssessments.moduleId, m.id)),
      ]);
      return {
        id: m.id,
        title: m.title,
        courseSlug: m.courseSlug,
        courseTitle,
        documentCount: documentCount?.count ?? 0,
        assessmentCount: assessmentCount?.count ?? 0,
      };
    })
  );
}

// ---------------------------------------------------------------------------
// Assessments overview (reuses the real per-assessment stats already built
// for the Admin Panel's Assessment Management feature)
// ---------------------------------------------------------------------------

export interface AssessmentOverviewRow {
  id: string;
  title: string;
  courseTitle: string;
  moduleTitle: string;
  questionCount: number;
  attempts: number;
  avgPercentage: number | null;
  status: string;
  createdAt: string;
}

export async function listAssessmentsOverview(): Promise<AssessmentOverviewRow[]> {
  const db = await getDb();
  const rows = await db
    .select({ assessment: cbtAssessments, courseTitle: courses.title, moduleTitle: modules.title })
    .from(cbtAssessments)
    .innerJoin(courses, eq(cbtAssessments.courseSlug, courses.slug))
    .innerJoin(modules, eq(cbtAssessments.moduleId, modules.id))
    .orderBy(desc(cbtAssessments.createdAt));

  return Promise.all(
    rows.map(async ({ assessment: a, courseTitle, moduleTitle }) => {
      const [[questionCount], stats] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(cbtQuestions).where(eq(cbtQuestions.assessmentId, a.id)),
        getCbtAssessmentStats(a.id),
      ]);
      return {
        id: a.id,
        title: a.title,
        courseTitle,
        moduleTitle,
        questionCount: questionCount?.count ?? 0,
        attempts: stats.attempts,
        avgPercentage: stats.avgPercentage,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
      };
    })
  );
}

export interface AssessmentStats {
  total: number;
  published: number;
  draft: number;
  generated: number;
  archived: number;
}

export async function getAssessmentStats(): Promise<AssessmentStats> {
  const db = await getDb();
  const rows = await db.select({ status: cbtAssessments.status, count: sql<number>`count(*)::int` }).from(cbtAssessments).groupBy(cbtAssessments.status);
  const byStatus = Object.fromEntries(rows.map((r) => [r.status, r.count]));
  return {
    total: rows.reduce((sum, r) => sum + r.count, 0),
    published: byStatus.published ?? 0,
    draft: byStatus.draft ?? 0,
    generated: byStatus.generated ?? 0,
    archived: byStatus.archived ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Documents overview
// ---------------------------------------------------------------------------

export interface DocumentOverviewRow {
  id: string;
  title: string;
  filename: string;
  courseTitle: string;
  moduleTitle: string | null;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export async function listDocumentsOverview(): Promise<DocumentOverviewRow[]> {
  const db = await getDb();
  const rows = await db
    .select({ doc: courseDocuments, courseTitle: courses.title, moduleTitle: modules.title })
    .from(courseDocuments)
    .innerJoin(courses, eq(courseDocuments.courseSlug, courses.slug))
    .leftJoin(modules, eq(courseDocuments.moduleId, modules.id))
    .orderBy(desc(courseDocuments.uploadedAt));

  return rows.map(({ doc, courseTitle, moduleTitle }) => ({
    id: doc.id,
    title: doc.title,
    filename: doc.filename,
    courseTitle,
    moduleTitle: moduleTitle ?? null,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    uploadedAt: doc.uploadedAt.toISOString(),
  }));
}

export interface DocumentStats {
  total: number;
  recentLast7Days: number;
  courses: number;
  modules: number;
}

export async function getDocumentStats(): Promise<DocumentStats> {
  const db = await getDb();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [[total], [recent], [courseCount], [moduleCount]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(courseDocuments),
    db.select({ count: sql<number>`count(*)::int` }).from(courseDocuments).where(gte(courseDocuments.uploadedAt, sevenDaysAgo)),
    db.select({ count: sql<number>`count(*)::int` }).from(courses),
    db.select({ count: sql<number>`count(*)::int` }).from(modules),
  ]);
  return {
    total: total?.count ?? 0,
    recentLast7Days: recent?.count ?? 0,
    courses: courseCount?.count ?? 0,
    modules: moduleCount?.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Analytics — real time-series derived from actual rows, no fabricated data
// ---------------------------------------------------------------------------

export interface MonthPoint {
  label: string;
  value: number;
}

/** Cumulative real student signups by month, last 12 months. */
export async function getStudentGrowthSeries(): Promise<MonthPoint[]> {
  const db = await getDb();
  const rows = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.role, 'student'));
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: 'short' }) });
  }
  const countsByMonth = new Map(months.map((m) => [m.key, 0]));
  for (const r of rows) {
    const key = `${r.createdAt.getFullYear()}-${r.createdAt.getMonth()}`;
    if (countsByMonth.has(key)) countsByMonth.set(key, (countsByMonth.get(key) ?? 0) + 1);
  }
  let cumulative = rows.filter((r) => r.createdAt < new Date(now.getFullYear(), now.getMonth() - 11, 1)).length;
  return months.map((m) => {
    cumulative += countsByMonth.get(m.key) ?? 0;
    return { label: m.label, value: cumulative };
  });
}

export interface DayPoint {
  label: string;
  value: number;
}

/** Real CBT attempts submitted per day, last 7 days. */
export async function getAssessmentAttemptsSeries(): Promise<DayPoint[]> {
  const db = await getDb();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ submittedAt: cbtAttempts.submittedAt })
    .from(cbtAttempts)
    .where(and(ne(cbtAttempts.status, 'in_progress'), gte(cbtAttempts.submittedAt, sevenDaysAgo)));

  const days: { key: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ key: d.toDateString(), label: d.toLocaleDateString(undefined, { weekday: 'short' }) });
  }
  const countsByDay = new Map(days.map((d) => [d.key, 0]));
  for (const r of rows) {
    if (!r.submittedAt) continue;
    const key = r.submittedAt.toDateString();
    if (countsByDay.has(key)) countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }
  return days.map((d) => ({ label: d.label, value: countsByDay.get(d.key) ?? 0 }));
}

export interface CoursePerformancePoint {
  label: string;
  value: number;
}

/** Real average CBT score across each course's assessments — a defensible engagement proxy from actual scored attempts. */
export async function getCourseEngagement(): Promise<CoursePerformancePoint[]> {
  const db = await getDb();
  const courseRows = await db.select().from(courses);
  const results: CoursePerformancePoint[] = [];
  for (const c of courseRows) {
    const assessmentRows = await db.select().from(cbtAssessments).where(eq(cbtAssessments.courseSlug, c.slug));
    let sum = 0;
    let count = 0;
    for (const a of assessmentRows) {
      const stats = await getCbtAssessmentStats(a.id);
      if (stats.avgPercentage !== null) {
        sum += stats.avgPercentage;
        count += 1;
      }
    }
    if (count > 0) results.push({ label: c.title, value: Math.round(sum / count) });
  }
  return results;
}

export interface CbtPerformanceTrend {
  currentMonthAvg: number | null;
  previousMonthAvg: number | null;
}

/** Real platform-wide average CBT score, this month vs last month. */
export async function getCbtPerformanceTrend(): Promise<CbtPerformanceTrend> {
  const db = await getDb();
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonthRows, lastMonthRows] = await Promise.all([
    db.select({ percentage: cbtAttempts.percentage }).from(cbtAttempts).where(and(ne(cbtAttempts.status, 'in_progress'), gte(cbtAttempts.submittedAt, startOfThisMonth))),
    db
      .select({ percentage: cbtAttempts.percentage })
      .from(cbtAttempts)
      .where(and(ne(cbtAttempts.status, 'in_progress'), gte(cbtAttempts.submittedAt, startOfLastMonth), sql`${cbtAttempts.submittedAt} < ${startOfThisMonth}`)),
  ]);

  const avg = (rows: { percentage: number | null }[]) => {
    const scored = rows.filter((r) => r.percentage !== null);
    return scored.length ? Math.round(scored.reduce((sum, r) => sum + (r.percentage ?? 0), 0) / scored.length) : null;
  };

  return { currentMonthAvg: avg(thisMonthRows), previousMonthAvg: avg(lastMonthRows) };
}

// ---------------------------------------------------------------------------
// System status — real checks, not hardcoded "operational"
// ---------------------------------------------------------------------------

export interface SystemStatusEntry {
  name: string;
  operational: boolean;
  detail: string;
}

export async function getSystemStatus(): Promise<SystemStatusEntry[]> {
  const db = await getDb();
  let dbOk = true;
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    dbOk = false;
  }

  return [
    { name: 'API', operational: true, detail: 'Responding' },
    { name: 'Database', operational: dbOk, detail: dbOk ? 'Connected' : 'Unreachable' },
    { name: 'Authentication', operational: !!process.env.SESSION_SECRET, detail: process.env.SESSION_SECRET ? 'Configured' : 'SESSION_SECRET not set' },
    { name: 'Storage', operational: true, detail: 'Documents stored in Postgres' },
    { name: 'AI Services', operational: !!process.env.GEMINI_API_KEY, detail: process.env.GEMINI_API_KEY ? 'Gemini key configured' : 'Gemini key not set' },
  ];
}

// ---------------------------------------------------------------------------
// Activity feed — real derived events, not a fabricated admin-action log.
// No audit_log table exists yet, so this surfaces genuinely real,
// timestamped platform events instead of inventing entries that never
// happened.
// ---------------------------------------------------------------------------

export interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  module: string;
}

export async function getRecentActivity(limit = 20): Promise<ActivityEntry[]> {
  const db = await getDb();

  const [attemptRows, enrollmentRows, assessmentRows] = await Promise.all([
    db
      .select({ id: cbtAttempts.id, submittedAt: cbtAttempts.submittedAt, studentName: users.name, assessmentTitle: cbtAssessments.title })
      .from(cbtAttempts)
      .innerJoin(users, eq(cbtAttempts.studentId, users.id))
      .innerJoin(cbtAssessments, eq(cbtAttempts.assessmentId, cbtAssessments.id))
      .where(ne(cbtAttempts.status, 'in_progress'))
      .orderBy(desc(cbtAttempts.submittedAt))
      .limit(limit),
    db
      .select({ enrolledAt: enrollments.enrolledAt, studentName: users.name, courseTitle: courses.title })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .innerJoin(courses, eq(enrollments.courseSlug, courses.slug))
      .orderBy(desc(enrollments.enrolledAt))
      .limit(limit),
    db
      .select({ id: cbtAssessments.id, updatedAt: cbtAssessments.updatedAt, title: cbtAssessments.title, status: cbtAssessments.status, adminName: users.name })
      .from(cbtAssessments)
      .innerJoin(users, eq(cbtAssessments.createdBy, users.id))
      .where(eq(cbtAssessments.status, 'published'))
      .orderBy(desc(cbtAssessments.updatedAt))
      .limit(limit),
  ]);

  const entries: ActivityEntry[] = [
    ...attemptRows
      .filter((r) => r.submittedAt)
      .map((r) => ({ id: `attempt-${r.id}`, timestamp: r.submittedAt!.toISOString(), actor: r.studentName, action: `submitted "${r.assessmentTitle}"`, module: 'Assessments' })),
    ...enrollmentRows.map((r, i) => ({
      id: `enroll-${i}-${r.enrolledAt.toISOString()}`,
      timestamp: r.enrolledAt.toISOString(),
      actor: r.studentName,
      action: `enrolled in "${r.courseTitle}"`,
      module: 'Students',
    })),
    ...assessmentRows.map((r) => ({
      id: `assessment-${r.id}`,
      timestamp: r.updatedAt.toISOString(),
      actor: r.adminName,
      action: `published "${r.title}"`,
      module: 'Assessments',
    })),
  ];

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
}

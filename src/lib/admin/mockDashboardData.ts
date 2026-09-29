/**
 * Structured placeholder data for the admin Dashboard home UI shell ONLY.
 * Nothing here is wired to Postgres or any API — it exists so the layout,
 * typography, and component shape can be designed now and swapped for real
 * `fetch()` calls later without touching JSX. Shape mirrors what the real
 * endpoints will eventually return (see src/lib/cbt/store.ts's
 * getStudentPerformanceSummary for the closest real precedent).
 */

export interface MockStat {
  label: string;
  value: string;
  delta?: { value: string; direction: 'up' | 'down' | 'flat' };
  icon: 'students' | 'courses' | 'assessments' | 'pending';
}

export const MOCK_STATS: MockStat[] = [
  { label: 'Students', value: '248', delta: { value: '+12 this week', direction: 'up' }, icon: 'students' },
  { label: 'Active Courses', value: '6', delta: { value: 'no change', direction: 'flat' }, icon: 'courses' },
  { label: 'CBT Assessments', value: '14', delta: { value: '+3 this week', direction: 'up' }, icon: 'assessments' },
  { label: 'Pending Reviews', value: '5', delta: { value: '-2 since yesterday', direction: 'down' }, icon: 'pending' },
];

export interface MockActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

export const MOCK_RECENT_ACTIVITY: MockActivityItem[] = [
  { id: 'a1', actor: 'Priya Sharma', action: 'submitted', target: 'Python Lists vs Tuples Quiz', timestamp: '12 minutes ago' },
  { id: 'a2', actor: 'Admin', action: 'published', target: 'SQL Fundamentals CBT', timestamp: '1 hour ago' },
  { id: 'a3', actor: 'Rahul Verma', action: 'enrolled in', target: 'Data Science Championship Program', timestamp: '3 hours ago' },
  { id: 'a4', actor: 'Admin', action: 'uploaded', target: 'Module 3 — Pandas Fundamentals.pdf', timestamp: '5 hours ago' },
  { id: 'a5', actor: 'Ananya Iyer', action: 'submitted', target: 'Machine Learning Basics CBT', timestamp: 'Yesterday' },
];

export interface MockAssessmentRow {
  id: string;
  title: string;
  topic: string;
  status: 'Published' | 'Draft' | 'Generated';
  attempts: number;
  avgScore: string;
}

export const MOCK_RECENT_ASSESSMENTS: MockAssessmentRow[] = [
  { id: 'r1', title: 'Python Lists vs Tuples Quiz', topic: 'Python Fundamentals', status: 'Published', attempts: 42, avgScore: '71%' },
  { id: 'r2', title: 'SQL Fundamentals CBT', topic: 'SQL', status: 'Published', attempts: 28, avgScore: '64%' },
  { id: 'r3', title: 'Machine Learning Basics', topic: 'Machine Learning', status: 'Published', attempts: 19, avgScore: '58%' },
  { id: 'r4', title: 'Pandas Deep Dive', topic: 'Data Analysis', status: 'Draft', attempts: 0, avgScore: '—' },
];

export interface MockStudentRow {
  id: string;
  name: string;
  email: string;
  attempts: number;
  avgScore: string;
  lastActive: string;
}

export const MOCK_STUDENT_ACTIVITY: MockStudentRow[] = [
  { id: 's1', name: 'Priya Sharma', email: 'priya.sharma@gurukul.dev', attempts: 6, avgScore: '78%', lastActive: '12 minutes ago' },
  { id: 's2', name: 'Rahul Verma', email: 'rahul.verma@gurukul.dev', attempts: 4, avgScore: '65%', lastActive: '3 hours ago' },
  { id: 's3', name: 'Ananya Iyer', email: 'ananya.iyer@gurukul.dev', attempts: 9, avgScore: '82%', lastActive: 'Yesterday' },
  { id: 's4', name: 'Karan Mehta', email: 'karan.mehta@gurukul.dev', attempts: 2, avgScore: '54%', lastActive: '2 days ago' },
];

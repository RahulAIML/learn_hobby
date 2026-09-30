/**
 * Structured placeholder data for the Super Admin Control Center UI ONLY.
 * Nothing here is wired to Postgres or any API. Shape mirrors what the real
 * endpoints will eventually return (see src/lib/admin/dashboardStats.ts and
 * src/lib/cbt/store.ts for the closest real precedents this will be
 * replaced with) so swapping in real data later only touches the fetch
 * call, never the JSX.
 */

export interface MockDelta {
  value: string;
  direction: 'up' | 'down' | 'flat';
}

// ---------------------------------------------------------------------------
// Dashboard overview
// ---------------------------------------------------------------------------

export interface MockOverviewMetric {
  label: string;
  value: string;
  delta?: MockDelta;
}

export const mockPlatformMetrics: MockOverviewMetric[] = [
  { label: 'Total Students', value: '12,842', delta: { value: '+8.4% this month', direction: 'up' } },
  { label: 'Active Students', value: '9,204', delta: { value: '+3.1% this week', direction: 'up' } },
  { label: 'Total Admins', value: '18', delta: { value: 'no change', direction: 'flat' } },
  { label: 'Active Admins', value: '12', delta: { value: '+2 this week', direction: 'up' } },
  { label: 'Courses', value: '06', delta: { value: 'all active', direction: 'flat' } },
  { label: 'Assessments', value: '124', delta: { value: '+9 this month', direction: 'up' } },
];

export const mockPlatformOverview: MockOverviewMetric[] = [
  { label: 'Students', value: '12,842', delta: { value: '+8.4%', direction: 'up' } },
  { label: 'Courses', value: '06', delta: { value: 'Active', direction: 'flat' } },
  { label: 'Assessments', value: '124', delta: { value: 'Published', direction: 'flat' } },
  { label: 'Documents', value: '486', delta: { value: 'Uploaded', direction: 'flat' } },
];

// ---------------------------------------------------------------------------
// Charts (line/bar/trend — rendered as lightweight inline SVG, no chart lib)
// ---------------------------------------------------------------------------

export const mockStudentGrowth = [820, 940, 1050, 1180, 1240, 1390, 1520, 1610, 1780, 1890, 2040, 2210];
export const mockStudentGrowthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const mockAssessmentAttempts = [
  { label: 'Mon', value: 142 },
  { label: 'Tue', value: 188 },
  { label: 'Wed', value: 165 },
  { label: 'Thu', value: 210 },
  { label: 'Fri', value: 246 },
  { label: 'Sat', value: 98 },
  { label: 'Sun', value: 76 },
];

export const mockCbtPerformanceTrend = { current: 71, previous: 66, delta: { value: '+5 pts vs last month', direction: 'up' as const } };

export const mockCourseEngagement = [
  { label: 'Data Science Championship', value: 88 },
  { label: 'Full-Stack Web Dev', value: 74 },
  { label: 'Cloud & DevOps', value: 61 },
  { label: 'AI & ML Foundations', value: 55 },
];

export const mockDocumentActivity = [
  { label: 'Mon', value: 12 },
  { label: 'Tue', value: 18 },
  { label: 'Wed', value: 9 },
  { label: 'Thu', value: 22 },
  { label: 'Fri', value: 15 },
  { label: 'Sat', value: 4 },
  { label: 'Sun', value: 2 },
];

// ---------------------------------------------------------------------------
// System status
// ---------------------------------------------------------------------------

export type SystemStatusLevel = 'operational' | 'degraded' | 'down';

export interface MockSystemStatus {
  name: string;
  level: SystemStatusLevel;
}

export const mockSystemStatus: MockSystemStatus[] = [
  { name: 'API', level: 'operational' },
  { name: 'Database', level: 'operational' },
  { name: 'Authentication', level: 'operational' },
  { name: 'Storage', level: 'operational' },
  { name: 'AI Services', level: 'operational' },
];

// ---------------------------------------------------------------------------
// Admin management
// ---------------------------------------------------------------------------

export interface MockAdmin {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Moderator';
  status: 'Active' | 'Disabled';
  lastLogin: string;
  createdAt: string;
}

export const mockAdmins: MockAdmin[] = [
  { id: 'ad1', name: 'Rahul Bhattacharya', username: 'rahul_admin', email: 'rahul@gurukul.dev', role: 'Super Admin', status: 'Active', lastLogin: 'Today, 9:12 AM', createdAt: 'Jan 12, 2026' },
  { id: 'ad2', name: 'Ananya Iyer', username: 'ananya_ops', email: 'ananya@gurukul.dev', role: 'Admin', status: 'Active', lastLogin: 'Today, 8:04 AM', createdAt: 'Feb 3, 2026' },
  { id: 'ad3', name: 'Karan Mehta', username: 'karan_content', email: 'karan@gurukul.dev', role: 'Admin', status: 'Active', lastLogin: 'Yesterday', createdAt: 'Mar 18, 2026' },
  { id: 'ad4', name: 'Priya Sharma', username: 'priya_support', email: 'priya@gurukul.dev', role: 'Moderator', status: 'Disabled', lastLogin: '2 weeks ago', createdAt: 'Apr 22, 2026' },
  { id: 'ad5', name: 'Devika Rao', username: 'devika_ops', email: 'devika@gurukul.dev', role: 'Admin', status: 'Active', lastLogin: '3 days ago', createdAt: 'May 9, 2026' },
];

// ---------------------------------------------------------------------------
// User information (all registered accounts, student + admin)
// ---------------------------------------------------------------------------

export interface MockUserInfo {
  id: string;
  name: string;
  username: string;
  email: string;
  mobile: string;
  role: 'Student' | 'Admin' | 'Moderator';
  status: 'Active' | 'Inactive' | 'Suspended';
  joined: string;
  lastActive: string;
}

const FIRST_NAMES = ['Priya', 'Rahul', 'Ananya', 'Karan', 'Devika', 'Arjun', 'Meera', 'Vikram', 'Sneha', 'Aditya', 'Kavya', 'Rohan'];
const LAST_NAMES = ['Sharma', 'Verma', 'Iyer', 'Mehta', 'Rao', 'Nair', 'Gupta', 'Reddy', 'Kapoor', 'Joshi'];
const STATUSES: MockUserInfo['status'][] = ['Active', 'Active', 'Active', 'Inactive', 'Suspended'];

export const mockUsers: MockUserInfo[] = Array.from({ length: 42 }, (_, i) => {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[(i * 3) % LAST_NAMES.length];
  return {
    id: `user-${i + 1}`,
    name: `${first} ${last}`,
    username: `${first.toLowerCase()}_${last.toLowerCase()}${i}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@gurukul.dev`,
    mobile: `+91 98${(100000000 + i * 137).toString().slice(0, 8)}`,
    role: i % 11 === 0 ? 'Admin' : i % 17 === 0 ? 'Moderator' : 'Student',
    status: STATUSES[i % STATUSES.length],
    joined: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i % 6]} ${(i % 27) + 1}, 2026`,
    lastActive: i % 4 === 0 ? 'Today' : i % 4 === 1 ? 'Yesterday' : i % 4 === 2 ? '3 days ago' : '2 weeks ago',
  };
});

// ---------------------------------------------------------------------------
// Students overview
// ---------------------------------------------------------------------------

export interface MockStudentOverview {
  id: string;
  name: string;
  email: string;
  course: string;
  goal: string;
  age: number;
  status: 'Active' | 'Inactive';
  joined: string;
  lastActive: string;
}

const COURSES = ['Data Science Championship', 'Full-Stack Web Dev', 'Cloud & DevOps', 'AI & ML Foundations'];
const GOALS = ['Get my first job', 'Switch career', 'Learn Python', 'Higher-paying job', 'Build projects'];

export const mockStudentsOverview: MockStudentOverview[] = Array.from({ length: 24 }, (_, i) => {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[(i * 5) % LAST_NAMES.length];
  return {
    id: `stu-${i + 1}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@gurukul.dev`,
    course: COURSES[i % COURSES.length],
    goal: GOALS[i % GOALS.length],
    age: 19 + (i % 15),
    status: i % 5 === 0 ? 'Inactive' : 'Active',
    joined: `${['Jan', 'Feb', 'Mar', 'Apr', 'May'][i % 5]} ${(i % 27) + 1}, 2026`,
    lastActive: i % 3 === 0 ? 'Today' : i % 3 === 1 ? '2 days ago' : '1 week ago',
  };
});

export const mockStudentStats = { total: 12842, active: 9204, inactive: 3638, newThisWeek: 214 };

// ---------------------------------------------------------------------------
// Assessment overview
// ---------------------------------------------------------------------------

export interface MockAssessmentOverview {
  id: string;
  title: string;
  course: string;
  module: string;
  questions: number;
  attempts: number;
  status: 'Published' | 'Draft' | 'Archived';
  createdAt: string;
}

export const mockAssessmentsOverview: MockAssessmentOverview[] = [
  { id: 'asm-1', title: 'Python Lists vs Tuples Quiz', course: 'Data Science Championship', module: 'Python for Data Analysis', questions: 5, attempts: 312, status: 'Published', createdAt: 'Sep 24, 2026' },
  { id: 'asm-2', title: 'SQL Fundamentals CBT', course: 'Data Science Championship', module: 'Database Foundations', questions: 15, attempts: 198, status: 'Published', createdAt: 'Sep 20, 2026' },
  { id: 'asm-3', title: 'React Hooks Deep Dive', course: 'Full-Stack Web Dev', module: 'Advanced React', questions: 12, attempts: 87, status: 'Published', createdAt: 'Sep 18, 2026' },
  { id: 'asm-4', title: 'Docker & Kubernetes Basics', course: 'Cloud & DevOps', module: 'Containerization', questions: 10, attempts: 0, status: 'Draft', createdAt: 'Sep 27, 2026' },
  { id: 'asm-5', title: 'Neural Networks Intro', course: 'AI & ML Foundations', module: 'Deep Learning', questions: 8, attempts: 45, status: 'Published', createdAt: 'Sep 12, 2026' },
  { id: 'asm-6', title: 'Legacy Pandas Basics', course: 'Data Science Championship', module: 'Python for Data Analysis', questions: 10, attempts: 520, status: 'Archived', createdAt: 'Jun 2, 2026' },
];

export const mockAssessmentStats = { total: 124, published: 98, draft: 14, archived: 12 };

// ---------------------------------------------------------------------------
// Document overview
// ---------------------------------------------------------------------------

export interface MockDocumentOverview {
  id: string;
  name: string;
  course: string;
  module: string;
  type: 'PDF' | 'DOCX' | 'PPTX' | 'XLSX';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'Active' | 'Archived';
}

export const mockDocumentsOverview: MockDocumentOverview[] = [
  { id: 'doc-1', name: 'Module 2 — Python for Data Analysis.pdf', course: 'Data Science Championship', module: 'Python for Data Analysis', type: 'PDF', size: '2.4 MB', uploadedBy: 'Rahul Bhattacharya', uploadedAt: 'Sep 26, 2026', status: 'Active' },
  { id: 'doc-2', name: 'SQL Cheat Sheet.pdf', course: 'Data Science Championship', module: 'Database Foundations', type: 'PDF', size: '860 KB', uploadedBy: 'Ananya Iyer', uploadedAt: 'Sep 24, 2026', status: 'Active' },
  { id: 'doc-3', name: 'React Hooks Slides.pptx', course: 'Full-Stack Web Dev', module: 'Advanced React', type: 'PPTX', size: '5.1 MB', uploadedBy: 'Karan Mehta', uploadedAt: 'Sep 20, 2026', status: 'Active' },
  { id: 'doc-4', name: 'Kubernetes Architecture.docx', course: 'Cloud & DevOps', module: 'Containerization', type: 'DOCX', size: '1.2 MB', uploadedBy: 'Devika Rao', uploadedAt: 'Sep 18, 2026', status: 'Active' },
  { id: 'doc-5', name: 'Grading Rubric — Legacy.xlsx', course: 'Data Science Championship', module: 'Python for Data Analysis', type: 'XLSX', size: '340 KB', uploadedBy: 'Rahul Bhattacharya', uploadedAt: 'May 2, 2026', status: 'Archived' },
];

export const mockDocumentStats = { total: 486, recentUploads: 27, courses: 6, modules: 24 };

// ---------------------------------------------------------------------------
// Courses / Modules overview (lighter tables for the Platform nav group)
// ---------------------------------------------------------------------------

export interface MockCourseOverview {
  id: string;
  title: string;
  slug: string;
  students: number;
  modules: number;
  status: 'Active' | 'Draft';
}

export const mockCoursesOverview: MockCourseOverview[] = [
  { id: 'c1', title: 'Data Science Championship Program™', slug: 'data-science', students: 5240, modules: 9, status: 'Active' },
  { id: 'c2', title: 'Full-Stack Web Development', slug: 'full-stack-web-dev', students: 3180, modules: 7, status: 'Active' },
  { id: 'c3', title: 'Cloud & DevOps Engineering', slug: 'cloud-devops', students: 2104, modules: 6, status: 'Active' },
  { id: 'c4', title: 'AI & ML Foundations', slug: 'ai-ml-foundations', students: 1890, modules: 8, status: 'Active' },
  { id: 'c5', title: 'Cybersecurity Essentials', slug: 'cybersecurity', students: 428, modules: 5, status: 'Draft' },
];

export interface MockModuleOverview {
  id: string;
  title: string;
  course: string;
  documents: number;
  assessments: number;
  status: 'Published' | 'Draft';
}

export const mockModulesOverview: MockModuleOverview[] = [
  { id: 'm1', title: 'Python for Data Analysis', course: 'Data Science Championship', documents: 6, assessments: 2, status: 'Published' },
  { id: 'm2', title: 'Database Foundations', course: 'Data Science Championship', documents: 4, assessments: 1, status: 'Published' },
  { id: 'm3', title: 'Advanced React', course: 'Full-Stack Web Dev', documents: 5, assessments: 1, status: 'Published' },
  { id: 'm4', title: 'Containerization', course: 'Cloud & DevOps', documents: 3, assessments: 1, status: 'Draft' },
  { id: 'm5', title: 'Deep Learning', course: 'AI & ML Foundations', documents: 7, assessments: 1, status: 'Published' },
];

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface MockReport {
  id: string;
  name: string;
  type: 'Student Performance' | 'Assessment Summary' | 'Platform Usage' | 'Financial';
  range: string;
  generatedBy: string;
  generatedAt: string;
  status: 'Ready' | 'Generating' | 'Failed';
}

export const mockReports: MockReport[] = [
  { id: 'rep-1', name: 'Q3 Student Performance Summary', type: 'Student Performance', range: 'Jul 1 – Sep 30, 2026', generatedBy: 'Rahul Bhattacharya', generatedAt: 'Sep 28, 2026', status: 'Ready' },
  { id: 'rep-2', name: 'September Assessment Activity', type: 'Assessment Summary', range: 'Sep 1 – Sep 30, 2026', generatedBy: 'Ananya Iyer', generatedAt: 'Sep 27, 2026', status: 'Ready' },
  { id: 'rep-3', name: 'Weekly Platform Usage', type: 'Platform Usage', range: 'Sep 22 – Sep 28, 2026', generatedBy: 'System', generatedAt: 'Sep 29, 2026', status: 'Generating' },
  { id: 'rep-4', name: 'August Financial Overview', type: 'Financial', range: 'Aug 1 – Aug 31, 2026', generatedBy: 'Karan Mehta', generatedAt: 'Sep 2, 2026', status: 'Failed' },
];

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

export interface MockAuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: 'Super Admin' | 'Admin' | 'System';
  action: string;
  module: string;
  device: string;
  status: 'Success' | 'Failed';
}

export const mockAuditLogs: MockAuditLogEntry[] = [
  { id: 'log-1', timestamp: 'Today, 10:42 AM', user: 'Rahul Bhattacharya', role: 'Super Admin', action: 'Published Assessment', module: 'Assessments', device: 'Chrome / Windows', status: 'Success' },
  { id: 'log-2', timestamp: 'Today, 9:58 AM', user: 'Ananya Iyer', role: 'Admin', action: 'Uploaded Document', module: 'Documents', device: 'Chrome / macOS', status: 'Success' },
  { id: 'log-3', timestamp: 'Today, 9:15 AM', user: 'System', role: 'System', action: 'Nightly Backup Completed', module: 'System', device: '—', status: 'Success' },
  { id: 'log-4', timestamp: 'Yesterday, 6:32 PM', user: 'Karan Mehta', role: 'Admin', action: 'Attempted to Delete Course', module: 'Courses', device: 'Firefox / Windows', status: 'Failed' },
  { id: 'log-5', timestamp: 'Yesterday, 4:10 PM', user: 'Devika Rao', role: 'Admin', action: 'Enrolled Student', module: 'Students', device: 'Safari / iOS', status: 'Success' },
  { id: 'log-6', timestamp: '2 days ago, 11:02 AM', user: 'Rahul Bhattacharya', role: 'Super Admin', action: 'Disabled Admin Account', module: 'Admin Management', device: 'Chrome / Windows', status: 'Success' },
];

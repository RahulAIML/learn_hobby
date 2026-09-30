'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, BookOpen, ClipboardCheck, Clock3, Sparkles, UserPlus, FolderPlus, Settings2, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { SectionHeader } from './ui/SectionHeader';
import { DataTable } from './ui/DataTable';
import type { PlatformOverview, RecentAssessmentRow, RecentAttemptActivity, RecentActiveStudent } from '@/lib/admin/dashboardStats';

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  draft: 'bg-slate-100 text-slate-500 border-slate-200',
  generated: 'bg-amber-50 text-amber-700 border-amber-100',
};

const QUICK_ACTIONS = [
  { label: 'Generate CBT Assessment', href: '/admin/cbt', icon: Sparkles },
  { label: 'Add a Course', href: '/admin/courses', icon: FolderPlus },
  { label: 'View Students', href: '/admin/students', icon: UserPlus },
  { label: 'Platform Settings', href: '/admin/settings', icon: Settings2 },
  { label: 'Super Admin Control Center', href: '/super-admin', icon: ShieldCheck },
];

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

interface DashboardData {
  overview: PlatformOverview;
  recentAssessments: RecentAssessmentRow[];
  recentActivity: RecentAttemptActivity[];
  recentStudents: RecentActiveStudent[];
}

export const DashboardHome: React.FC<{ adminName: string }> = ({ adminName }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load dashboard.');
        setData(body);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">Welcome back, {adminName}</h1>
        <p className="text-sm text-slate-500 mt-1">Manage and monitor the GURUKUL platform.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {!data ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Students" value={String(data.overview.totalStudents)} icon={Users} />
            <StatCard label="Courses" value={String(data.overview.totalCourses)} icon={BookOpen} />
            <StatCard label="Published Assessments" value={String(data.overview.totalCbtAssessments)} icon={ClipboardCheck} />
            <StatCard label="Pending Reviews" value={String(data.overview.pendingReviews)} icon={Clock3} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="min-w-0 lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
              <SectionHeader title="Recent Assessments" description="Latest CBT assessments across the platform" action={{ label: 'View all', href: '/admin/cbt' }} />
              <DataTable
                rows={data.recentAssessments}
                rowKey={(r) => r.id}
                emptyLabel="No assessments yet — generate one from Assessments."
                columns={[
                  {
                    key: 'title',
                    header: 'Assessment',
                    render: (r) => (
                      <Link href={`/admin/cbt/${r.id}`} className="block hover:text-red-700 transition-colors">
                        <p className="font-semibold text-slate-900">{r.title}</p>
                        <p className="text-[11px] text-slate-400">{r.topic}</p>
                      </Link>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (r) => (
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border capitalize ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {r.status}
                      </span>
                    ),
                  },
                  { key: 'attempts', header: 'Attempts', align: 'right', render: (r) => r.attempts },
                  {
                    key: 'avgScore',
                    header: 'Avg. Score',
                    align: 'right',
                    render: (r) => <span className="font-semibold text-slate-900">{r.avgPercentage !== null ? `${r.avgPercentage}%` : '—'}</span>,
                  },
                ]}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
              <SectionHeader title="Recent Activity" description="Latest submitted CBT attempts" />
              {data.recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No attempts submitted yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentActivity.map((item) => (
                    <li key={item.attemptId} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700 leading-snug">
                          <span className="font-semibold text-slate-900">{item.studentName}</span> submitted{' '}
                          <span className="font-medium text-slate-900">{item.assessmentTitle}</span>
                          {item.status === 'expired' && <span className="text-amber-600 font-medium"> (auto-submitted)</span>}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(item.submittedAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="min-w-0 lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
              <SectionHeader title="Student Activity" description="Most recently active students" action={{ label: 'View all', href: '/admin/students' }} />
              <DataTable
                rows={data.recentStudents}
                rowKey={(r) => r.id}
                emptyLabel="No student activity yet."
                columns={[
                  {
                    key: 'name',
                    header: 'Student',
                    render: (r) => (
                      <Link href={`/admin/students/${r.id}`} className="block hover:text-red-700 transition-colors">
                        <p className="font-semibold text-slate-900">{r.name}</p>
                        <p className="text-[11px] text-slate-400">{r.email}</p>
                      </Link>
                    ),
                  },
                  { key: 'attempts', header: 'Attempts', align: 'right', render: (r) => r.attempts },
                  {
                    key: 'avgScore',
                    header: 'Avg. Score',
                    align: 'right',
                    render: (r) => <span className="font-semibold text-slate-900">{r.avgPercentage !== null ? `${r.avgPercentage}%` : '—'}</span>,
                  },
                  { key: 'lastActive', header: 'Last Active', align: 'right', render: (r) => <span className="text-slate-400">{timeAgo(r.lastActive)}</span> },
                ]}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
              <SectionHeader title="Quick Actions" />
              <div className="space-y-1.5">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-slate-200 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/50 hover:text-red-800 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" strokeWidth={2} />
                      <span className="truncate">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

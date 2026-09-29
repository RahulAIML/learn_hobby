import React from 'react';
import Link from 'next/link';
import { Users, BookOpen, ClipboardCheck, Clock3, Sparkles, UserPlus, FolderPlus, Settings2 } from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { SectionHeader } from './ui/SectionHeader';
import { ActivityList } from './ui/ActivityList';
import { DataTable } from './ui/DataTable';
import { MOCK_STATS, MOCK_RECENT_ACTIVITY, MOCK_RECENT_ASSESSMENTS, MOCK_STUDENT_ACTIVITY } from '@/lib/admin/mockDashboardData';

const STAT_ICONS = { students: Users, courses: BookOpen, assessments: ClipboardCheck, pending: Clock3 } as const;

const STATUS_STYLES: Record<string, string> = {
  Published: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Draft: 'bg-slate-100 text-slate-500 border-slate-200',
  Generated: 'bg-amber-50 text-amber-700 border-amber-100',
};

const QUICK_ACTIONS = [
  { label: 'Generate CBT Assessment', href: '/admin/cbt', icon: Sparkles },
  { label: 'Add a Course', href: '/admin/courses', icon: FolderPlus },
  { label: 'View Students', href: '/admin/students', icon: UserPlus },
  { label: 'Platform Settings', href: '/admin/settings', icon: Settings2 },
];

export const DashboardHome: React.FC<{ adminName: string }> = ({ adminName }) => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">Welcome back, {adminName}</h1>
        <p className="text-sm text-slate-500 mt-1">Manage and monitor the GURUKUL platform.</p>
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md inline-block px-2.5 py-1 mt-3">
          This overview shows placeholder data — live metrics land in a follow-up.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {MOCK_STATS.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} delta={stat.delta} icon={STAT_ICONS[stat.icon]} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="min-w-0 lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <SectionHeader title="Recent Assessments" description="Latest CBT assessments across the platform" action={{ label: 'View all', href: '/admin/cbt' }} />
          <DataTable
            rows={MOCK_RECENT_ASSESSMENTS}
            rowKey={(r) => r.id}
            emptyLabel="No assessments yet."
            columns={[
              {
                key: 'title',
                header: 'Assessment',
                render: (r) => (
                  <div>
                    <p className="font-semibold text-slate-900">{r.title}</p>
                    <p className="text-[11px] text-slate-400">{r.topic}</p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                ),
              },
              { key: 'attempts', header: 'Attempts', align: 'right', render: (r) => r.attempts },
              { key: 'avgScore', header: 'Avg. Score', align: 'right', render: (r) => <span className="font-semibold text-slate-900">{r.avgScore}</span> },
            ]}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <SectionHeader title="Recent Activity" description="Across students and admins" />
          <ActivityList items={MOCK_RECENT_ACTIVITY} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="min-w-0 lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <SectionHeader title="Student Activity" description="Most recently active students" action={{ label: 'View all', href: '/admin/students' }} />
          <DataTable
            rows={MOCK_STUDENT_ACTIVITY}
            rowKey={(r) => r.id}
            emptyLabel="No students yet."
            columns={[
              {
                key: 'name',
                header: 'Student',
                render: (r) => (
                  <div>
                    <p className="font-semibold text-slate-900">{r.name}</p>
                    <p className="text-[11px] text-slate-400">{r.email}</p>
                  </div>
                ),
              },
              { key: 'attempts', header: 'Attempts', align: 'right', render: (r) => r.attempts },
              { key: 'avgScore', header: 'Avg. Score', align: 'right', render: (r) => <span className="font-semibold text-slate-900">{r.avgScore}</span> },
              { key: 'lastActive', header: 'Last Active', align: 'right', render: (r) => <span className="text-slate-400">{r.lastActive}</span> },
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
    </div>
  );
};

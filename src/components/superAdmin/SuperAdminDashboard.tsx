'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ShieldCheck, BookOpen, ClipboardCheck, Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/admin/ui/StatCard';
import { ChartCard, LineChart, BarChart, HorizontalBars } from '@/components/superAdmin/ui/ChartCard';
import { SystemStatusPanel } from '@/components/superAdmin/SystemStatusPanel';
import type {
  SuperAdminOverview,
  MonthPoint,
  DayPoint,
  CoursePerformancePoint,
  CbtPerformanceTrend,
  SystemStatusEntry,
  ActivityEntry,
} from '@/lib/superAdmin/realData';

interface DashboardData {
  overview: SuperAdminOverview;
  studentGrowth: MonthPoint[];
  assessmentAttempts: DayPoint[];
  courseEngagement: CoursePerformancePoint[];
  cbtTrend: CbtPerformanceTrend;
  systemStatus: SystemStatusEntry[];
  recentActivity: ActivityEntry[];
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const SuperAdminDashboard: React.FC<{ adminName: string }> = ({ adminName }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/super-admin/dashboard')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load dashboard.');
        setData(body.data);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
          {greeting()}, {adminName.split(' ')[0]}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Platform Overview</p>
        <p className="text-sm text-slate-500">Monitor and manage the GURUKUL platform from one place.</p>
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
            <StatCard label="Total Students" value={String(data.overview.totalStudents)} icon={Users} />
            <StatCard label="Total Admins" value={String(data.overview.totalAdmins + data.overview.totalSuperAdmins)} icon={ShieldCheck} />
            <StatCard label="Courses" value={String(data.overview.totalCourses)} icon={BookOpen} />
            <StatCard label="Assessments" value={String(data.overview.totalAssessments)} icon={ClipboardCheck} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 min-w-0">
              <ChartCard title="Student Growth" description="Cumulative enrolled students, last 12 months">
                <LineChart values={data.studentGrowth.map((p) => p.value)} labels={data.studentGrowth.map((p) => p.label)} />
              </ChartCard>
            </div>
            <ChartCard title="Avg. CBT Performance" description="Platform-wide average score">
              {data.cbtTrend.currentMonthAvg === null ? (
                <p className="text-sm text-slate-400">No scored attempts yet this month.</p>
              ) : (
                <div>
                  <p className="text-4xl font-bold text-slate-900 font-heading">{data.cbtTrend.currentMonthAvg}%</p>
                  {data.cbtTrend.previousMonthAvg !== null && (
                    <p className="text-[11px] text-slate-400 mt-3">Previous month: {data.cbtTrend.previousMonthAvg}%</p>
                  )}
                </div>
              )}
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard title="Assessment Attempts" description="Last 7 days">
              <BarChart data={data.assessmentAttempts} />
            </ChartCard>
            <ChartCard title="Course Engagement" description="Average CBT score by course">
              {data.courseEngagement.length === 0 ? (
                <p className="text-sm text-slate-400">No scored assessments yet.</p>
              ) : (
                <HorizontalBars data={data.courseEngagement} />
              )}
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <SystemStatusPanel status={data.systemStatus} />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Links</h3>
              <div className="space-y-1.5">
                {[
                  { label: 'Manage Admins', href: '/super-admin/admins', icon: ShieldCheck },
                  { label: 'View Audit Logs', href: '/super-admin/audit-logs', icon: Sparkles },
                  { label: 'Regular Admin Panel', href: '/admin', icon: ArrowRight },
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-slate-200 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/50 hover:text-red-800 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" strokeWidth={2} />
                      <span className="truncate">{link.label}</span>
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

'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { ChartCard, LineChart, BarChart, HorizontalBars } from '@/components/superAdmin/ui/ChartCard';
import { LoadingState } from '@/components/superAdmin/ui/EmptyState';
import type { MonthPoint, DayPoint, CoursePerformancePoint, CbtPerformanceTrend } from '@/lib/superAdmin/realData';

interface PerformanceData {
  studentGrowth: MonthPoint[];
  assessmentAttempts: DayPoint[];
  courseEngagement: CoursePerformancePoint[];
  cbtTrend: CbtPerformanceTrend;
}

export const PerformanceAnalytics: React.FC = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/super-admin/dashboard')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load performance data.');
        setData(body.data);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Performance" description="Platform-wide analytics across students, assessments, and content." />

      {error && <p className="text-sm text-red-700">{error}</p>}

      {!data ? (
        <LoadingState />
      ) : (
        <>
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
            <ChartCard title="Assessment Attempts" description="Last 7 days, platform-wide">
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
        </>
      )}
    </div>
  );
};

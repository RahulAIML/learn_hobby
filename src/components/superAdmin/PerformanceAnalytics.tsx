import React from 'react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { ChartCard, LineChart, BarChart, HorizontalBars } from '@/components/superAdmin/ui/ChartCard';
import {
  mockStudentGrowth,
  mockStudentGrowthLabels,
  mockAssessmentAttempts,
  mockCourseEngagement,
  mockCbtPerformanceTrend,
  mockDocumentActivity,
} from '@/lib/superAdmin/mockData';

export const PerformanceAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Performance" description="Platform-wide analytics across students, assessments, and content." />

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 min-w-0">
          <ChartCard title="Student Growth" description="Cumulative enrolled students, last 12 months">
            <LineChart values={mockStudentGrowth} labels={mockStudentGrowthLabels} />
          </ChartCard>
        </div>
        <ChartCard title="Avg. CBT Performance" description="Platform-wide average score">
          <div>
            <p className="text-4xl font-bold text-slate-900 font-heading">{mockCbtPerformanceTrend.current}%</p>
            <p className="text-xs text-emerald-700 font-semibold mt-1.5">{mockCbtPerformanceTrend.delta.value}</p>
            <p className="text-[11px] text-slate-400 mt-3">Previous period: {mockCbtPerformanceTrend.previous}%</p>
          </div>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard title="Assessment Attempts" description="Last 7 days, platform-wide">
          <BarChart data={mockAssessmentAttempts} />
        </ChartCard>
        <ChartCard title="Document Activity" description="Uploads per day, last 7 days">
          <BarChart data={mockDocumentActivity} />
        </ChartCard>
      </div>

      <ChartCard title="Course Engagement" description="Average completion rate by course">
        <HorizontalBars data={mockCourseEngagement} />
      </ChartCard>
    </div>
  );
};

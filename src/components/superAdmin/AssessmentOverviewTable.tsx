'use client';

import React, { useEffect, useState } from 'react';
import { ClipboardCheck, CheckCircle2, FileEdit, Archive } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { StatusBadge } from '@/components/superAdmin/ui/StatusBadge';
import { EmptyState, LoadingState } from '@/components/superAdmin/ui/EmptyState';
import { Pagination } from '@/components/superAdmin/ui/Pagination';
import { StatCard } from '@/components/admin/ui/StatCard';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import type { AssessmentOverviewRow, AssessmentStats } from '@/lib/superAdmin/realData';

export const AssessmentOverviewTable: React.FC = () => {
  const [assessments, setAssessments] = useState<AssessmentOverviewRow[] | null>(null);
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/super-admin/assessments')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load assessments.');
        setAssessments(body.data.assessments);
        setStats(body.data.stats);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const { query, setQuery, page, setPage, pageCount, paged, totalItems, pageSize } = useTableControls({
    rows: assessments ?? [],
    searchFields: (a) => [a.title, a.courseTitle, a.moduleTitle],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Assessments" description="Every CBT assessment across every course." />

      {error && <p className="text-sm text-red-700">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Assessments" value={String(stats.total)} icon={ClipboardCheck} />
          <StatCard label="Published" value={String(stats.published)} icon={CheckCircle2} />
          <StatCard label="Draft" value={String(stats.draft)} icon={FileEdit} />
          <StatCard label="Archived" value={String(stats.archived)} icon={Archive} />
        </div>
      )}

      <FilterBar query={query} onQueryChange={setQuery} placeholder="Search by assessment, course, or module…" />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {!assessments ? (
          <LoadingState />
        ) : assessments.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No assessments yet." />
        ) : (
          <>
            <DataTable
              rows={paged}
              rowKey={(a) => a.id}
              emptyLabel="No assessments match your search."
              columns={[
                { key: 'title', header: 'Assessment', render: (a) => <p className="font-semibold text-slate-900">{a.title}</p> },
                { key: 'courseTitle', header: 'Course', render: (a) => a.courseTitle },
                { key: 'moduleTitle', header: 'Module', render: (a) => <span className="text-slate-400">{a.moduleTitle}</span> },
                { key: 'questionCount', header: 'Questions', align: 'right', render: (a) => a.questionCount },
                { key: 'attempts', header: 'Attempts', align: 'right', render: (a) => a.attempts },
                { key: 'avgPercentage', header: 'Avg. Score', align: 'right', render: (a) => (a.avgPercentage !== null ? `${a.avgPercentage}%` : '—') },
                { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
                { key: 'createdAt', header: 'Created', render: (a) => <span className="text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span> },
              ]}
            />
            <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
};

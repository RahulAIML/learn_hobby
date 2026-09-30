'use client';

import React from 'react';
import { ClipboardCheck, CheckCircle2, FileEdit, Archive } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { StatusBadge } from '@/components/superAdmin/ui/StatusBadge';
import { RowActionsMenu } from '@/components/superAdmin/ui/RowActionsMenu';
import { EmptyState } from '@/components/superAdmin/ui/EmptyState';
import { Pagination } from '@/components/superAdmin/ui/Pagination';
import { StatCard } from '@/components/admin/ui/StatCard';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import { mockAssessmentsOverview, mockAssessmentStats } from '@/lib/superAdmin/mockData';

export const AssessmentOverviewTable: React.FC = () => {
  const { query, setQuery, page, setPage, pageCount, paged, totalItems, pageSize } = useTableControls({
    rows: mockAssessmentsOverview,
    searchFields: (a) => [a.title, a.course, a.module],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Assessments" description="Every CBT assessment across every course." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Assessments" value={String(mockAssessmentStats.total)} icon={ClipboardCheck} />
        <StatCard label="Published" value={String(mockAssessmentStats.published)} icon={CheckCircle2} />
        <StatCard label="Draft" value={String(mockAssessmentStats.draft)} icon={FileEdit} />
        <StatCard label="Archived" value={String(mockAssessmentStats.archived)} icon={Archive} />
      </div>

      <FilterBar query={query} onQueryChange={setQuery} placeholder="Search by assessment, course, or module…" />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {mockAssessmentsOverview.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No assessments yet." />
        ) : (
          <>
            <DataTable
              rows={paged}
              rowKey={(a) => a.id}
              emptyLabel="No assessments match your search."
              columns={[
                { key: 'title', header: 'Assessment', render: (a) => <p className="font-semibold text-slate-900">{a.title}</p> },
                { key: 'course', header: 'Course', render: (a) => a.course },
                { key: 'module', header: 'Module', render: (a) => <span className="text-slate-400">{a.module}</span> },
                { key: 'questions', header: 'Questions', align: 'right', render: (a) => a.questions },
                { key: 'attempts', header: 'Attempts', align: 'right', render: (a) => a.attempts },
                { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
                { key: 'createdAt', header: 'Created', render: (a) => <span className="text-slate-400">{a.createdAt}</span> },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: () => <RowActionsMenu actions={[{ label: 'Review', onClick: () => {} }, { label: 'View Attempts', onClick: () => {} }]} />,
                },
              ]}
            />
            <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
};

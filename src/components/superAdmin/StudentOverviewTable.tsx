'use client';

import React from 'react';
import { Users, UserCheck, UserX, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { StatusBadge } from '@/components/superAdmin/ui/StatusBadge';
import { RowActionsMenu } from '@/components/superAdmin/ui/RowActionsMenu';
import { EmptyState } from '@/components/superAdmin/ui/EmptyState';
import { Pagination } from '@/components/superAdmin/ui/Pagination';
import { StatCard } from '@/components/admin/ui/StatCard';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import { mockStudentsOverview, mockStudentStats } from '@/lib/superAdmin/mockData';

export const StudentOverviewTable: React.FC = () => {
  const { query, setQuery, page, setPage, pageCount, paged, totalItems, pageSize } = useTableControls({
    rows: mockStudentsOverview,
    searchFields: (s) => [s.name, s.email, s.course, s.goal],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Every student across every course, with real-time status." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Students" value={mockStudentStats.total.toLocaleString()} icon={Users} />
        <StatCard label="Active Students" value={mockStudentStats.active.toLocaleString()} icon={UserCheck} />
        <StatCard label="Inactive Students" value={mockStudentStats.inactive.toLocaleString()} icon={UserX} />
        <StatCard label="New This Week" value={String(mockStudentStats.newThisWeek)} icon={UserPlus} delta={{ value: '+214', direction: 'up' }} />
      </div>

      <FilterBar query={query} onQueryChange={setQuery} placeholder="Search by student, email, course, or goal…" />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {mockStudentsOverview.length === 0 ? (
          <EmptyState icon={Users} title="No students yet." />
        ) : (
          <>
            <DataTable
              rows={paged}
              rowKey={(s) => s.id}
              emptyLabel="No students match your search."
              columns={[
                {
                  key: 'name',
                  header: 'Student',
                  render: (s) => (
                    <div>
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-[11px] text-slate-400">{s.email}</p>
                    </div>
                  ),
                },
                { key: 'course', header: 'Course', render: (s) => s.course },
                { key: 'goal', header: 'Goal', render: (s) => <span className="text-slate-400">{s.goal}</span> },
                { key: 'age', header: 'Age', align: 'right', render: (s) => s.age },
                { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
                { key: 'joined', header: 'Joined', render: (s) => <span className="text-slate-400">{s.joined}</span> },
                { key: 'lastActive', header: 'Last Active', render: (s) => <span className="text-slate-400">{s.lastActive}</span> },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: () => <RowActionsMenu actions={[{ label: 'View Profile', onClick: () => {} }, { label: 'Message', onClick: () => {} }]} />,
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

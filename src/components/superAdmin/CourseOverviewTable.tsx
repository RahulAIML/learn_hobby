'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { StatusBadge } from '@/components/superAdmin/ui/StatusBadge';
import { RowActionsMenu } from '@/components/superAdmin/ui/RowActionsMenu';
import { EmptyState } from '@/components/superAdmin/ui/EmptyState';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import { mockCoursesOverview } from '@/lib/superAdmin/mockData';

export const CourseOverviewTable: React.FC = () => {
  const { query, setQuery, paged } = useTableControls({ rows: mockCoursesOverview, searchFields: (c) => [c.title, c.slug], pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description="Every course offered on the platform." />
      <FilterBar query={query} onQueryChange={setQuery} placeholder="Search by course title or slug…" />
      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {mockCoursesOverview.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses yet." />
        ) : (
          <DataTable
            rows={paged}
            rowKey={(c) => c.id}
            emptyLabel="No courses match your search."
            columns={[
              {
                key: 'title',
                header: 'Course',
                render: (c) => (
                  <div>
                    <p className="font-semibold text-slate-900">{c.title}</p>
                    <p className="text-[11px] text-slate-400">/{c.slug}</p>
                  </div>
                ),
              },
              { key: 'students', header: 'Students', align: 'right', render: (c) => c.students.toLocaleString() },
              { key: 'modules', header: 'Modules', align: 'right', render: (c) => c.modules },
              { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
              { key: 'actions', header: '', align: 'right', render: () => <RowActionsMenu actions={[{ label: 'View', onClick: () => {} }, { label: 'Manage', onClick: () => {} }]} /> },
            ]}
          />
        )}
      </div>
    </div>
  );
};

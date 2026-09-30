'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { StatusBadge } from '@/components/superAdmin/ui/StatusBadge';
import { RowActionsMenu } from '@/components/superAdmin/ui/RowActionsMenu';
import { EmptyState } from '@/components/superAdmin/ui/EmptyState';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import { mockModulesOverview } from '@/lib/superAdmin/mockData';

export const ModuleOverviewTable: React.FC = () => {
  const { query, setQuery, paged } = useTableControls({ rows: mockModulesOverview, searchFields: (m) => [m.title, m.course], pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader title="Modules" description="Every module across every course." />
      <FilterBar query={query} onQueryChange={setQuery} placeholder="Search by module or course…" />
      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {mockModulesOverview.length === 0 ? (
          <EmptyState icon={Layers} title="No modules yet." />
        ) : (
          <DataTable
            rows={paged}
            rowKey={(m) => m.id}
            emptyLabel="No modules match your search."
            columns={[
              { key: 'title', header: 'Module', render: (m) => <p className="font-semibold text-slate-900">{m.title}</p> },
              { key: 'course', header: 'Course', render: (m) => <span className="text-slate-400">{m.course}</span> },
              { key: 'documents', header: 'Documents', align: 'right', render: (m) => m.documents },
              { key: 'assessments', header: 'Assessments', align: 'right', render: (m) => m.assessments },
              { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
              { key: 'actions', header: '', align: 'right', render: () => <RowActionsMenu actions={[{ label: 'View', onClick: () => {} }, { label: 'Manage', onClick: () => {} }]} /> },
            ]}
          />
        )}
      </div>
    </div>
  );
};

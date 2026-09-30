'use client';

import React, { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { StatusBadge } from '@/components/superAdmin/ui/StatusBadge';
import { EmptyState } from '@/components/superAdmin/ui/EmptyState';
import { Pagination } from '@/components/superAdmin/ui/Pagination';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import { mockAuditLogs } from '@/lib/superAdmin/mockData';

type StatusFilter = 'all' | 'Success' | 'Failed';

export const AuditLogTable: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const filtered = mockAuditLogs.filter((l) => statusFilter === 'all' || l.status === statusFilter);
  const { query, setQuery, page, setPage, pageCount, paged, totalItems, pageSize } = useTableControls({
    rows: filtered,
    searchFields: (l) => [l.user, l.action, l.module],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="A security-grade record of every administrative action on the platform." />

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search by user, action, or module…"
        filters={[
          {
            value: statusFilter,
            onChange: (v) => setStatusFilter(v as StatusFilter),
            options: [
              { value: 'all', label: 'All' },
              { value: 'Success', label: 'Success' },
              { value: 'Failed', label: 'Failed' },
            ],
          },
        ]}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {mockAuditLogs.length === 0 ? (
          <EmptyState icon={ScrollText} title="No activity recorded yet." />
        ) : (
          <>
            <DataTable
              rows={paged}
              rowKey={(l) => l.id}
              emptyLabel="No log entries match your search."
              columns={[
                { key: 'timestamp', header: 'Timestamp', render: (l) => <span className="text-slate-400 whitespace-nowrap">{l.timestamp}</span> },
                { key: 'user', header: 'User', render: (l) => <p className="font-semibold text-slate-900">{l.user}</p> },
                { key: 'role', header: 'Role', render: (l) => l.role },
                { key: 'action', header: 'Action', render: (l) => l.action },
                { key: 'module', header: 'Module', render: (l) => <span className="text-slate-400">{l.module}</span> },
                { key: 'device', header: 'IP / Device', render: (l) => <span className="text-slate-400">{l.device}</span> },
                { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
              ]}
            />
            <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
};

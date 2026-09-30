'use client';

import React from 'react';
import { FolderOpen, UploadCloud, BookOpen, Layers } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { StatusBadge } from '@/components/superAdmin/ui/StatusBadge';
import { RowActionsMenu } from '@/components/superAdmin/ui/RowActionsMenu';
import { EmptyState } from '@/components/superAdmin/ui/EmptyState';
import { Pagination } from '@/components/superAdmin/ui/Pagination';
import { StatCard } from '@/components/admin/ui/StatCard';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import { mockDocumentsOverview, mockDocumentStats } from '@/lib/superAdmin/mockData';

export const DocumentOverviewTable: React.FC = () => {
  const { query, setQuery, page, setPage, pageCount, paged, totalItems, pageSize } = useTableControls({
    rows: mockDocumentsOverview,
    searchFields: (d) => [d.name, d.course, d.module, d.uploadedBy],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Every course material uploaded across the platform." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Documents" value={String(mockDocumentStats.total)} icon={FolderOpen} />
        <StatCard label="Recent Uploads" value={String(mockDocumentStats.recentUploads)} icon={UploadCloud} delta={{ value: 'last 7 days', direction: 'flat' }} />
        <StatCard label="Courses" value={String(mockDocumentStats.courses)} icon={BookOpen} />
        <StatCard label="Modules" value={String(mockDocumentStats.modules)} icon={Layers} />
      </div>

      <FilterBar query={query} onQueryChange={setQuery} placeholder="Search by document, course, module, or uploader…" />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {mockDocumentsOverview.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No documents yet." />
        ) : (
          <>
            <DataTable
              rows={paged}
              rowKey={(d) => d.id}
              emptyLabel="No documents match your search."
              columns={[
                { key: 'name', header: 'Document', render: (d) => <p className="font-semibold text-slate-900 truncate max-w-xs">{d.name}</p> },
                { key: 'course', header: 'Course', render: (d) => d.course },
                { key: 'module', header: 'Module', render: (d) => <span className="text-slate-400">{d.module}</span> },
                { key: 'type', header: 'Type', render: (d) => d.type },
                { key: 'size', header: 'Size', align: 'right', render: (d) => <span className="text-slate-400">{d.size}</span> },
                { key: 'uploadedBy', header: 'Uploaded By', render: (d) => d.uploadedBy },
                { key: 'uploadedAt', header: 'Uploaded', render: (d) => <span className="text-slate-400">{d.uploadedAt}</span> },
                { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: () => <RowActionsMenu actions={[{ label: 'View', onClick: () => {} }, { label: 'Download', onClick: () => {} }]} />,
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

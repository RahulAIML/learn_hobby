'use client';

import React, { useEffect, useState } from 'react';
import { FolderOpen, UploadCloud, BookOpen, Layers } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { EmptyState, LoadingState } from '@/components/superAdmin/ui/EmptyState';
import { Pagination } from '@/components/superAdmin/ui/Pagination';
import { StatCard } from '@/components/admin/ui/StatCard';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import type { DocumentOverviewRow, DocumentStats } from '@/lib/superAdmin/realData';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DocumentOverviewTable: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentOverviewRow[] | null>(null);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/super-admin/documents')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load documents.');
        setDocuments(body.data.documents);
        setStats(body.data.stats);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const { query, setQuery, page, setPage, pageCount, paged, totalItems, pageSize } = useTableControls({
    rows: documents ?? [],
    searchFields: (d) => [d.title, d.filename, d.courseTitle, d.moduleTitle ?? ''],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Every course material uploaded across the platform." />

      {error && <p className="text-sm text-red-700">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Documents" value={String(stats.total)} icon={FolderOpen} />
          <StatCard label="Recent Uploads" value={String(stats.recentLast7Days)} icon={UploadCloud} delta={{ value: 'last 7 days', direction: 'flat' }} />
          <StatCard label="Courses" value={String(stats.courses)} icon={BookOpen} />
          <StatCard label="Modules" value={String(stats.modules)} icon={Layers} />
        </div>
      )}

      <FilterBar query={query} onQueryChange={setQuery} placeholder="Search by document, course, or module…" />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {!documents ? (
          <LoadingState />
        ) : documents.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No documents yet." />
        ) : (
          <>
            <DataTable
              rows={paged}
              rowKey={(d) => d.id}
              emptyLabel="No documents match your search."
              columns={[
                { key: 'title', header: 'Document', render: (d) => <p className="font-semibold text-slate-900 truncate max-w-xs">{d.title}</p> },
                { key: 'courseTitle', header: 'Course', render: (d) => d.courseTitle },
                { key: 'moduleTitle', header: 'Module', render: (d) => <span className="text-slate-400">{d.moduleTitle ?? '—'}</span> },
                { key: 'mimeType', header: 'Type', render: (d) => <span className="text-slate-400">{d.mimeType}</span> },
                { key: 'sizeBytes', header: 'Size', align: 'right', render: (d) => <span className="text-slate-400">{formatSize(d.sizeBytes)}</span> },
                { key: 'uploadedAt', header: 'Uploaded', render: (d) => <span className="text-slate-400">{new Date(d.uploadedAt).toLocaleDateString()}</span> },
              ]}
            />
            <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { EmptyState, LoadingState } from '@/components/superAdmin/ui/EmptyState';
import { Pagination } from '@/components/superAdmin/ui/Pagination';
import { StatCard } from '@/components/admin/ui/StatCard';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import type { StudentOverviewRow, StudentStats } from '@/lib/superAdmin/realData';

export const StudentOverviewTable: React.FC = () => {
  const [students, setStudents] = useState<StudentOverviewRow[] | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/super-admin/students')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load students.');
        setStudents(body.data.students);
        setStats(body.data.stats);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const { query, setQuery, page, setPage, pageCount, paged, totalItems, pageSize } = useTableControls({
    rows: students ?? [],
    searchFields: (s) => [s.name, s.email, s.goal ?? '', ...s.courses],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Every student across every course." />

      {error && <p className="text-sm text-red-700">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Students" value={stats.total.toLocaleString()} icon={Users} />
          <StatCard label="Active (30d)" value={stats.activeLast30Days.toLocaleString()} icon={UserCheck} />
          <StatCard label="Never Logged In" value={stats.neverLoggedIn.toLocaleString()} icon={UserX} />
          <StatCard label="New This Week" value={String(stats.newLast7Days)} icon={UserPlus} />
        </div>
      )}

      <FilterBar query={query} onQueryChange={setQuery} placeholder="Search by student, email, course, or goal…" />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {!students ? (
          <LoadingState />
        ) : students.length === 0 ? (
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
                { key: 'courses', header: 'Courses', render: (s) => (s.courses.length ? s.courses.join(', ') : <span className="text-slate-400">None</span>) },
                { key: 'goal', header: 'Goal', render: (s) => <span className="text-slate-400">{s.goal ?? '—'}</span> },
                { key: 'age', header: 'Age', align: 'right', render: (s) => s.age ?? '—' },
                { key: 'totalAttempts', header: 'Attempts', align: 'right', render: (s) => s.totalAttempts },
                { key: 'averagePercentage', header: 'Avg. Score', align: 'right', render: (s) => (s.averagePercentage !== null ? `${s.averagePercentage}%` : '—') },
                { key: 'createdAt', header: 'Joined', render: (s) => <span className="text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span> },
                {
                  key: 'lastLoginAt',
                  header: 'Last Active',
                  render: (s) => <span className="text-slate-400">{s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString() : 'Never'}</span>,
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

'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { EmptyState, LoadingState } from '@/components/superAdmin/ui/EmptyState';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import type { CourseOverviewRow } from '@/lib/superAdmin/realData';

export const CourseOverviewTable: React.FC = () => {
  const [courses, setCourses] = useState<CourseOverviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/super-admin/courses')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load courses.');
        setCourses(body.data.courses);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const { query, setQuery, paged } = useTableControls({ rows: courses ?? [], searchFields: (c) => [c.title, c.slug], pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description="Every course offered on the platform." />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <FilterBar query={query} onQueryChange={setQuery} placeholder="Search by course title or slug…" />
      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {!courses ? (
          <LoadingState />
        ) : courses.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses yet." />
        ) : (
          <DataTable
            rows={paged}
            rowKey={(c) => c.slug}
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
              { key: 'studentCount', header: 'Students', align: 'right', render: (c) => c.studentCount.toLocaleString() },
              { key: 'moduleCount', header: 'Modules', align: 'right', render: (c) => c.moduleCount },
            ]}
          />
        )}
      </div>
    </div>
  );
};

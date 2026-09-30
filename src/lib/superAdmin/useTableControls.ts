import { useMemo, useState } from 'react';

interface UseTableControlsOptions<T> {
  rows: T[];
  searchFields: (row: T) => string[];
  pageSize?: number;
}

/** Shared client-side search + pagination over a (mock, for now) row array — reused by every Super Admin table page. */
export function useTableControls<T>({ rows, searchFields, pageSize = 10 }: UseTableControlsOptions<T>) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => searchFields(row).some((field) => field.toLowerCase().includes(q)));
  }, [rows, query, searchFields]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);

  const setQuerySafe = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return { query, setQuery: setQuerySafe, page: currentPage, setPage, pageCount, paged, totalItems: filtered.length, pageSize };
}

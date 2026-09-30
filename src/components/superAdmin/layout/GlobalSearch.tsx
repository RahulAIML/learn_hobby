'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X, Users, ShieldCheck, BookOpen, ClipboardCheck, FolderOpen } from 'lucide-react';
import { mockStudentsOverview, mockAdmins, mockCoursesOverview, mockAssessmentsOverview, mockDocumentsOverview } from '@/lib/superAdmin/mockData';

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  icon: typeof Users;
  kind: string;
}

/** Conceptual cross-entity search over mock data only — no backend search yet. */
function buildIndex(): SearchResult[] {
  return [
    ...mockStudentsOverview.slice(0, 12).map((s) => ({ id: s.id, label: s.name, sublabel: s.email, href: '/super-admin/students', icon: Users, kind: 'Student' })),
    ...mockAdmins.map((a) => ({ id: a.id, label: a.name, sublabel: a.email, href: '/super-admin/admins', icon: ShieldCheck, kind: 'Admin' })),
    ...mockCoursesOverview.map((c) => ({ id: c.id, label: c.title, sublabel: `${c.students} students`, href: '/super-admin/courses', icon: BookOpen, kind: 'Course' })),
    ...mockAssessmentsOverview.map((a) => ({ id: a.id, label: a.title, sublabel: a.course, href: '/super-admin/assessments', icon: ClipboardCheck, kind: 'Assessment' })),
    ...mockDocumentsOverview.map((d) => ({ id: d.id, label: d.name, sublabel: d.course, href: '/super-admin/documents', icon: FolderOpen, kind: 'Document' })),
  ];
}

const INDEX = buildIndex();

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return INDEX.filter((r) => r.label.toLowerCase().includes(q) || r.sublabel.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close search" onClick={onClose} className="absolute inset-0 bg-slate-950/40" />
      <div className="absolute top-0 inset-x-0 flex justify-center px-4 pt-[10vh]">
        <div className="w-full max-w-xl bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden" role="dialog" aria-modal="true">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students, admins, courses, assessments, documents…"
              className="flex-1 text-sm outline-none placeholder:text-slate-400"
            />
            <button type="button" onClick={onClose} aria-label="Close" className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {query.trim() && (
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-slate-400">No results for &ldquo;{query}&rdquo;.</p>
              ) : (
                <ul className="py-1.5">
                  {results.map((r) => {
                    const Icon = r.icon;
                    return (
                      <li key={`${r.kind}-${r.id}`}>
                        <Link
                          href={r.href}
                          onClick={onClose}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">{r.label}</p>
                            <p className="text-[11px] text-slate-400 truncate">{r.sublabel}</p>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">{r.kind}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

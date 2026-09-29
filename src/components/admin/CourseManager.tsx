'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  ArrowRight,
  Plus,
  Loader2,
  AlertCircle,
  BookOpen,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { StatCard } from './ui/StatCard';
import type { Course, CourseDocumentSummary } from '@/lib/courseDocuments/types';

interface CourseWithStats extends Course {
  documentCount: number | null;
}

/**
 * Real course + document management — unchanged logic from the original
 * AdminDashboard, only its own header/stat-card chrome was trimmed since
 * the shared AdminLayout (sidebar + topbar + breadcrumb) now covers that.
 */
export const CourseManager: React.FC = () => {
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/courses');
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Failed to load courses.');
      const base: Course[] = body.courses;

      const withStats = await Promise.all(
        base.map(async (course): Promise<CourseWithStats> => {
          try {
            const docsRes = await fetch(`/api/courses/${course.slug}/documents`);
            const docsBody = await docsRes.json();
            const docs: CourseDocumentSummary[] = docsRes.ok && docsBody.success ? docsBody.documents : [];
            return { ...course, documentCount: docsRes.ok && docsBody.success ? docs.length : null };
          } catch {
            return { ...course, documentCount: null };
          }
        })
      );
      setCourses(withStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Failed to create course.');
      setNewTitle('');
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course.');
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (course: CourseWithStats) => {
    setEditingSlug(course.slug);
    setEditTitle(course.title);
    setError(null);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const cancelEditing = () => {
    setEditingSlug(null);
    setEditTitle('');
  };

  const handleRename = async (slug: string) => {
    if (!editTitle.trim()) return;
    setBusySlug(slug);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Failed to rename course.');
      setEditingSlug(null);
      setEditTitle('');
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename course.');
    } finally {
      setBusySlug(null);
    }
  };

  const handleDeleteCourse = async (slug: string, title: string) => {
    if (!window.confirm(`Delete "${title}" and all of its documents? This cannot be undone.`)) return;
    setBusySlug(slug);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${slug}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Failed to delete course.');
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course.');
    } finally {
      setBusySlug(null);
    }
  };

  const totalDocuments = courses.reduce((sum, c) => sum + (c.documentCount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">Courses & Documents</h1>
        <p className="text-sm text-slate-500 mt-1">Create courses, then upload, replace, or delete materials for each one.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md">
        <StatCard label="Courses" value={String(courses.length)} icon={BookOpen} />
        <StatCard label="Documents" value={String(totalDocuments)} icon={FileText} />
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Add a New Course</h2>
        <form onSubmit={handleCreateCourse} className="flex items-center gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Course title, e.g. Full-Stack Web Development"
            disabled={creating}
            className="flex-1 px-3.5 py-2.5 rounded-md border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-400 transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-xs font-bold bg-red-700 text-white hover:bg-red-800 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add Course</span>
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Courses ({courses.length})</h2>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No courses yet. Add one above to get started.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {courses.map((course) => {
              const isEditing = editingSlug === course.slug;
              const isBusy = busySlug === course.slug;
              return (
                <li key={course.slug} className="rounded-lg border border-slate-200 bg-white p-4">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(course.slug);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        disabled={isBusy}
                        className="flex-1 px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-400 transition-colors disabled:opacity-60"
                      />
                      <button
                        type="button"
                        disabled={isBusy || !editTitle.trim()}
                        onClick={() => handleRename(course.slug)}
                        aria-label="Save"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-white bg-red-700 hover:bg-red-800 transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={cancelEditing}
                        aria-label="Cancel"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 border border-slate-200 hover:border-slate-300 transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/admin/courses/${course.slug}/documents`} className="flex items-center gap-3 min-w-0 flex-1 group">
                        <div className="w-9 h-9 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{course.title}</p>
                          <p className="text-xs text-slate-500">
                            {course.documentCount === null
                              ? 'Manage documents'
                              : `${course.documentCount} document${course.documentCount === 1 ? '' : 's'}`}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-600 transition-colors flex-shrink-0 ml-auto" />
                      </Link>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => startEditing(course)}
                          aria-label={`Rename ${course.title}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 border border-slate-200 hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDeleteCourse(course.slug, course.title)}
                          aria-label={`Delete ${course.title}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-red-700 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

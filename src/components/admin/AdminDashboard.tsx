'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, FileText, ShieldAlert, ArrowRight, Plus, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import type { Course, CourseDocumentSummary } from '@/lib/courseDocuments/types';

interface CourseWithStats extends Course {
  documentCount: number | null;
}

export const AdminDashboard: React.FC = () => {
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

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

  const totalDocuments = courses.reduce((sum, c) => sum + (c.documentCount ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex items-center gap-2 mb-1.5">
        <LayoutDashboard className="w-4 h-4 text-red-600" />
        <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">Admin</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading tracking-tight">
        Admin Dashboard
      </h1>
      <p className="text-sm text-slate-500 mt-2">
        Manage courses and their documents — create courses, then upload, replace, or delete materials for each one.
      </p>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 mt-6 mb-8">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>This dashboard is not access-controlled.</strong> No authentication system exists in this project
          yet, so anyone with the link can reach it. Add a real admin-role check here once auth is built. Courses
          and documents are also stored in server memory only — they will be lost on redeploy or a cold start.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Courses</span>
          </div>
          <p className="text-2xl font-black text-slate-950">{courses.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Documents</span>
          </div>
          <p className="text-2xl font-black text-slate-950">{totalDocuments}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 mb-8">
        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">Add a New Course</h2>
        <form onSubmit={handleCreateCourse} className="flex items-center gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Course title, e.g. Full-Stack Web Development"
            disabled={creating}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-400 transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add Course</span>
          </button>
        </form>
      </div>

      <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">
        Courses ({courses.length})
      </h2>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 text-center">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No courses yet. Add one above to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => (
            <li key={course.slug}>
              <Link
                href={`/admin/courses/${course.slug}/documents`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-red-300 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{course.title}</p>
                    <p className="text-xs text-slate-500">
                      {course.documentCount === null ? 'Manage documents' : `${course.documentCount} document${course.documentCount === 1 ? '' : 's'}`}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-600 transition-colors flex-shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

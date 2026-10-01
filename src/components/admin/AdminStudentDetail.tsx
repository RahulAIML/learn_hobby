'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Trophy,
  Target,
  ListChecks,
  ArrowRight,
  Clock3,
  Pencil,
  X,
  Check,
  CircleDollarSign,
  BookOpen,
  Plus,
  Trash2,
  Mail,
  Phone,
  Calendar,
  User,
  LogIn,
} from 'lucide-react';
import { GOAL_TAXONOMY, findGoalSubcategory } from '@/lib/profile/goalTaxonomy';

interface StudentDetail {
  profile: {
    id: string;
    username: string;
    name: string;
    email: string;
    mobile: string | null;
    phoneNo: string | null;
    age: number | null;
    goalCategory: string | null;
    goalSubcategory: string | null;
    goalOption: string | null;
    profileCompletedAt: string | null;
    createdAt: string;
    lastLoginAt: string | null;
  };
  enrollments: string[];
  paid: { plan: string; amount: number | null; currency: string | null } | null;
  performance: {
    totalAttempts: number;
    completedAttempts: number;
    averagePercentage: number | null;
    bestPercentage: number | null;
    topicPerformance: { topic: string; percentage: number }[];
  };
  attempts: {
    attemptId: string;
    title: string;
    topic: string;
    status: string;
    percentage: number | null;
    submittedAt: string | null;
  }[];
}

interface CourseOption {
  slug: string;
  title: string;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export const AdminStudentDetail: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [data, setData] = useState<StudentDetail | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', age: '', goalCategory: '', goalSubcategory: '', goalOption: '' });
  const [saving, setSaving] = useState(false);

  const [enrollBusy, setEnrollBusy] = useState<string | null>(null);
  const [newCourseSlug, setNewCourseSlug] = useState('');
  const [paidBusy, setPaidBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`);
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load student.');
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load student.');
    }
  }, [studentId]);

  useEffect(() => {
    load();
    fetch('/api/courses')
      .then((r) => r.json())
      .then((b) => {
        if (b.success) setCourses(b.courses);
      })
      .catch(() => {});
  }, [load]);

  const startEditing = () => {
    if (!data) return;
    setForm({
      name: data.profile.name,
      mobile: data.profile.mobile ?? '',
      age: data.profile.age ? String(data.profile.age) : '',
      goalCategory: data.profile.goalCategory ?? '',
      goalSubcategory: data.profile.goalSubcategory ?? '',
      goalOption: data.profile.goalOption ?? '',
    });
    setActionError(null);
    setEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionError(null);
    try {
      const payload: Record<string, unknown> = { name: form.name.trim(), mobile: form.mobile.trim() || null };
      if (form.age) payload.age = Number(form.age);
      if (form.goalCategory && form.goalSubcategory && form.goalOption) {
        payload.goalCategory = form.goalCategory;
        payload.goalSubcategory = form.goalSubcategory;
        payload.goalOption = form.goalOption;
      }
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not save profile.');
      setEditing(false);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async () => {
    if (!newCourseSlug) return;
    setEnrollBusy(newCourseSlug);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug: newCourseSlug }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not enroll student.');
      setNewCourseSlug('');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not enroll student.');
    } finally {
      setEnrollBusy(null);
    }
  };

  const handleUnenroll = async (courseSlug: string) => {
    setEnrollBusy(courseSlug);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/enrollments/${courseSlug}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not remove enrollment.');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not remove enrollment.');
    } finally {
      setEnrollBusy(null);
    }
  };

  const togglePaid = async () => {
    if (!data) return;
    setPaidBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${studentId}/paid`, { method: data.paid ? 'DELETE' : 'POST' });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not update paid status.');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update paid status.');
    } finally {
      setPaidBusy(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <p className="text-sm text-red-900">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const { profile, enrollments, paid, performance, attempts } = data;

  const goalCategory = GOAL_TAXONOMY.find((c) => c.value === profile.goalCategory);
  const goalSubcategory = goalCategory ? findGoalSubcategory(profile.goalCategory!, profile.goalSubcategory!) : null;
  const goalOptionLabel = goalSubcategory?.options.find((o) => o.value === profile.goalOption)?.label ?? null;

  const formCategory = GOAL_TAXONOMY.find((c) => c.value === form.goalCategory);
  const formSubcategory = formCategory?.subcategories.find((s) => s.value === form.goalSubcategory);
  const unenrolledCourses = courses.filter((c) => !enrollments.includes(c.slug));

  return (
    <div>
      <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-700 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Students
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 font-heading tracking-tight">{profile.name}</h1>
          <p className="text-xs text-slate-400 mt-1">@{profile.username}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {paid ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-100">
              <CircleDollarSign className="w-3 h-3" />
              {paid.plan}
            </span>
          ) : (
            <span className="text-xs text-slate-400">Free</span>
          )}
          <button
            type="button"
            disabled={paidBusy}
            onClick={togglePaid}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-bold border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {paidBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : paid ? 'Unmark Paid' : 'Mark Paid'}
          </button>
          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-bold border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-700 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Profile info card */}
      {!editing && (
        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Profile Information</h2>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <div>
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Email</dt>
                <dd className="text-sm text-slate-900">{profile.email}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <div>
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Mobile</dt>
                <dd className="text-sm text-slate-900">{profile.mobile || '—'}</dd>
              </div>
            </div>
            {profile.phoneNo && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Phone (alt)</dt>
                  <dd className="text-sm text-slate-900">{profile.phoneNo}</dd>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <div>
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Age</dt>
                <dd className="text-sm text-slate-900">{profile.age ?? '—'}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <div>
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Joined</dt>
                <dd className="text-sm text-slate-900">{formatDate(profile.createdAt)}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LogIn className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <div>
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Last Active</dt>
                <dd className="text-sm text-slate-900">{profile.lastLoginAt ? formatDate(profile.lastLoginAt) : 'Never'}</dd>
              </div>
            </div>
            {goalCategory && goalSubcategory && goalOptionLabel && (
              <div className="sm:col-span-2 flex items-start gap-2">
                <Target className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Goal</dt>
                  <dd className="text-sm text-slate-900">
                    <span className="text-slate-500">{goalCategory.label}</span>
                    <span className="mx-1 text-slate-300">›</span>
                    <span className="text-slate-500">{goalSubcategory.label}</span>
                    <span className="mx-1 text-slate-300">›</span>
                    <span className="font-semibold">{goalOptionLabel}</span>
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </div>
      )}

      {actionError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 mt-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{actionError}</p>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSaveProfile} className="mt-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Edit Profile</h2>
            <button type="button" onClick={() => setEditing(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile</label>
              <input
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                min={10}
                max={100}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Category</label>
              <select
                value={form.goalCategory}
                onChange={(e) => setForm({ ...form, goalCategory: e.target.value, goalSubcategory: '', goalOption: '' })}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
              >
                <option value="">—</option>
                {GOAL_TAXONOMY.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            {formCategory && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{formCategory.label} Focus</label>
                <select
                  value={form.goalSubcategory}
                  onChange={(e) => setForm({ ...form, goalSubcategory: e.target.value, goalOption: '' })}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
                >
                  <option value="">—</option>
                  {formCategory.subcategories.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {formSubcategory && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specifically</label>
                <select
                  value={form.goalOption}
                  onChange={(e) => setForm({ ...form, goalOption: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
                >
                  <option value="">—</option>
                  {formSubcategory.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold bg-red-700 text-white hover:bg-red-800 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <ListChecks className="w-4 h-4 text-slate-400 mb-2" />
          <p className="text-xl font-bold text-slate-900">{performance.totalAttempts}</p>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Attempts</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <Target className="w-4 h-4 text-slate-400 mb-2" />
          <p className="text-xl font-bold text-slate-900">
            {performance.averagePercentage ?? '—'}
            {performance.averagePercentage !== null && '%'}
          </p>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Average</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <Trophy className="w-4 h-4 text-amber-500 mb-2" />
          <p className="text-xl font-bold text-slate-900">
            {performance.bestPercentage ?? '—'}
            {performance.bestPercentage !== null && '%'}
          </p>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Best</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <ListChecks className="w-4 h-4 text-slate-400 mb-2" />
          <p className="text-xl font-bold text-slate-900">{performance.completedAttempts}</p>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Completed</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 mt-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Course Enrollment</h2>
        {enrollments.length === 0 ? (
          <p className="text-sm text-slate-400 mb-3">Not enrolled in any course.</p>
        ) : (
          <ul className="space-y-1.5 mb-3">
            {enrollments.map((slug) => {
              const course = courses.find((c) => c.slug === slug);
              return (
                <li key={slug} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-slate-100 bg-slate-50/60">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    {course?.title ?? slug}
                  </span>
                  <button
                    type="button"
                    disabled={enrollBusy === slug}
                    onClick={() => handleUnenroll(slug)}
                    aria-label={`Unenroll from ${course?.title ?? slug}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-red-700 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {enrollBusy === slug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {unenrolledCourses.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={newCourseSlug}
              onChange={(e) => setNewCourseSlug(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
            >
              <option value="">Select a course to enroll…</option>
              {unenrolledCourses.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!newCourseSlug || enrollBusy === newCourseSlug}
              onClick={handleEnroll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold bg-red-700 text-white hover:bg-red-800 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {enrollBusy === newCourseSlug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Enroll
            </button>
          </div>
        )}
      </div>

      {performance.topicPerformance.length > 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Topic Performance</h2>
          <div className="space-y-2.5">
            {performance.topicPerformance.map((t) => (
              <div key={t.topic} className="flex items-center gap-3">
                <span className="text-sm text-slate-700 w-40 flex-shrink-0 truncate">{t.topic}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-red-600 rounded-full" style={{ width: `${t.percentage}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600 w-10 text-right">{t.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-8 mb-3">Assessment History ({attempts.length})</h2>
      {attempts.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-8 text-center">
          <ListChecks className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No CBT attempts yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {attempts.map((a) => (
            <li key={a.attemptId}>
              <Link
                href={`/cbt/results/${a.attemptId}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:border-red-300 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{a.title}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Clock3 className="w-3 h-3" />
                    {formatDate(a.submittedAt)}
                    {a.status === 'expired' && <span className="text-amber-600 font-semibold">(auto-submitted)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-lg font-bold text-slate-900">
                    {a.percentage ?? '—'}
                    {a.percentage !== null && '%'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-600 transition-colors" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

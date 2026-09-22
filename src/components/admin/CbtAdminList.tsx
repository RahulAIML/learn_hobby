'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, AlertCircle, ListChecks, ArrowRight } from 'lucide-react';

interface Course {
  slug: string;
  title: string;
}
interface Module {
  id: string;
  title: string;
}
interface CbtAssessmentSummary {
  id: string;
  title: string;
  topic: string;
  status: 'draft' | 'generated' | 'published' | 'archived';
  mcqCount: number;
  fillBlankCount: number;
  createdAt: string;
}

const GENERATING_MESSAGES = ['Generating questions…', 'Checking accuracy…', 'Preparing assessment…'];

export const CbtAdminList: React.FC = () => {
  const router = useRouter();
  const [assessments, setAssessments] = useState<CbtAssessmentSummary[] | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);

  const [form, setForm] = useState({
    courseSlug: '',
    moduleId: '',
    title: '',
    topic: '',
    description: '',
    difficulty: 'intermediate',
    timeLimitMinutes: 30,
    mcqCount: 10,
    fillBlankCount: 5,
    optionsPerMcq: 4,
  });

  const loadAssessments = useCallback(async () => {
    const res = await fetch('/api/admin/cbt-assessments');
    const body = await res.json();
    if (res.ok && body.success) setAssessments(body.assessments);
  }, []);

  useEffect(() => {
    loadAssessments();
    fetch('/api/courses')
      .then((r) => r.json())
      .then((b) => {
        if (b.success) {
          setCourses(b.courses);
          if (b.courses[0]) setForm((f) => ({ ...f, courseSlug: b.courses[0].slug }));
        }
      });
  }, [loadAssessments]);

  useEffect(() => {
    if (!form.courseSlug) {
      setModules([]);
      return;
    }
    fetch(`/api/courses/${form.courseSlug}/modules`)
      .then((r) => r.json())
      .then((b) => {
        if (b.success) {
          setModules(b.modules);
          setForm((f) => ({ ...f, moduleId: b.modules[0]?.id ?? '' }));
        }
      });
  }, [form.courseSlug]);

  useEffect(() => {
    if (!generating) return;
    const timer = setInterval(() => setGeneratingStep((s) => Math.min(s + 1, GENERATING_MESSAGES.length - 1)), 3000);
    return () => clearInterval(timer);
  }, [generating]);

  const totalMarks = form.mcqCount + form.fillBlankCount;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.moduleId) {
      setError('Select a module first.');
      return;
    }
    setGenerating(true);
    setGeneratingStep(0);
    setError(null);
    try {
      const res = await fetch('/api/admin/cbt-assessments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Generation failed.');
      router.push(`/admin/cbt/${body.assessment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const statusBadge = (status: CbtAssessmentSummary['status']) => {
    const styles: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-600',
      generated: 'bg-amber-50 text-amber-700 border border-amber-100',
      published: 'bg-green-50 text-green-700 border border-green-100',
      archived: 'bg-slate-100 text-slate-400',
    };
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex items-center gap-2 mb-1.5">
        <Sparkles className="w-4 h-4 text-red-600" />
        <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">Admin</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading tracking-tight">AI Question Generator</h1>
      <p className="text-sm text-slate-500 mt-2">
        Generate a CBT assessment from a topic with Gemini, review it, then publish it for students.
      </p>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mt-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {generating ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-900">Generating your assessment…</p>
          <p className="text-xs text-slate-500 mt-2">{GENERATING_MESSAGES[generatingStep]}</p>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Create AI Assessment</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Course</label>
              <select
                value={form.courseSlug}
                onChange={(e) => setForm({ ...form, courseSlug: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
              >
                {courses.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Module</label>
              <select
                value={form.moduleId}
                onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Assessment Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Python OOP Fundamentals"
              required
              minLength={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Topic</label>
            <input
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="Python OOP"
              required
              minLength={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description / Context for Gemini</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Cover classes, inheritance, encapsulation, polymorphism..."
              required
              minLength={3}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30 resize-y"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">MCQs</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.mcqCount}
                onChange={(e) => setForm({ ...form, mcqCount: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Fill-in-Blanks</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.fillBlankCount}
                onChange={(e) => setForm({ ...form, fillBlankCount: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">MCQ Options</label>
              <input
                type="number"
                min={2}
                max={6}
                value={form.optionsPerMcq}
                onChange={(e) => setForm({ ...form, optionsPerMcq: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Time (min)</label>
              <input
                type="number"
                min={1}
                max={300}
                value={form.timeLimitMinutes}
                onChange={(e) => setForm({ ...form, timeLimitMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <p className="text-xs text-slate-400">Total Marks (auto): {totalMarks}</p>

          <button
            type="submit"
            disabled={!form.title || !form.topic || !form.description || totalMarks === 0}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-red-700 hover:bg-red-800 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Generate Assessment with Gemini
          </button>
        </form>
      )}

      <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mt-10 mb-4">Existing Assessments</h2>
      {assessments === null ? (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : assessments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 text-center">
          <ListChecks className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No CBT assessments generated yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {assessments.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/cbt/${a.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-red-300 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{a.title}</p>
                  <p className="text-xs text-slate-500">
                    {a.topic} &middot; {a.mcqCount} MCQ + {a.fillBlankCount} Fill-in-Blank
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {statusBadge(a.status)}
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

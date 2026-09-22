'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Trash2,
  Plus,
  ArrowLeft,
  Rocket,
  X,
} from 'lucide-react';

interface QuestionOption {
  id: string;
  optionText: string;
  orderIndex: number;
}
interface Question {
  id: string;
  assessmentId: string;
  type: 'mcq' | 'fill_blank';
  questionText: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  explanation: string;
  difficulty: string;
  topic: string;
  orderIndex: number;
  options: QuestionOption[];
}
interface Assessment {
  id: string;
  title: string;
  topic: string;
  description: string;
  difficulty: string;
  status: 'draft' | 'generated' | 'published' | 'archived';
  timeLimitMinutes: number;
  mcqCount: number;
  fillBlankCount: number;
  optionsPerMcq: number;
}

type FormState = {
  type: 'mcq' | 'fill_blank';
  questionText: string;
  options: string[];
  correctAnswer: string;
  acceptableAnswers: string;
  explanation: string;
  difficulty: string;
  topic: string;
  orderIndex: number;
};

function emptyForm(optionsPerMcq: number, nextIndex: number): FormState {
  return {
    type: 'mcq',
    questionText: '',
    options: Array.from({ length: optionsPerMcq }, () => ''),
    correctAnswer: '',
    acceptableAnswers: '',
    explanation: '',
    difficulty: 'intermediate',
    topic: '',
    orderIndex: nextIndex,
  };
}

function questionToForm(q: Question): FormState {
  return {
    type: q.type,
    questionText: q.questionText,
    options: q.options.length ? q.options.map((o) => o.optionText) : ['', '', '', ''],
    correctAnswer: q.correctAnswer,
    acceptableAnswers: (q.acceptableAnswers ?? []).join(', '),
    explanation: q.explanation,
    difficulty: q.difficulty,
    topic: q.topic,
    orderIndex: q.orderIndex,
  };
}

export const CbtReview: React.FC<{ assessmentId: string }> = ({ assessmentId }) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [editing, setEditing] = useState<Question | 'new' | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/cbt-assessments/${assessmentId}`);
    const body = await res.json();
    if (!res.ok || !body.success) {
      setError(body?.error?.message ?? 'Could not load assessment.');
      return;
    }
    setAssessment(body.assessment);
    setQuestions(body.questions);
    setPublished(body.assessment.status === 'published');
  }, [assessmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (q: Question) => {
    setEditing(q);
    setForm(questionToForm(q));
  };
  const openNew = () => {
    if (!assessment || !questions) return;
    setEditing('new');
    setForm(emptyForm(assessment.optionsPerMcq, questions.length + 1));
  };
  const closeEdit = () => {
    setEditing(null);
    setForm(null);
  };

  const handleDelete = async (q: Question) => {
    if (!confirm(`Delete question: "${q.questionText.slice(0, 60)}"?`)) return;
    const res = await fetch(`/api/admin/cbt-assessments/${assessmentId}/questions/${q.id}`, { method: 'DELETE' });
    const body = await res.json();
    if (res.ok && body.success) load();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    const payload = {
      type: form.type,
      questionText: form.questionText,
      options: form.type === 'mcq' ? form.options.filter((o) => o.trim() !== '') : undefined,
      correctAnswer: form.correctAnswer,
      acceptableAnswers: form.acceptableAnswers
        ? form.acceptableAnswers.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      explanation: form.explanation,
      difficulty: form.difficulty,
      topic: form.topic,
      orderIndex: form.orderIndex,
    };
    try {
      const url =
        editing === 'new'
          ? `/api/admin/cbt-assessments/${assessmentId}/questions`
          : `/api/admin/cbt-assessments/${assessmentId}/questions/${(editing as Question).id}`;
      const res = await fetch(url, {
        method: editing === 'new' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not save question.');
      closeEdit();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save question.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch(`/api/admin/cbt-assessments/${assessmentId}/publish`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not publish.');
      setPublished(true);
      setAssessment(body.assessment);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Could not publish.');
    } finally {
      setPublishing(false);
    }
  };

  if (error && !assessment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <p className="text-sm text-red-900">{error}</p>
      </div>
    );
  }

  if (!assessment || !questions) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const expectedTotal = assessment.mcqCount + assessment.fillBlankCount;
  const readyToPublish = questions.length === expectedTotal;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link href="/admin/cbt" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-700 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Assessments
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading tracking-tight">{assessment.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {assessment.topic} &middot; {assessment.difficulty} &middot; {assessment.timeLimitMinutes} min
          </p>
        </div>
        {published ? (
          <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Published
          </span>
        ) : (
          <span className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
            {assessment.status}
          </span>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600">
        Requires exactly <strong>{expectedTotal}</strong> questions to publish ({assessment.mcqCount} MCQ + {assessment.fillBlankCount} fill-in-blank). Currently{' '}
        <strong>{questions.length}</strong>.
      </div>

      {publishError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mt-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{publishError}</p>
        </div>
      )}

      {!published && (
        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing || !readyToPublish}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-green-700 hover:bg-green-800 transition-colors disabled:opacity-50"
        >
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          Publish Assessment
        </button>
      )}

      <div className="flex items-center justify-between mt-10 mb-4">
        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Questions ({questions.length})</h2>
        {!published && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-700 border border-red-200 hover:bg-red-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Question
          </button>
        )}
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400">
                  Q{i + 1} &middot; {q.type === 'mcq' ? 'Multiple Choice' : 'Fill in the Blank'}
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{q.questionText}</p>
                {q.type === 'mcq' && (
                  <ul className="mt-2 space-y-1">
                    {q.options.map((o) => (
                      <li
                        key={o.id}
                        className={`text-xs px-2.5 py-1 rounded-lg ${
                          o.optionText === q.correctAnswer ? 'bg-green-50 text-green-800 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {o.optionText}
                      </li>
                    ))}
                  </ul>
                )}
                {q.type === 'fill_blank' && (
                  <p className="text-xs text-green-700 font-semibold mt-2">Answer: {q.correctAnswer}</p>
                )}
              </div>
              {!published && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(q)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(q)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && form && (
        <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center p-4 z-50" onClick={closeEdit}>
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">{editing === 'new' ? 'Add Question' : 'Edit Question'}</h3>
              <button type="button" onClick={closeEdit} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {error && <p className="text-xs text-red-700 mb-3">{error}</p>}

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'mcq' | 'fill_blank' })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="fill_blank">Fill in the Blank</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Question Text</label>
                <textarea
                  value={form.questionText}
                  onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                  required
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-y"
                />
              </div>
              {form.type === 'mcq' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Options</label>
                  <div className="space-y-1.5">
                    {form.options.map((opt, idx) => (
                      <input
                        key={idx}
                        value={opt}
                        onChange={(e) => {
                          const next = [...form.options];
                          next[idx] = e.target.value;
                          setForm({ ...form, options: next });
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correct Answer</label>
                <input
                  value={form.correctAnswer}
                  onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              {form.type === 'fill_blank' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Acceptable Alternatives (comma-separated)</label>
                  <input
                    value={form.acceptableAnswers}
                    onChange={(e) => setForm({ ...form, acceptableAnswers: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Explanation</label>
                <textarea
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  required
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Topic</label>
                  <input
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-red-700 hover:bg-red-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Question'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

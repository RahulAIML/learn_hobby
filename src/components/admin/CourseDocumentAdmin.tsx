'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FileText, Upload, Trash2, RefreshCw, Loader2, AlertCircle, ShieldAlert, ArrowLeft, Plus, BookOpen, ClipboardList, Save } from 'lucide-react';
import { formatBytes } from '@/lib/assessment/fileValidation';
import type { CourseDocumentSummary } from '@/lib/courseDocuments/types';
import type { Module } from '@/lib/modules/types';
import type { Assessment } from '@/lib/assessments/types';

interface CourseDocumentAdminProps {
  courseSlug: string;
  courseTitle: string;
}

export const CourseDocumentAdmin: React.FC<CourseDocumentAdminProps> = ({ courseSlug, courseTitle }) => {
  const [documents, setDocuments] = useState<CourseDocumentSummary[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [creatingModule, setCreatingModule] = useState(false);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseSlug}/documents`);
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Failed to load documents.');
      setDocuments(body.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [courseSlug]);

  const loadModules = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseSlug}/modules`);
      const body = await res.json();
      if (res.ok && body.success) setModules(body.modules);
    } catch {
      // non-fatal — module picker just stays empty
    }
  }, [courseSlug]);

  useEffect(() => {
    loadDocuments();
    loadModules();
  }, [loadDocuments, loadModules]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    setCreatingModule(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseSlug}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newModuleTitle.trim() }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Failed to create module.');
      setNewModuleTitle('');
      await loadModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create module.');
    } finally {
      setCreatingModule(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title.trim()) formData.append('title', title.trim());
      if (selectedModuleId) formData.append('moduleId', selectedModuleId);

      const res = await fetch(`/api/courses/${courseSlug}/documents`, { method: 'POST', body: formData });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Upload failed.');

      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async (docId: string, file: File) => {
    setBusyDocId(docId);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/courses/${courseSlug}/documents/${docId}`, { method: 'PUT', body: formData });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Replace failed.');
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replace failed.');
    } finally {
      setBusyDocId(null);
    }
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!window.confirm(`Delete "${docTitle}"? This cannot be undone.`)) return;
    setBusyDocId(docId);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseSlug}/documents/${docId}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Delete failed.');
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusyDocId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">{courseTitle}</span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading tracking-tight mt-1.5">
          Manage Course Documents
        </h1>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 mb-8">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>This page is not access-controlled.</strong> No authentication system exists in this project yet,
          so anyone with the link can reach it. Add a real admin-role check here once auth is built. Documents are
          also stored in server memory only — they will be lost on redeploy or a cold start, not written to a
          database yet.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 mb-8">
        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">Modules</h2>
        <form onSubmit={handleCreateModule} className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="New module title, e.g. Module 3: SQL Basics"
            disabled={creatingModule}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-400 transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={creatingModule || !newModuleTitle.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {creatingModule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add Module
          </button>
        </form>

        {modules.length > 0 && (
          <ul className="space-y-2">
            {modules.map((mod) => (
              <li key={mod.id} className="rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setExpandedModuleId(expandedModuleId === mod.id ? null : mod.id)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left"
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <BookOpen className="w-3.5 h-3.5 text-red-600" />
                    {mod.title}
                  </span>
                  <span className="text-xs font-semibold text-red-600">
                    {expandedModuleId === mod.id ? 'Hide Assessment' : 'Manage Assessment'}
                  </span>
                </button>
                {expandedModuleId === mod.id && (
                  <div className="px-4 pb-4">
                    <ModuleAssessmentEditor courseSlug={courseSlug} moduleId={mod.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 mb-8">
        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">Upload a New Document</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title (optional — defaults to filename)"
            disabled={uploading}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-400 transition-colors disabled:opacity-60"
          />
          <select
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            disabled={uploading}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-400 transition-colors disabled:opacity-60"
          >
            <option value="">No module (course-level document)</option>
            {modules.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.title}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.txt,.png,.jpg,.jpeg"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
              className="text-xs text-slate-600 file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer disabled:opacity-60"
            />
            {uploading && <Loader2 className="w-4 h-4 text-red-600 animate-spin" />}
          </div>
          <p className="text-[11px] text-slate-400">PDF &middot; Word &middot; Excel &middot; Images &middot; TXT</p>
        </div>
      </div>

      <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">
        Existing Documents ({documents.length})
      </h2>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 text-center">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No documents uploaded to this course yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => {
            const isBusy = busyDocId === doc.id;
            return (
              <li key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{doc.title}</p>
                      <p className="text-xs text-slate-500">
                        {doc.filename} &middot; {formatBytes(doc.sizeBytes)} &middot; updated{' '}
                        {new Date(doc.updatedAt).toLocaleString()}
                        {doc.moduleId && (
                          <>
                            {' '}
                            &middot; {modules.find((m) => m.id === doc.moduleId)?.title ?? 'Module'}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      ref={(el) => {
                        replaceInputRefs.current[doc.id] = el;
                      }}
                      type="file"
                      accept=".pdf,.docx,.xlsx,.txt,.png,.jpg,.jpeg"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleReplace(doc.id, file);
                      }}
                    />
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => replaceInputRefs.current[doc.id]?.click()}
                      aria-label={`Replace ${doc.title}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-slate-700 border border-slate-200 hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-50"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Replace</span>
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(doc.id, doc.title)}
                      aria-label={`Delete ${doc.title}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-red-700 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex items-center gap-1.5 text-[11px] text-slate-400">
        <Upload className="w-3 h-3" />
        <span>Students can view these at /courses/{courseSlug}/documents</span>
      </div>
    </div>
  );
};

interface ModuleAssessmentEditorProps {
  courseSlug: string;
  moduleId: string;
}

const ModuleAssessmentEditor: React.FC<ModuleAssessmentEditorProps> = ({ courseSlug, moduleId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ title: '', instructions: '', rubric: '', maxScore: 100 });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/courses/${courseSlug}/modules/${moduleId}/assessment`)
      .then((res) => res.json())
      .then((body: { success: boolean; assessment?: Assessment }) => {
        if (!cancelled && body.success && body.assessment) {
          setForm({
            title: body.assessment.title,
            instructions: body.assessment.instructions,
            rubric: body.assessment.rubric,
            maxScore: body.assessment.maxScore,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseSlug, moduleId]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.instructions.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/courses/${courseSlug}/modules/${moduleId}/assessment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Failed to save assessment.');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assessment.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Loading assessment…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100">
      <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider pt-3">
        <ClipboardList className="w-3.5 h-3.5 text-red-600" />
        Assessment
      </div>
      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Assessment title"
        disabled={saving}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-400 transition-colors disabled:opacity-60"
      />
      <textarea
        value={form.instructions}
        onChange={(e) => setForm({ ...form, instructions: e.target.value })}
        placeholder="Instructions shown to the student"
        rows={3}
        disabled={saving}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-400 transition-colors disabled:opacity-60 resize-y"
      />
      <textarea
        value={form.rubric}
        onChange={(e) => setForm({ ...form, rubric: e.target.value })}
        placeholder="Evaluation rubric / criteria for Gemini (optional but recommended)"
        rows={2}
        disabled={saving}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-400 transition-colors disabled:opacity-60 resize-y"
      />
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-slate-500">Max Score</label>
        <input
          type="number"
          min={1}
          value={form.maxScore}
          onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) || 100 })}
          disabled={saving}
          className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-400 transition-colors disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.title.trim() || !form.instructions.trim()}
          className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Assessment
        </button>
      </div>
      {saved && <p className="text-xs text-green-700">Saved.</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
};

'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { SystemStatusEntry } from '@/lib/superAdmin/realData';

interface SystemStatusPanelProps {
  /** Optional preloaded status list (e.g. from the dashboard route) so this panel doesn't have to fetch on its own. */
  status?: SystemStatusEntry[];
}

/** Real health checks — Database connectivity is a live `SELECT 1`, others reflect actual env/config presence. See realData.getSystemStatus. */
export const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({ status }) => {
  const [data, setData] = useState<SystemStatusEntry[] | null>(status ?? null);

  useEffect(() => {
    if (status) {
      setData(status);
      return;
    }
    fetch('/api/super-admin/dashboard')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load system status.');
        setData(body.data.systemStatus);
      })
      .catch(() => setData([]));
  }, [status]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 h-full">
      <h3 className="text-sm font-bold text-slate-900 mb-3">System Status</h3>
      {!data ? (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading…</span>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.map((s) => {
            const Icon = s.operational ? CheckCircle2 : XCircle;
            const className = s.operational ? 'text-emerald-700' : 'text-red-700';
            return (
              <li key={s.name} className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-slate-100 bg-slate-50/60">
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${className}`} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{s.name}</p>
                  <p className={`text-[10px] font-medium ${className}`}>{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

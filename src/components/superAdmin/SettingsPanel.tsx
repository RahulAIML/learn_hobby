import React from 'react';
import { Sparkles, GraduationCap, Bell, Shield } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { SystemStatusPanel } from '@/components/superAdmin/SystemStatusPanel';

const SETTINGS_GROUPS = [
  {
    icon: Sparkles,
    title: 'CBT Defaults',
    items: [
      { label: 'Default time limit', value: '30 minutes' },
      { label: 'Default MCQ options', value: '4' },
      { label: 'Default difficulty', value: 'Intermediate' },
    ],
  },
  {
    icon: GraduationCap,
    title: 'Platform Branding',
    items: [
      { label: 'Platform name', value: 'GURUKUL' },
      { label: 'Accent color', value: 'Red' },
      { label: 'Support email', value: 'admissions@gurukul.edu' },
    ],
  },
  {
    icon: Bell,
    title: 'Notifications',
    items: [
      { label: 'Admin activity alerts', value: 'Enabled' },
      { label: 'Weekly digest email', value: 'Enabled' },
    ],
  },
  {
    icon: Shield,
    title: 'Security',
    items: [
      { label: 'Session duration', value: '7 days' },
      { label: 'Two-factor authentication', value: 'Not configured' },
    ],
  },
];

/** Read-only preview — platform settings management is not implemented yet (backend/config phase). */
export const SettingsPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Platform-wide configuration." />
      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md inline-block px-2.5 py-1">
        Settings are read-only for now — editable configuration lands in a follow-up.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
        {SETTINGS_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.title} className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">{group.title}</h3>
              </div>
              <dl className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <dt className="text-slate-500">{item.label}</dt>
                    <dd className="font-semibold text-slate-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      <SystemStatusPanel />
    </div>
  );
};

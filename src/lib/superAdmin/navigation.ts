import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  ClipboardCheck,
  FolderOpen,
  BarChart3,
  FileBarChart,
  ShieldCheck,
  UserCog,
  Settings,
  ScrollText,
} from 'lucide-react';

export interface SuperAdminNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface SuperAdminNavGroup {
  label: string;
  items: SuperAdminNavItem[];
}

export const SUPER_ADMIN_NAV: SuperAdminNavGroup[] = [
  {
    label: 'Overview',
    items: [{ key: 'dashboard', label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard }],
  },
  {
    label: 'Platform',
    items: [
      { key: 'students', label: 'Students', href: '/super-admin/students', icon: Users },
      { key: 'courses', label: 'Courses', href: '/super-admin/courses', icon: BookOpen },
      { key: 'modules', label: 'Modules', href: '/super-admin/modules', icon: Layers },
      { key: 'assessments', label: 'Assessments', href: '/super-admin/assessments', icon: ClipboardCheck },
      { key: 'documents', label: 'Documents', href: '/super-admin/documents', icon: FolderOpen },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { key: 'performance', label: 'Performance', href: '/super-admin/performance', icon: BarChart3 },
      { key: 'reports', label: 'Reports', href: '/super-admin/reports', icon: FileBarChart },
    ],
  },
  {
    label: 'Administration',
    items: [
      { key: 'admins', label: 'Admin Management', href: '/super-admin/admins', icon: ShieldCheck },
      { key: 'users', label: 'User Information', href: '/super-admin/users', icon: UserCog },
    ],
  },
  {
    label: 'System',
    items: [
      { key: 'settings', label: 'Settings', href: '/super-admin/settings', icon: Settings },
      { key: 'audit-logs', label: 'Audit Logs', href: '/super-admin/audit-logs', icon: ScrollText },
    ],
  },
];

export const SUPER_ADMIN_NAV_FLAT: SuperAdminNavItem[] = SUPER_ADMIN_NAV.flatMap((group) => group.items);

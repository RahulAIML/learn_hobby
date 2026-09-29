import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FolderOpen,
  BookOpen,
  Layers,
  BarChart3,
  Settings,
} from 'lucide-react';

/**
 * Single source of truth for the admin sidebar / breadcrumbs. Each item's
 * `href` is matched against the current pathname to derive both the active
 * nav state and the breadcrumb trail, so a page only has to say which nav
 * key it belongs to (see AdminLayout's `active` prop) rather than hand-roll
 * breadcrumbs per page.
 */
export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** True for nav items that don't have real functionality behind them yet — routes to a "Coming soon" placeholder. */
  comingSoon?: boolean;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: '',
    items: [{ key: 'dashboard', label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'Management',
    items: [
      { key: 'students', label: 'Students', href: '/admin/students', icon: Users },
      { key: 'assessments', label: 'Assessments', href: '/admin/cbt', icon: ClipboardCheck },
      { key: 'courses', label: 'Courses & Documents', href: '/admin/courses', icon: FolderOpen },
    ],
  },
  {
    label: 'Platform',
    items: [
      { key: 'users', label: 'Registered Users', href: '/admin/users', icon: BookOpen },
      { key: 'modules', label: 'Modules', href: '/admin/modules', icon: Layers, comingSoon: true },
      { key: 'performance', label: 'Performance', href: '/admin/performance', icon: BarChart3, comingSoon: true },
    ],
  },
  {
    label: 'Administration',
    items: [{ key: 'settings', label: 'Settings', href: '/admin/settings', icon: Settings, comingSoon: true }],
  },
];

export const ADMIN_NAV_FLAT: AdminNavItem[] = ADMIN_NAV.flatMap((group) => group.items);

export function findNavItem(key: string): AdminNavItem | undefined {
  return ADMIN_NAV_FLAT.find((item) => item.key === key);
}

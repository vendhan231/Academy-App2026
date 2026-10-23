'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  CalendarCheck,
  User,
  Users,
  ClipboardCheck,
  LayoutDashboard,
  BarChart3,
  UserRoundCheck,
} from 'lucide-react';
import { UserRole } from '@/types';
import { IconComponent } from '@/lib/icons';

export interface NavItem {
  href: string;
  label: string;
  Icon: IconComponent;
}

/**
 * Bottom navigation per role. Every entry is a real route and every tab is
 * three to five items so the bar stays comfortable on a phone.
 */
export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  STUDENT: [
    { href: '/student', label: 'Home', Icon: Home },
    { href: '/student/attendance', label: 'Attendance', Icon: CalendarCheck },
    { href: '/student/profile', label: 'Profile', Icon: User },
  ],
  COACH: [
    { href: '/coach', label: 'Home', Icon: Home },
    { href: '/coach/attendance', label: 'Mark', Icon: ClipboardCheck },
    { href: '/coach/students', label: 'Students', Icon: Users },
    { href: '/coach/profile', label: 'Profile', Icon: User },
  ],
  ADMIN: [
    { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/admin/students', label: 'Students', Icon: Users },
    { href: '/admin/attendance', label: 'Attendance', Icon: CalendarCheck },
    { href: '/admin/staff', label: 'Coaches', Icon: UserRoundCheck },
    { href: '/admin/reports', label: 'Reports', Icon: BarChart3 },
  ],
};

const ROLE_ROOT: Record<UserRole, string> = {
  STUDENT: '/student',
  COACH: '/coach',
  ADMIN: '/admin',
};

/**
 * Persistent bottom navigation. Every role only ever sees its own features,
 * and every target is at least 56px tall for comfortable thumb use.
 */
export const BottomNav: React.FC<{ role: UserRole }> = ({ role }) => {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_ITEMS[role];
  const root = ROLE_ROOT[role];

  return (
    <nav
      aria-label={`${role.toLowerCase()} navigation`}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg dark:border-line dark:bg-surface/95"
    >
      <div className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== root && pathname.startsWith(`${item.href}/`));

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
              className="relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-x-4 top-0 h-0.5 rounded-full transition-all duration-200 ${
                  active
                    ? 'bg-slate-900 opacity-100 dark:bg-slate-100'
                    : 'opacity-0'
                }`}
              />
              <item.Icon
                className={`h-[22px] w-[22px] transition-colors duration-200 ${
                  active ? 'text-slate-900 dark:text-slate-50' : 'text-slate-400'
                }`}
                strokeWidth={active ? 2.3 : 1.9}
              />
              <span
                className={`text-[10px] font-bold leading-none transition-colors duration-200 ${
                  active ? 'text-slate-900 dark:text-slate-50' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

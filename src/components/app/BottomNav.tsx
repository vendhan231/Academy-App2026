'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, CalendarCheck, Calendar, User, Users, ClipboardCheck, History, ShieldAlert, LayoutDashboard, BarChart3, MoreHorizontal, Images } from 'lucide-react';
import { UserRole } from '@/types';

export interface NavItem {
  href: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
}

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  STUDENT: [
    { href: '/student', label: 'Home', Icon: Home },
    { href: '/student/attendance', label: 'Attendance', Icon: CalendarCheck },
    { href: '/student/court', label: 'Book', Icon: Calendar },
    { href: '/student/gallery', label: 'Gallery', Icon: Images },
    { href: '/student/profile', label: 'Profile', Icon: User },
  ],
  COACH: [
    { href: '/coach', label: 'Home', Icon: Home },
    { href: '/coach/attendance', label: 'Mark', Icon: ClipboardCheck },
    { href: '/coach/history', label: 'History', Icon: History },
    { href: '/coach/incidents', label: 'Safety', Icon: ShieldAlert },
    { href: '/coach/profile', label: 'Profile', Icon: User },
  ],
  ADMIN: [
    { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/admin/students', label: 'Students', Icon: Users },
    { href: '/admin/attendance', label: 'Attendance', Icon: CalendarCheck },
    { href: '/admin/reports', label: 'Reports', Icon: BarChart3 },
    { href: '/admin/more', label: 'More', Icon: MoreHorizontal },
  ],
};

/**
 * Persistent bottom navigation. Every role only ever sees its own features,
 * and every target is at least 44px tall for comfortable thumb use.
 */
export const BottomNav: React.FC<{ role: UserRole }> = ({ role }) => {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_ITEMS[role];
  const root = `/${role === 'STUDENT' ? 'student' : role === 'COACH' ? 'coach' : 'admin'}`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
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
              className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors"
            >
              <item.Icon
                className={`h-5 w-5 transition-colors ${
                  active ? 'text-slate-900' : 'text-slate-400'
                }`}
              />
              <span
                className={`text-[10px] font-bold leading-none transition-colors ${
                  active ? 'text-slate-900' : 'text-slate-400'
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

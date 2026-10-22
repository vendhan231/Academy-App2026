'use client';

import React from 'react';
import { Shield, Megaphone, GraduationCap, LogIn, ChevronUp } from 'lucide-react';
import { UserRole } from '@/types';

export interface RoleEntry {
  role: UserRole;
  label: string;
  sublabel: string;
  Icon: React.FC<{ className?: string }>;
  /** Icon chip colours. */
  chip: string;
  text: string;
  glow: string;
  idLabel: string;
}

export const ROLE_ENTRIES: RoleEntry[] = [
  {
    role: 'ADMIN',
    label: 'Admin',
    sublabel: 'Director Control Room',
    Icon: Shield,
    chip: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
    text: 'text-indigo-300',
    glow: 'shadow-indigo-500/25',
    idLabel: 'Admin ID',
  },
  {
    role: 'COACH',
    label: 'Coach',
    sublabel: 'Training Staff Desk',
    Icon: Megaphone,
    chip: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
    text: 'text-sky-300',
    glow: 'shadow-sky-500/25',
    idLabel: 'Coach ID',
  },
  {
    role: 'STUDENT',
    label: 'Student',
    sublabel: 'Athlete & Parent Portal',
    Icon: GraduationCap,
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    text: 'text-emerald-300',
    glow: 'shadow-emerald-500/25',
    idLabel: 'Student ID / Code',
  },
];

interface RoleBottomNavProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleBottomNav: React.FC<RoleBottomNavProps> = ({ onSelectRole }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div id="portal-access" className="fixed inset-x-0 bottom-0 z-40 scroll-mt-24">
      <div className="mx-auto max-w-3xl px-3 pb-3">
        <div className="rounded-3xl border border-slate-700/60 bg-slate-900/95 p-1.5 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-1.5">
            {ROLE_ENTRIES.map((entry) => (
              <button
                key={entry.role}
                onClick={() => onSelectRole(entry.role)}
                className="group flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-center transition-all hover:bg-white/5 active:scale-[0.97] sm:flex-row sm:gap-2.5 sm:py-3"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105 ${entry.chip}`}
                >
                  <entry.Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="flex items-center gap-1 text-xs font-extrabold text-white sm:text-sm">
                    {entry.label}
                    <LogIn className="h-3 w-3 text-slate-500 transition-colors group-hover:text-slate-300" />
                  </span>
                  <span className="hidden text-[11px] font-medium text-slate-400 sm:block">
                    {entry.sublabel}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsed helper rail for very small screens */}
      <div className="mx-auto mb-2 hidden max-w-3xl px-3 sm:block">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm backdrop-blur transition-colors hover:text-slate-800"
        >
          Portal access
          <ChevronUp
            className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </div>
  );
};

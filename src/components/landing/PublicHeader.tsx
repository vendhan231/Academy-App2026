'use client';

import React, { useState } from 'react';
import { Trophy, Menu, X, LogIn } from 'lucide-react';

const NAV_LINKS = [
  { id: 'classes', label: 'Classes' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'wall-of-fame', label: 'Wall of Fame' },
  { id: 'events', label: 'Events' },
];

export const PublicHeader: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 text-left"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 shadow-lg shadow-orange-500/25">
            <Trophy className="h-5 w-5 text-slate-950" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
              VENDHAN SPORTS ACADEMY
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-600">
              Train · Compete · Conquer
            </span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollTo('portal-access')}
            className="hidden items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-700 sm:flex"
          >
            <LogIn className="h-4 w-4" />
            Portal Login
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="rounded-xl border border-slate-200 p-2 text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo('portal-access')}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-sm font-bold text-white"
            >
              <LogIn className="h-4 w-4" />
              Portal Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

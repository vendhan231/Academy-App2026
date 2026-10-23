'use client';

import React, { useEffect, useState } from 'react';
import { Menu, X, LogIn } from 'lucide-react';
import { Logo } from '@/components/app/Logo';
import { ThemeToggle } from '@/components/app/ThemeToggle';

const NAV_LINKS = [
  { id: 'classes', label: 'Classes' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'wall-of-fame', label: 'Wall of Fame' },
  { id: 'events', label: 'Events' },
];

export const PublicHeader: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Highlight the section the visitor is currently looking at.
  useEffect(() => {
    const sections = NAV_LINKS.map((link) => document.getElementById(link.id)).filter(
      (element): element is HTMLElement => element !== null
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-line dark:bg-surface/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"
          aria-label="Vendhan Sports Academy — back to top"
        >
          <Logo size="sm" />
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = activeSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                aria-current={active ? 'true' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            onClick={() => scrollTo('portal-access')}
            className="hidden min-h-[44px] items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white sm:flex"
          >
            <LogIn className="h-4 w-4" strokeWidth={2.2} />
            Portal Login
          </button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            title={mobileOpen ? 'Close menu' : 'Open menu'}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 md:hidden dark:border-line dark:text-slate-200 dark:hover:bg-white/10"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-200 bg-white px-4 py-3 md:hidden dark:border-line dark:bg-surface"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="min-h-[44px] rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo('portal-access')}
              className="mt-1 flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              <LogIn className="h-4 w-4" strokeWidth={2.2} />
              Portal Login
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

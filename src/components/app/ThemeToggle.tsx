'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'vsa-theme';

/** Applies the theme to the document and remembers the choice. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage is optional: the theme still applies for this page view.
  }
}

/**
 * Inline script that applies the saved theme before the first paint, so a dark
 * mode user never sees a white flash while the bundle loads.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

interface ThemeToggleProps {
  /** Visual weight of the control. */
  variant?: 'ghost' | 'solid';
  className?: string;
}

/**
 * Switches between the light and the dark theme. The control is icon only,
 * so it carries an accessible label and a tooltip.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'ghost', className = '' }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  const base =
    'flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200';

  const skin =
    variant === 'solid'
      ? 'border border-white/15 bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
      : 'border border-line bg-surface text-muted hover:bg-surface-3 hover:text-body';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={theme === 'dark'}
      className={`${base} ${skin} ${className}`}
    >
      {mounted && theme === 'dark' ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={2} />
      ) : (
        <Moon className="h-[18px] w-[18px]" strokeWidth={2} />
      )}
    </button>
  );
};

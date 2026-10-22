'use client';

import React from 'react';
import { Loader2, Inbox, AlertCircle } from 'lucide-react';
import { getSport, SportId } from '@/lib/sports';
import { SportIcon } from './SportIcon';

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    <p className="text-sm font-semibold text-slate-500">{label}</p>
  </div>
);

export const EmptyState: React.FC<{ title: string; hint?: string; icon?: React.ReactNode }> = ({
  title,
  hint,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
    <span className="text-slate-300">{icon ?? <Inbox className="h-8 w-8" />}</span>
    <p className="text-sm font-bold text-slate-700">{title}</p>
    {hint && <p className="max-w-xs text-xs leading-relaxed text-slate-500">{hint}</p>}
  </div>
);

export const ErrorState: React.FC<{ title?: string; message?: string; onRetry?: () => void }> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
    <AlertCircle className="h-7 w-7 text-rose-500" />
    <p className="text-sm font-bold text-rose-900">{title}</p>
    {message && <p className="max-w-xs text-xs leading-relaxed text-rose-700">{message}</p>}
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-1 min-h-[40px] rounded-xl bg-rose-600 px-4 text-xs font-bold text-white transition-colors hover:bg-rose-700"
      >
        Try again
      </button>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
/* ------------------------------------------------------------------ */

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
    {children}
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({
  children,
  action,
}) => (
  <div className="mb-2.5 flex items-center justify-between gap-3">
    <h2 className="text-sm font-extrabold tracking-tight text-slate-900">{children}</h2>
    {action}
  </div>
);

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'accent';
}> = ({ label, value, hint, tone = 'default' }) => (
  <div
    className={`rounded-2xl border p-3.5 ${
      tone === 'accent'
        ? 'border-slate-900 bg-slate-900 text-white'
        : 'border-slate-200 bg-white text-slate-900'
    }`}
  >
    <p className={`text-[10px] font-bold uppercase tracking-wider ${tone === 'accent' ? 'text-slate-400' : 'text-slate-500'}`}>
      {label}
    </p>
    <p className="mt-1 text-2xl font-extrabold leading-none">{value}</p>
    {hint && (
      <p className={`mt-1 text-[11px] font-medium ${tone === 'accent' ? 'text-slate-400' : 'text-slate-500'}`}>
        {hint}
      </p>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* Sport chips                                                         */
/* ------------------------------------------------------------------ */

export const SportChip: React.FC<{ sportId: SportId; size?: 'sm' | 'md' }> = ({
  sportId,
  size = 'md',
}) => {
  const sport = getSport(sportId);
  const dimension = size === 'sm' ? 'h-6 w-6 rounded-lg' : 'h-9 w-9 rounded-xl';

  return (
    <span
      className={`inline-flex ${dimension} shrink-0 items-center justify-center ${sport.accent.soft} ${sport.accent.text}`}
      title={sport.name}
    >
      <SportIcon sportId={sportId} className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'} />
    </span>
  );
};

export const SportTag: React.FC<{ sportId: SportId }> = ({ sportId }) => {
  const sport = getSport(sportId);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${sport.accent.soft} ${sport.accent.text}`}
    >
      <SportIcon sportId={sportId} className="h-3.5 w-3.5" />
      {sport.name}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Buttons & inputs                                                    */
/* ------------------------------------------------------------------ */

export const PrimaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'dark' | 'green' | 'red' }
> = ({ children, className = '', tone = 'dark', ...rest }) => {
  const tones = {
    dark: 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300',
    green: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300',
    red: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-slate-300',
  };
  return (
    <button
      {...rest}
      className={`min-h-[46px] w-full rounded-xl px-4 text-sm font-extrabold transition-colors disabled:cursor-not-allowed ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
};

export const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = '',
  ...rest
}) => (
  <button
    {...rest}
    className={`min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

export const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, children, hint }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
  </label>
);

export const inputClass =
  'min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 placeholder:font-normal placeholder:text-slate-400';

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export const Avatar: React.FC<{ src?: string; name: string; className?: string }> = ({
  src,
  name,
  className = 'h-10 w-10',
}) => (
  <img
    src={src}
    alt={name}
    className={`${className} shrink-0 rounded-full border border-slate-200 bg-slate-100 object-cover`}
  />
);

export const ProgressBar: React.FC<{ value: number; tone?: string }> = ({
  value,
  tone = 'bg-emerald-500',
}) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
    <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

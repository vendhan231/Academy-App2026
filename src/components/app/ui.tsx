'use client';

import React, { useEffect, useId } from 'react';
import { Loader2, Inbox, AlertCircle, X } from 'lucide-react';
import { getSport, SportId } from '@/lib/sports';
import { SportIcon } from './SportIcon';

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center" role="status">
    <Loader2 className="h-6 w-6 animate-spin text-slate-400" strokeWidth={2.2} />
    <p className="text-sm font-semibold text-slate-500">{label}</p>
  </div>
);

/** Placeholder blocks used while a list is loading. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-white/10 ${className}`} />
);

export const SkeletonList: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="space-y-3" aria-hidden="true">
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-line dark:bg-surface"
      >
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="mt-2.5 h-3 w-2/3" />
      </div>
    ))}
  </div>
);

export const EmptyState: React.FC<{ title: string; hint?: string; icon?: React.ReactNode }> = ({
  title,
  hint,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-line-strong dark:bg-surface">
    <span className="text-slate-300 dark:text-slate-600">{icon ?? <Inbox className="h-8 w-8" />}</span>
    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</p>
    {hint && <p className="max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">{hint}</p>}
  </div>
);

export const ErrorState: React.FC<{ title?: string; message?: string; onRetry?: () => void }> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => (
  <div
    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center dark:border-rose-500/30 dark:bg-rose-950/40"
    role="alert"
  >
    <AlertCircle className="h-7 w-7 text-rose-500" strokeWidth={2.2} />
    <p className="text-sm font-bold text-rose-900 dark:text-rose-100">{title}</p>
    {message && (
      <p className="max-w-xs text-xs leading-relaxed text-rose-700 dark:text-rose-200">{message}</p>
    )}
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-1 min-h-[44px] rounded-xl bg-rose-600 px-4 text-xs font-bold text-white transition-colors hover:bg-rose-700"
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
  <div
    className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-line dark:bg-surface ${className}`}
  >
    {children}
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({
  children,
  action,
}) => (
  <div className="mb-2.5 flex items-center justify-between gap-3">
    <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
      {children}
    </h2>
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
    className={`rounded-2xl border p-3.5 transition-transform duration-200 ${
      tone === 'accent'
        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
        : 'border-slate-200 bg-white text-slate-900 dark:border-line dark:bg-surface dark:text-slate-100'
    }`}
  >
    <p
      className={`text-[10px] font-bold uppercase tracking-wider ${
        tone === 'accent' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500'
      }`}
    >
      {label}
    </p>
    <p className="mt-1 text-2xl font-extrabold leading-none">{value}</p>
    {hint && (
      <p
        className={`mt-1 text-[11px] font-medium ${
          tone === 'accent' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500'
        }`}
      >
        {hint}
      </p>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* Badges & chips                                                      */
/* ------------------------------------------------------------------ */

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
  danger: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200',
  accent: 'bg-amber-500 text-slate-950',
};

export const Badge: React.FC<{
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}> = ({ children, tone = 'neutral', className = '' }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${BADGE_TONES[tone]} ${className}`}
  >
    {children}
  </span>
);

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
    dark: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700',
    green: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300',
    red: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 disabled:bg-slate-300',
  };
  return (
    <button
      {...rest}
      className={`min-h-[46px] w-full rounded-xl px-4 text-sm font-extrabold transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:active:scale-100 ${tones[tone]} ${className}`}
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
    className={`min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100 dark:border-line dark:bg-surface dark:text-slate-200 dark:hover:bg-white/5 ${className}`}
  >
    {children}
  </button>
);

/**
 * Icon only button. Always needs a label: it is used as the accessible name
 * and as the tooltip.
 */
export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: 'sm' | 'md' }
> = ({ label, size = 'md', className = '', children, ...rest }) => {
  const dimension = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';

  return (
    <button
      {...rest}
      type={rest.type ?? 'button'}
      aria-label={label}
      title={label}
      className={`${dimension} inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-line dark:bg-surface dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white ${className}`}
    >
      {children}
    </button>
  );
};

export const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
}> = ({ label, children, hint, error, required, htmlFor }) => (
  <label className="block" htmlFor={htmlFor}>
    <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
      {label}
      {required && <span className="ml-0.5 text-rose-600 dark:text-rose-400">*</span>}
    </span>
    {children}
    {error ? (
      <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
        <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2.4} />
        {error}
      </span>
    ) : (
      hint && <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">{hint}</span>
    )}
  </label>
);

export const inputClass =
  'min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 placeholder:font-normal placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 dark:border-line dark:bg-surface dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-100 dark:focus:ring-white/10 dark:disabled:bg-white/5';

/* ------------------------------------------------------------------ */
/* Dialog                                                              */
/* ------------------------------------------------------------------ */

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal confirmation used before destructive actions. Traps focus on the
 * confirm button and closes on Escape.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm animate-sheet-in rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-float)] dark:border-line dark:bg-surface">
        <div className="flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-50"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            title="Close"
            className="-m-1 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[46px] flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-line dark:bg-surface dark:text-slate-200 dark:hover:bg-white/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            className={`min-h-[46px] flex-1 rounded-xl px-4 text-sm font-extrabold text-white transition-colors disabled:opacity-60 ${
              tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

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
    loading="lazy"
    decoding="async"
    className={`${className} shrink-0 rounded-full border border-slate-200 bg-slate-100 object-cover dark:border-line dark:bg-white/10`}
  />
);

export const ProgressBar: React.FC<{ value: number; tone?: string }> = ({
  value,
  tone = 'bg-emerald-500',
}) => (
  <div
    className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
    role="progressbar"
    aria-valuenow={Math.round(value)}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <div
      className={`h-full rounded-full transition-[width] duration-500 ${tone}`}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

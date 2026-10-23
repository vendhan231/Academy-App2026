'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const TONES = {
  success: 'border-emerald-200 bg-emerald-50/95 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/90 dark:text-emerald-50',
  error: 'border-rose-200 bg-rose-50/95 text-rose-950 dark:border-rose-500/30 dark:bg-rose-950/90 dark:text-rose-50',
  warning: 'border-amber-200 bg-amber-50/95 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/90 dark:text-amber-50',
  info: 'border-sky-200 bg-sky-50/95 text-sky-950 dark:border-sky-500/30 dark:bg-sky-950/90 dark:text-sky-50',
};

const ICON_TONES = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-sky-600 dark:text-sky-400',
};

export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-24 z-50 flex max-w-md flex-col gap-2 md:inset-x-auto md:bottom-5 md:right-5"
      role="region"
      aria-label="Notifications"
    >
      <div aria-live="polite" aria-atomic="false" className="contents">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex animate-toast-in items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur ${TONES[toast.type]}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ICON_TONES[toast.type]}`} strokeWidth={2.2} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold leading-tight">{toast.title}</div>
                {toast.description && (
                  <div className="mt-1 text-xs leading-relaxed opacity-90">{toast.description}</div>
                )}
                <div className="mt-1 text-[10px] opacity-60">{toast.timestamp}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label={`Dismiss notification: ${toast.title}`}
                title="Dismiss"
                className="-m-1 rounded-lg p-2 text-current opacity-50 transition-opacity hover:opacity-100"
              >
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

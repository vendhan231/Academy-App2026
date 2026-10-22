import { AccentTone } from '@/data/publicSiteData';

export interface AccentTheme {
  /** Small uppercase label chip. */
  chip: string;
  /** Icon container. */
  iconBg: string;
  iconText: string;
  /** Primary action button. */
  button: string;
  /** Card top accent bar. */
  bar: string;
  /** Section heading underline. */
  dot: string;
  /** Soft background wash. */
  soft: string;
}

export const ACCENT_THEME: Record<AccentTone, AccentTheme> = {
  emerald: {
    chip: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    soft: 'from-emerald-50/70 to-white',
  },
  amber: {
    chip: 'bg-amber-100 text-amber-800 border-amber-200',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-700',
    button: 'bg-amber-500 hover:bg-amber-600 text-slate-950',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    soft: 'from-amber-50/70 to-white',
  },
  sky: {
    chip: 'bg-sky-100 text-sky-800 border-sky-200',
    iconBg: 'bg-sky-100',
    iconText: 'text-sky-700',
    button: 'bg-sky-600 hover:bg-sky-700 text-white',
    bar: 'bg-sky-500',
    dot: 'bg-sky-500',
    soft: 'from-sky-50/70 to-white',
  },
  violet: {
    chip: 'bg-violet-100 text-violet-800 border-violet-200',
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-700',
    button: 'bg-violet-600 hover:bg-violet-700 text-white',
    bar: 'bg-violet-500',
    dot: 'bg-violet-500',
    soft: 'from-violet-50/70 to-white',
  },
};

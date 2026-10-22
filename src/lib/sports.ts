/**
 * The academy's official sport catalogue.
 *
 * Every enrolment, coach assignment, attendance sheet and filter in the app
 * resolves its sport through this list, so the eight sports below are the only
 * options that can ever be picked.
 */

export const SPORT_IDS = [
  'badminton',
  'roller-skating',
  'chess',
  'silambam',
  'archery',
  'physical-fitness',
  'yoga',
  'football',
] as const;

export type SportId = (typeof SPORT_IDS)[number];

export interface Sport {
  id: SportId;
  name: string;
  /** Short label for dense UI (chips, nav). */
  short: string;
  /** Tailwind accent classes used for chips and icon tiles. */
  accent: {
    bg: string;
    text: string;
    ring: string;
    soft: string;
  };
}

export const SPORTS: Sport[] = [
  {
    id: 'badminton',
    name: 'Badminton',
    short: 'Badminton',
    accent: {
      bg: 'bg-sky-500',
      text: 'text-sky-600',
      ring: 'ring-sky-200',
      soft: 'bg-sky-50',
    },
  },
  {
    id: 'roller-skating',
    name: 'Roller Skating',
    short: 'Skating',
    accent: {
      bg: 'bg-fuchsia-500',
      text: 'text-fuchsia-600',
      ring: 'ring-fuchsia-200',
      soft: 'bg-fuchsia-50',
    },
  },
  {
    id: 'chess',
    name: 'Chess',
    short: 'Chess',
    accent: {
      bg: 'bg-slate-700',
      text: 'text-slate-700',
      ring: 'ring-slate-200',
      soft: 'bg-slate-100',
    },
  },
  {
    id: 'silambam',
    name: 'Silambam',
    short: 'Silambam',
    accent: {
      bg: 'bg-rose-500',
      text: 'text-rose-600',
      ring: 'ring-rose-200',
      soft: 'bg-rose-50',
    },
  },
  {
    id: 'archery',
    name: 'Archery',
    short: 'Archery',
    accent: {
      bg: 'bg-amber-500',
      text: 'text-amber-600',
      ring: 'ring-amber-200',
      soft: 'bg-amber-50',
    },
  },
  {
    id: 'physical-fitness',
    name: 'Physical Fitness',
    short: 'Fitness',
    accent: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-600',
      ring: 'ring-emerald-200',
      soft: 'bg-emerald-50',
    },
  },
  {
    id: 'yoga',
    name: 'Yoga',
    short: 'Yoga',
    accent: {
      bg: 'bg-teal-500',
      text: 'text-teal-600',
      ring: 'ring-teal-200',
      soft: 'bg-teal-50',
    },
  },
  {
    id: 'football',
    name: 'Football',
    short: 'Football',
    accent: {
      bg: 'bg-violet-500',
      text: 'text-violet-600',
      ring: 'ring-violet-200',
      soft: 'bg-violet-50',
    },
  },
];

const SPORT_MAP = new Map(SPORTS.map((sport) => [sport.id, sport]));

export function getSport(id: SportId): Sport {
  const sport = SPORT_MAP.get(id);
  if (!sport) throw new Error(`Unknown sport id: ${id}`);
  return sport;
}

export function sportName(id: SportId): string {
  return getSport(id).name;
}

export function isSportId(value: unknown): value is SportId {
  return typeof value === 'string' && (SPORT_IDS as readonly string[]).includes(value);
}

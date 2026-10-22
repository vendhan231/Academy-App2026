'use client';

import React from 'react';
import {
  Dumbbell,
  Target,
  Swords,
  Goal,
  Crown,
  Circle,
  PersonStanding,
  Activity,
} from 'lucide-react';
import { SportId } from '@/lib/sports';

/**
 * Simple, recognisable glyph for every one of the academy's eight sports.
 */
const ICONS: Record<SportId, React.FC<{ className?: string }>> = {
  badminton: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14.8 3.2 20.8 9.2M9.2 14.8 3.2 20.8M20.8 9.2a5 5 0 0 0-7 0l-2 2 3 3 2-2a5 5 0 0 1 7 0M3.2 20.8a5 5 0 0 0 4 1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  'roller-skating': ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="7" cy="17.5" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.5" cy="17.5" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.2 17.5h2.6m2.5 0h2.2M11 15.3l1.2-4.1 3.2 2.2 1.6 4.1M12.2 11.2l-2.6 1.3-1 2.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  chess: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 20h10M8 17h8M9.5 17v-2.2c-1.6-.6-2.7-2-2.7-3.6 0-1.3.7-2.5 1.8-3.1L8 7h8l-.6 1.1c1.1.6 1.8 1.8 1.8 3.1 0 1.6-1.1 3-2.7 3.6V17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.8 7 12 4l2.2 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  silambam: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 6.5 14.5 17M20 6.5 9.5 17M6.4 4.1 4 6.5l2.4 2.4M17.6 4.1 20 6.5l-2.4 2.4M6.4 19.9 4 17.5l2.4-2.4M17.6 19.9 20 17.5l-2.4-2.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  archery: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  ),
  'physical-fitness': ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 12h2M19 12h2M6.5 9.5v5M17.5 9.5v5M6.5 12h11M9 9v6M15 9v6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  ),
  yoga: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="4.6" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7.5v5m0 0-4 6m4-6 4 6M6 11h12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  football: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m12 7.8 3.4 2.5-1.3 4h-4.2L8.6 10.3 12 7.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 3.5v4.3M20.5 12h-4.3M12 20.5v-4.3M3.5 12h4.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export const SportIcon: React.FC<{ sportId: SportId; className?: string }> = ({
  sportId,
  className = 'h-4 w-4',
}) => {
  const Icon = ICONS[sportId] ?? Circle;
  return <Icon className={className} />;
};

export { Dumbbell, Target, Swords, Goal, Crown, PersonStanding, Activity };

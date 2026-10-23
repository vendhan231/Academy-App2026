'use client';

import React from 'react';

interface LogoProps {
  /** Visual size of the mark. */
  size?: 'sm' | 'md' | 'lg';
  /** Show the wordmark next to the mark. */
  showWordmark?: boolean;
  /** Use the light treatment for dark backgrounds. */
  tone?: 'light' | 'dark';
  className?: string;
}

const MARK_SIZE = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
};

const WORD_SIZE = {
  sm: 'text-[13px]',
  md: 'text-sm sm:text-base',
  lg: 'text-lg sm:text-xl',
};

/**
 * The academy mark: a stylised athlete inside a warm gradient tile, paired
 * with the wordmark. Used in the public header, the login screen and the
 * signed in shell so the brand is identical everywhere.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  tone = 'dark',
  className = '',
}) => {
  const light = tone === 'light';

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`flex ${MARK_SIZE[size]} shrink-0 items-center justify-center bg-gradient-to-br from-amber-400 via-orange-500 to-amber-300 shadow-[0_8px_20px_-8px_rgba(249,115,22,0.7)]`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="h-[62%] w-[62%]" fill="none">
          <circle cx="32" cy="22" r="6.5" fill="#0f172a" />
          <path
            d="M17 46c2.4-8.2 8.2-12.4 15-12.4S44.6 37.8 47 46"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M14 22.5h8M42 22.5h8"
            stroke="#0f172a"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </span>

      {showWordmark && (
        <span className="flex min-w-0 flex-col leading-tight">
          <span
            className={`truncate font-extrabold tracking-tight ${
              WORD_SIZE[size]
            } ${light ? 'text-white' : 'text-slate-900 dark:text-slate-50'}`}
          >
            VENDHAN SPORTS ACADEMY
          </span>
          <span
            className={`truncate text-[10px] font-semibold uppercase tracking-[0.18em] ${
              light ? 'text-amber-300' : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            Train · Compete · Conquer
          </span>
        </span>
      )}
    </span>
  );
};

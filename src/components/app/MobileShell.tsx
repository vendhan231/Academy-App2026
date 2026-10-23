'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BottomNav } from './BottomNav';
import { Avatar, LoadingState } from './ui';
import { ThemeToggle } from './ThemeToggle';
import { roleHome } from '@/lib/session';
import { UserRole } from '@/types';

interface MobileShellProps {
  role: UserRole;
  title: string;
  subtitle?: string;
  /** Rendered on the right of the header (buttons, filters). */
  action?: React.ReactNode;
  /** Show a back button that returns to the role home. */
  backHref?: string;
  children: React.ReactNode;
}

/**
 * Shared chrome for every signed in screen: a compact header, the role's
 * bottom navigation, and an automatic redirect to the login screen when the
 * session has expired.
 */
export const MobileShell: React.FC<MobileShellProps> = ({
  role,
  title,
  subtitle,
  action,
  backHref,
  children,
}) => {
  const { currentUser, isAuthenticated, isReady, signOut } = useApp();
  const router = useRouter();

  // Session guard: an expired or missing session sends the user to login.
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/login?reason=expired');
    }
  }, [isReady, isAuthenticated, router]);

  // A user who somehow lands on another role's screen is sent to their own.
  useEffect(() => {
    if (isReady && isAuthenticated && currentUser && currentUser.role !== role) {
      router.replace(roleHome(currentUser.role));
    }
  }, [isReady, isAuthenticated, currentUser, role, router]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // The local session is cleared regardless.
    }
    signOut();
    router.replace('/login');
  };

  if (!isReady || !isAuthenticated) {
    return (
      <div className="min-h-dvh bg-surface-2">
        <LoadingState label="Checking your session..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-lg dark:border-line dark:bg-surface/95">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-3">
          {backHref ? (
            <button
              onClick={() => router.push(backHref)}
              aria-label="Go back"
              title="Go back"
              className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <Avatar src={currentUser?.avatar} name={currentUser?.name ?? ''} className="h-10 w-10" />
          )}

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>

          {action}

          <ThemeToggle />

          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">{children}</main>

      <BottomNav role={role} />
    </div>
  );
};

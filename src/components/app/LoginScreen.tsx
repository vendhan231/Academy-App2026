'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Megaphone,
  GraduationCap,
  Lock,
  UserCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { roleHome } from '@/lib/session';
import { UserRole } from '@/types';
import { IconComponent } from '@/lib/icons';

interface RoleOption {
  role: UserRole;
  label: string;
  blurb: string;
  Icon: IconComponent;
  demoId: string;
  demoPassword: string;
  active: string;
  idle: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'STUDENT',
    label: 'Student',
    blurb: 'My sports, attendance & profile',
    Icon: GraduationCap,
    demoId: '001',
    demoPassword: 'vendhan',
    active: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-200',
    idle: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-line dark:bg-surface dark:text-slate-400 dark:hover:text-slate-200',
  },
  {
    role: 'COACH',
    label: 'Coach',
    blurb: 'Batches & attendance marking',
    Icon: Megaphone,
    demoId: 'coach',
    demoPassword: 'coach123',
    active: 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-200',
    idle: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-line dark:bg-surface dark:text-slate-400 dark:hover:text-slate-200',
  },
  {
    role: 'ADMIN',
    label: 'Admin',
    blurb: 'Full academy management',
    Icon: ShieldCheck,
    demoId: 'admin',
    demoPassword: 'admin123',
    active: 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-200',
    idle: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-line dark:bg-surface dark:text-slate-400 dark:hover:text-slate-200',
  },
];

export const LoginScreen: React.FC = () => {
  const { signIn, currentUser, isReady } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedRole = ROLE_OPTIONS.find((option) => option.role === searchParams.get('role'));
  const [role, setRole] = useState<UserRole>(requestedRole?.role ?? 'STUDENT');
  const [loginId, setLoginId] = useState(requestedRole?.demoId ?? '001');
  const [password, setPassword] = useState(requestedRole?.demoPassword ?? 'vendhan');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<{ id?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const nextPath = searchParams.get('next');
  const reason = searchParams.get('reason');

  // Already signed in: skip the form.
  useEffect(() => {
    if (isReady && currentUser) {
      router.replace(roleHome(currentUser.role));
    }
  }, [isReady, currentUser, router]);

  const selectRole = (option: RoleOption) => {
    setRole(option.role);
    setLoginId(option.demoId);
    setPassword(option.demoPassword);
    setError('');
    setFieldError({});
  };

  const validate = () => {
    const next: { id?: string; password?: string } = {};
    if (!loginId.trim()) next.id = 'Enter your login ID.';
    if (!password.trim()) next.password = 'Enter your password.';
    setFieldError(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loginId, password, role }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Sign in failed. Please try again.');
        setLoading(false);
        return;
      }

      signIn({ user: data.user, token: data.token, expiresAt: data.expiresAt });

      // Only honour the redirect target when it belongs to the signed in role.
      const allowedPrefix = roleHome(data.user.role);
      const target =
        nextPath && nextPath.startsWith(allowedPrefix) ? nextPath : allowedPrefix;
      router.replace(target);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <button
          onClick={() => router.push('/')}
          className="mb-6 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Academy site
        </button>

        <div className="mb-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-300">
            <ShieldCheck className="h-6 w-6 text-slate-950" strokeWidth={2.2} />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-slate-400">Choose your area, then enter your credentials.</p>
        </div>

        {reason === 'expired' && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-xs font-semibold text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Your session expired. Please sign in again.
          </div>
        )}

        {/* Role picker */}
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Choose your portal">
          {ROLE_OPTIONS.map((option) => {
            const selected = option.role === role;
            return (
              <button
                key={option.role}
                onClick={() => selectRole(option)}
                aria-pressed={selected}
                className={`flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-center transition-all duration-200 ${
                  selected ? option.active : option.idle
                }`}
              >
                <option.Icon className="h-5 w-5" strokeWidth={2.1} />
                <span className="text-xs font-extrabold">{option.label}</span>
                <span className="text-[10px] leading-tight opacity-80">{option.blurb}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {error && (
            <div
              className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-200"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="login-id" className="mb-1.5 block text-xs font-bold text-slate-300">
              {role === 'STUDENT' ? 'Student ID' : role === 'COACH' ? 'Coach ID' : 'Admin ID'}
            </label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
              <input
                id="login-id"
                type="text"
                inputMode="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                aria-invalid={Boolean(fieldError.id)}
                aria-describedby={fieldError.id ? 'login-id-error' : undefined}
                required
                className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 font-mono text-sm font-bold text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 placeholder:font-sans placeholder:font-normal placeholder:text-slate-500"
                placeholder="e.g. 001"
              />
            </div>
            {fieldError.id && (
              <p id="login-id-error" className="mt-1.5 text-[11px] font-semibold text-rose-300">
                {fieldError.id}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldError.password)}
                aria-describedby={fieldError.password ? 'login-password-error' : undefined}
                required
                className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-10 font-mono text-sm font-bold text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 placeholder:font-sans placeholder:font-normal placeholder:text-slate-500"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-2 rounded-lg p-2 text-slate-500 transition-colors hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldError.password && (
              <p id="login-password-error" className="mt-1.5 text-[11px] font-semibold text-rose-300">
                {fieldError.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 text-sm font-extrabold text-slate-950 transition hover:brightness-105 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-[11px] leading-relaxed text-slate-400">
          Demo accounts — Student <code className="font-mono text-slate-200">001 / vendhan</code>,
          Coach <code className="font-mono text-slate-200">coach / coach123</code>, Admin{' '}
          <code className="font-mono text-slate-200">admin / admin123</code>.
        </p>
      </div>
    </div>
  );
};

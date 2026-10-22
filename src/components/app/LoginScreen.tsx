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

interface RoleOption {
  role: UserRole;
  label: string;
  blurb: string;
  Icon: React.FC<{ className?: string }>;
  active: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'STUDENT',
    label: 'Student',
    blurb: 'My sports, attendance & profile',
    Icon: GraduationCap,
    active: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  },
  {
    role: 'COACH',
    label: 'Coach',
    blurb: 'Batches & attendance marking',
    Icon: Megaphone,
    active: 'border-sky-500 bg-sky-50 text-sky-700',
  },
  {
    role: 'ADMIN',
    label: 'Admin',
    blurb: 'Full academy management',
    Icon: ShieldCheck,
    active: 'border-indigo-500 bg-indigo-50 text-indigo-700',
  },
];

export const LoginScreen: React.FC = () => {
  const { signIn, currentUser, isReady } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedRole = ROLE_OPTIONS.find((option) => option.role === searchParams.get('role'));
  const [role, setRole] = useState<UserRole>(requestedRole?.role ?? 'STUDENT');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
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
    setLoginId('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300">
            <ShieldCheck className="h-6 w-6 text-slate-950" />
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
        <div className="grid grid-cols-3 gap-2">
          {ROLE_OPTIONS.map((option) => {
            const selected = option.role === role;
            return (
              <button
                key={option.role}
                onClick={() => selectRole(option)}
                className={`flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-center transition-all ${
                  selected
                    ? option.active
                    : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <option.Icon className="h-5 w-5" />
                <span className="text-xs font-extrabold">{option.label}</span>
                <span className="text-[10px] leading-tight opacity-80">{option.blurb}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-200">
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
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 font-mono text-sm font-bold text-white outline-none transition focus:border-amber-400"
                placeholder="e.g. 001"
              />
            </div>
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
                required
                className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-10 font-mono text-sm font-bold text-white outline-none transition focus:border-amber-400"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-2.5 rounded-lg p-2 text-slate-500 transition-colors hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
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

      </div>
    </div>
  );
};

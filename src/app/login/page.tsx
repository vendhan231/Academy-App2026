import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginScreen } from '@/components/app/LoginScreen';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to the Vendhan Sports Academy student, coach or admin area.',
};

function LoginFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-amber-400" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginScreen />
    </Suspense>
  );
}

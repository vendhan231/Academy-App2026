import { NextRequest, NextResponse } from 'next/server';
import {
  ROLE_HOME,
  SESSION_COOKIE,
  verifySessionToken,
} from '@/lib/session';
import { UserRole } from '@/types';

/**
 * Route level protection.
 *
 * Each role owns one route prefix. Opening a screen that belongs to another
 * role redirects back to the operator's own home instead of rendering it, and
 * an expired session is bounced to the login screen.
 */

const PROTECTED_PREFIXES: Array<{ prefix: string; role: UserRole }> = [
  { prefix: '/admin', role: 'ADMIN' },
  { prefix: '/coach', role: 'COACH' },
  { prefix: '/student', role: 'STUDENT' },
];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const rule = PROTECTED_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // The public marketing site, the login screen and the API surface are open.
  if (!rule) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname + search);
    loginUrl.searchParams.set('reason', 'required');
    return NextResponse.redirect(loginUrl);
  }

  if (session.role !== rule.role) {
    // Wrong role for this area: send them back to their own home.
    return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? '/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/coach/:path*', '/student/:path*'],
};

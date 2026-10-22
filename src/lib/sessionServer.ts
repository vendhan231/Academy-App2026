import { cookies, headers } from 'next/headers';
import { SESSION_COOKIE, SESSION_TTL_MS } from './session';

/**
 * Server-only helpers for the session cookie. The cookie is httpOnly so that
 * client scripts cannot read or forge it — the signed token is the only
 * credential accepted by middleware and by the API routes.
 */

/**
 * The `Secure` attribute is only honoured by browsers over HTTPS. Marking the
 * cookie as secure on a plain HTTP origin (a forwarded Codespaces port, a
 * LAN address, `next start` without TLS) makes the browser silently drop it,
 * which sends the user back to the login screen in a loop. The decision is
 * therefore based on the protocol the request actually arrived on, and can be
 * pinned with `SESSION_COOKIE_SECURE=true|false`.
 */
async function shouldUseSecureCookie(): Promise<boolean> {
  const override = process.env.SESSION_COOKIE_SECURE?.trim().toLowerCase();
  if (override === 'true') return true;
  if (override === 'false') return false;

  try {
    const headerList = await headers();
    const forwardedProto = headerList.get('x-forwarded-proto');
    if (forwardedProto) return forwardedProto.split(',')[0].trim() === 'https';

    const host = headerList.get('host') ?? '';
    if (host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('[::1]')) {
      return false;
    }

    // Behind a reverse proxy the origin server cannot know the protocol.
    // Defaulting to secure is the safe choice for real deployments.
    return process.env.NODE_ENV === 'production';
  } catch {
    return process.env.NODE_ENV === 'production';
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  const secure = await shouldUseSecureCookie();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    secure,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

import { UserRole } from '../types';

/**
 * Token based session handling.
 *
 * The server signs a session token with an HMAC secret and returns it to the
 * client, which stores it and sends it as a bearer token on API calls. The
 * same token is mirrored into an httpOnly cookie so that route protection can
 * be enforced in middleware, before a screen ever renders.
 *
 * This module is deliberately free of any Node-only or Next-only imports so it
 * can run in the browser, in route handlers and in the edge middleware.
 */

export const SESSION_COOKIE = 'vsa_session';
export const SESSION_TOKEN_KEY = 'vsa_session_token';
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

declare global {
  // eslint-disable-next-line no-var
  var __vendhanSessionSecret: string | undefined;
}

export interface SessionPayload {
  /** Opaque session id. */
  token: string;
  role: UserRole;
  userId: string;
  name: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * The signing secret.
 *
 * `SESSION_SECRET` is read from the environment so the value never ships in
 * the bundle. When it is missing a random per-process secret is generated
 * instead of falling back to a hard coded one: a fixed fallback would let
 * anybody who has read the source forge a session.
 */
function secret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be configured in production.');
  }

  if (!globalThis.__vendhanSessionSecret) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    globalThis.__vendhanSessionSecret = Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  return globalThis.__vendhanSessionSecret;
}

/* ------------------------------------------------------------------ */
/* Base64url helpers (edge safe, no Buffer)                            */
/* ------------------------------------------------------------------ */

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodePayload(payload: SessionPayload): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

function decodePayload(encoded: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as SessionPayload;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

/* ------------------------------------------------------------------ */
/* Token lifecycle                                                     */
/* ------------------------------------------------------------------ */

export function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function createSessionToken(
  user: { id: string; role: UserRole; name: string }
): Promise<{ token: string; payload: SessionPayload }> {
  const now = Date.now();
  const payload: SessionPayload = {
    token: randomToken(),
    role: user.role,
    userId: user.id,
    name: user.name,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  const encoded = encodePayload(payload);
  const signature = toBase64Url(await hmac(encoded));
  return { token: `${encoded}.${signature}`, payload };
}

/** Verifies the signature and the expiry. Returns null for anything invalid. */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, signature] = parts;
    if (!encoded || !signature) return null;

    const expected = toBase64Url(await hmac(encoded));
    if (expected.length !== signature.length) return null;

    // Constant-time-ish comparison.
    let mismatch = 0;
    for (let i = 0; i < expected.length; i += 1) {
      mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    const payload = decodePayload(encoded);
    if (!payload) return null;
    if (!payload.role || !payload.userId) return null;
    if (payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    // A malformed or corrupted token is simply not a session.
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Role helpers                                                        */
/* ------------------------------------------------------------------ */

export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: '/admin',
  COACH: '/coach',
  STUDENT: '/student',
};

/** Home route for a role, with a safe fallback for unknown roles. */
export function roleHome(role: UserRole | undefined): string {
  if (!role) return '/login';
  return ROLE_HOME[role] ?? '/login';
}

/** Route prefixes that each role is allowed to open. */
export const ROLE_ROUTE_PREFIX: Record<UserRole, string> = {
  ADMIN: '/admin',
  COACH: '/coach',
  STUDENT: '/student',
};

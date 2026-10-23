import { SESSION_TOKEN_KEY } from './session';

/**
 * Thin client for the protected API.
 *
 * The signed session token is kept in localStorage so it survives a reload;
 * it is sent as a bearer token on every request. The httpOnly cookie stays
 * the source of truth for route protection.
 */

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  message: string;
}

function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_TOKEN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as string;
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
}

export function authHeaders(): Record<string, string> {
  const token = readToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
    const res = await fetch(path, {
      ...init,
      cache: 'no-store',
      headers: {
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(),
        ...(init.headers ?? {}),
      },
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok || !payload?.success) {
      return {
        ok: false,
        status: res.status,
        data: null,
        message: payload?.message ?? `Request failed (${res.status}).`,
      };
    }

    return { ok: true, status: res.status, data: payload as T, message: payload.message ?? '' };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      message: 'Could not reach the server. Check your connection and try again.',
    };
  }
}

export const apiGet = <T>(path: string) => apiRequest<T>(path);

export const apiPost = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const apiPut = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) });

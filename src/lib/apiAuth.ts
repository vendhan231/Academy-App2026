import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, SessionPayload, verifySessionToken } from './session';
import { UserRole } from '@/types';
import { ensureStoreReady, getStore, getUsers } from '@/server/store';

/** Error type that carries an HTTP status for the API envelope. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Resolves the caller from the bearer token, falling back to the httpOnly
 * session cookie. Returns null when the session is missing, tampered with or
 * expired.
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<SessionPayload | null> {
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const cookieToken = req.cookies.get(SESSION_COOKIE)?.value;
  return verifySessionToken(bearer || cookieToken);
}

/**
 * Guards an API endpoint by role. Throws ApiError(401) when the session is
 * invalid and ApiError(403) when the role is not allowed. Every endpoint that
 * touches academy data must call this.
 */
export async function requireRole(
  req: NextRequest,
  roles: UserRole[]
): Promise<SessionPayload> {
  const session = await authenticateRequest(req);

  if (!session) {
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }

  if (!roles.includes(session.role)) {
    throw new ApiError(403, 'You are not allowed to perform this action.');
  }

  await ensureStoreReady();
  const user = getUsers().find((candidate) => candidate.id === session.userId);
  if (!user || user.role !== session.role) {
    throw new ApiError(401, 'Your account is no longer active. Please sign in again.');
  }
  if (session.role === 'STUDENT' && user.studentId && !getStore().students.some((item) => item.id === user.studentId)) {
    throw new ApiError(401, 'This student account is inactive.');
  }
  return session;
}

/** Wraps a handler and turns thrown ApiErrors into a consistent JSON envelope. */
export async function withApiErrorHandling(
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

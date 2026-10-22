import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, SESSION_TTL_MS } from '@/lib/session';
import { setSessionCookie } from '@/lib/sessionServer';
import { ApiError, withApiErrorHandling } from '@/lib/apiAuth';
import { User, UserRole } from '@/types';
import { ensureStoreReady, getStore, getUsers, hashPassword, persistUsers, verifyPassword } from '@/server/store';

/**
 * Credential exchange.
 *
 * A successful sign-in mints a signed session token, mirrors it into an
 * httpOnly cookie (so middleware can protect routes) and returns the bearer
 * token to the client (so the API can authorise requests).
 */
export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, 'A JSON body is required.');

    const identifier = String(body.id ?? body.username ?? body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '').trim();
    const requestedRole = body.role as UserRole | undefined;

    if (!identifier || !password) {
      throw new ApiError(400, 'Both an ID and a password are required.');
    }

    await ensureStoreReady();
    const user = getUsers().find((candidate) => {
      const matches =
        candidate.username?.toLowerCase() === identifier ||
        candidate.email?.toLowerCase() === identifier ||
        candidate.id.toLowerCase() === identifier ||
        candidate.studentId?.toLowerCase() === identifier;
      return matches && verifyPassword(password, candidate.password);
    });

    if (!user) {
      throw new ApiError(401, 'Invalid credentials. Check your ID and password.');
    }
    if (user.role === 'STUDENT' && user.studentId && !getStore().students.some((student) => student.id === user.studentId)) {
      throw new ApiError(403, 'This student account is inactive. Contact the academy administrator.');
    }
    if (user.password && !user.password.startsWith('scrypt$')) {
      user.password = hashPassword(password);
      await persistUsers();
    }

    if (requestedRole && user.role !== requestedRole) {
      throw new ApiError(403, `These credentials belong to the ${user.role.toLowerCase()} area.`);
    }

    const { token, payload } = await createSessionToken(user);
    await setSessionCookie(token);

    const safeUser: User = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      avatar: user.avatar,
      username: user.username,
      studentId: user.studentId,
      coachId: user.coachId,
      mfaEnabled: user.mfaEnabled,
    };

    return NextResponse.json({
      success: true,
      user: safeUser,
      token,
      expiresAt: payload.expiresAt,
      maxAgeMs: SESSION_TTL_MS,
    });
  });
}

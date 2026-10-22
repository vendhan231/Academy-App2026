import { NextRequest, NextResponse } from 'next/server';
import { requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { ApiError } from '@/lib/apiAuth';
import { SportId, isSportId } from '@/lib/sports';
import { coachForSession, createCoach, getStore, persistStore, persistUsers } from '@/server/store';

/**
 * The coach directory. Admins see every coach; a coach sees their own record
 * so the profile screen can be served from the same endpoint.
 */
export async function GET(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const store = getStore();

    const coaches =
      session.role === 'ADMIN'
        ? store.coaches
        : [coachForSession(session)].filter((coach) => coach !== null);

    return NextResponse.json({ success: true, coaches, count: coaches.length });
  });
}

export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    await requireRole(req, ['ADMIN']);
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, 'A JSON body is required.');

    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phone = String(body.phone ?? '').trim();
    const certification = String(body.certification ?? '').trim();
    if (!name || name.length > 100 || !certification || certification.length > 200) {
      throw new ApiError(400, 'Enter a valid coach name and certification.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, 'Enter a valid coach email address.');
    }
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      throw new ApiError(400, 'Coach phone must use international E.164 format.');
    }
    const rawSports = Array.isArray(body.sportIds) ? body.sportIds : [];
    const sportIds = rawSports.filter((value: unknown): value is SportId => isSportId(value));
    if (sportIds.length === 0 || sportIds.length !== rawSports.length) {
      throw new ApiError(400, 'Select at least one valid sport assignment.');
    }
    if (getStore().coaches.some((coach) => coach.email.toLowerCase() === email)) {
      throw new ApiError(409, 'A coach account with this email already exists.');
    }

    const created = createCoach({ name, email, phone, certification, sportIds });
    await persistStore();
    await persistUsers();
    return NextResponse.json({ success: true, ...created }, { status: 201 });
  });
}

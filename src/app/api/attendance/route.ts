import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { SportId } from '@/lib/sports';
import {
  coachOwnsSport,
  getStore,
  persistStore,
  upsertAttendance,
  visibleAttendance,
} from '@/server/store';
import {
  isIsoDate,
  isSportIdValue,
  parseAttendanceEntries,
} from '@/server/validation';

/**
 * Attendance sheets.
 *
 * GET returns the attendance the caller is allowed to see: a student only
 * ever sees their own rows, a coach sees the rows for the sports they are
 * assigned to, and an admin sees everything.
 *
 * POST writes a sheet. Only coaches and admins may write, and a coach may
 * only write for a sport they own.
 */

export async function GET(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH', 'STUDENT']);

    const { searchParams } = req.nextUrl;
    const date = searchParams.get('date');
    const sportId = searchParams.get('sportId');

    if (date !== null && !isIsoDate(date)) {
      throw new ApiError(400, 'The date filter must use the YYYY-MM-DD format.');
    }
    if (sportId !== null && !isSportIdValue(sportId)) {
      throw new ApiError(400, 'Unknown sport.');
    }

    let records = visibleAttendance(session);

    if (date) records = records.filter((record) => record.date === date);
    if (sportId) records = records.filter((record) => record.sportId === sportId);

    records = records
      .slice()
      .sort((a, b) => (a.date === b.date ? a.sportId.localeCompare(b.sportId) : b.date.localeCompare(a.date)));

    return NextResponse.json({ success: true, records, count: records.length });
  });
}

export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['COACH', 'ADMIN']);

    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, 'A JSON body is required.');

    const date = body.date;
    if (!isIsoDate(date)) {
      throw new ApiError(400, 'A valid attendance date (YYYY-MM-DD) is required.');
    }

    const sportId = body.sportId;
    if (!isSportIdValue(sportId)) {
      throw new ApiError(400, 'A valid sport is required.');
    }

    if (!coachOwnsSport(session, sportId)) {
      throw new ApiError(403, 'You can only mark attendance for your assigned sports.');
    }

    const entries = parseAttendanceEntries(body.entries);
    if (!entries) {
      throw new ApiError(400, 'Provide at least one student entry with a valid status.');
    }

    const store = getStore();
    const enrolled = new Set(
      store.enrollments
        .filter((enrollment) => enrollment.sportId === sportId && enrollment.active)
        .map((enrollment) => enrollment.studentId)
    );

    const invalid = entries.find((entry) => !enrolled.has(entry.studentId));
    if (invalid) {
      throw new ApiError(400, 'One of the students is not enrolled for this sport.');
    }

    const records = upsertAttendance(date, sportId as SportId, entries, session.userId);
    await persistStore();

    return NextResponse.json({
      success: true,
      message: `Saved ${entries.length} record${entries.length === 1 ? '' : 's'} for ${date}.`,
      records,
    });
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { SportId } from '@/lib/sports';
import { canViewStudent, visibleAttendance } from '@/server/store';
import { StudentAttendanceSummary } from '@/types';

/**
 * Attendance summary for a single student.
 *
 * A student may only request their own summary. A coach may request a
 * summary for a student in one of their sports. An admin may request any.
 */
export async function GET(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH', 'STUDENT']);

    const { searchParams } = req.nextUrl;
    const studentId = searchParams.get('studentId')?.trim();
    const month = searchParams.get('month')?.trim();

    if (!studentId) {
      throw new ApiError(400, 'A studentId is required.');
    }

    if (!canViewStudent(session, studentId)) {
      throw new ApiError(403, 'You are not allowed to view this student’s attendance.');
    }

    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      throw new ApiError(400, 'The month filter must use the YYYY-MM format.');
    }

    const scoped = visibleAttendance(session).filter((record) => {
      if (record.studentId !== studentId) return false;
      if (!month) return true;
      return record.date.startsWith(month);
    });

    const present = scoped.filter((record) => record.status === 'present').length;
    const absent = scoped.filter((record) => record.status === 'absent').length;
    const total = present + absent;

    const summary: StudentAttendanceSummary = {
      studentId,
      present,
      absent,
      total,
      percentage: total === 0 ? 0 : Math.round((present / total) * 100),
      byDate: scoped
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((record) => ({
          date: record.date,
          sportId: record.sportId as SportId,
          status: record.status,
        })),
    };

    return NextResponse.json({ success: true, summary });
  });
}

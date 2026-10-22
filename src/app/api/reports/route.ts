import { NextRequest, NextResponse } from 'next/server';
import { requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { SPORTS } from '@/lib/sports';
import { getStore } from '@/server/store';

/**
 * Academy reports. Admin only — these aggregates expose the whole academy.
 */
export async function GET(req: NextRequest) {
  return withApiErrorHandling(async () => {
    await requireRole(req, ['ADMIN']);

    const store = getStore();

    const bySport = SPORTS.map((sport) => {
      const records = store.attendance.filter((record) => record.sportId === sport.id);
      const present = records.filter((record) => record.status === 'present').length;
      const total = records.length;

      return {
        sportId: sport.id,
        sportName: sport.name,
        total,
        present,
        absent: total - present,
        percentage: total === 0 ? 0 : Math.round((present / total) * 100),
        students: new Set(records.map((record) => record.studentId)).size,
      };
    });

    const byStudent = store.students.map((student) => {
      const records = store.attendance.filter((record) => record.studentId === student.id);
      const present = records.filter((record) => record.status === 'present').length;
      const total = records.length;

      return {
        studentId: student.id,
        studentCode: student.studentCode,
        name: `${student.firstName} ${student.lastName}`,
        total,
        present,
        absent: total - present,
        percentage: total === 0 ? 0 : Math.round((present / total) * 100),
      };
    });

    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = store.attendance.filter((record) => record.date === today);

    const dates = Array.from(new Set(store.attendance.map((record) => record.date))).sort();

    return NextResponse.json({
      success: true,
      reports: {
        totals: {
          students: store.students.length,
          coaches: store.coaches.length,
          enrollments: store.enrollments.filter((enrollment) => enrollment.active).length,
          sessions: dates.length,
          records: store.attendance.length,
          presentToday: todayRecords.filter((record) => record.status === 'present').length,
          absentToday: todayRecords.filter((record) => record.status === 'absent').length,
        },
        bySport,
        byStudent,
      },
    });
  });
}

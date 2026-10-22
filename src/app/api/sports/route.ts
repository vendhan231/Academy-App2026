import { NextRequest, NextResponse } from 'next/server';
import { requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { SPORTS } from '@/lib/sports';
import { assignedSportIds, coachForSession, enrolledSportIds, studentForSession } from '@/server/store';

/**
 * The sport catalogue.
 *
 * Every signed in role can read the eight sports the academy offers. The
 * response also flags which of them the caller is actually involved with, so
 * a client never has to recompute the scope.
 */
export async function GET(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH', 'STUDENT']);

    let mySportIds: string[] = SPORTS.map((sport) => sport.id);

    if (session.role === 'COACH') {
      const coach = coachForSession(session);
      mySportIds = coach ? assignedSportIds(coach.id) : [];
    } else if (session.role === 'STUDENT') {
      const student = studentForSession(session);
      mySportIds = student ? enrolledSportIds(student.id) : [];
    }

    return NextResponse.json({
      success: true,
      sports: SPORTS,
      mySportIds,
      count: SPORTS.length,
    });
  });
}

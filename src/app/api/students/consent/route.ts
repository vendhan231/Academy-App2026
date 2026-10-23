import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { appendAcademyAudit } from '@/server/academyContent';
import { getStore, persistStore, visibleStudents } from '@/server/store';

export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const body = await req.json().catch(() => null);
    if (!body || typeof body.studentId !== 'string' || typeof body.optedIn !== 'boolean') {
      throw new ApiError(400, 'Student and consent choice are required.');
    }
    if (body.optedIn && body.parentConfirmed !== true) {
      throw new ApiError(400, 'Confirm that the parent or guardian explicitly opted in.');
    }
    const student = getStore().students.find((item) => item.id === body.studentId);
    if (!student || !visibleStudents(session).some((item) => item.id === student.id)) {
      throw new ApiError(404, 'Student is not available in your role scope.');
    }
    student.parentMessagingConsentAt = body.optedIn ? new Date().toISOString() : undefined;
    await persistStore();
    await appendAcademyAudit(session, 'updated', 'consent', student.id, `Guardian messaging consent ${body.optedIn ? 'enabled' : 'revoked'}`);
    return NextResponse.json({ success: true, optedIn: body.optedIn, consentAt: student.parentMessagingConsentAt });
  });
}

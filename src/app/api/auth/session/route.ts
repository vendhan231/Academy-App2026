import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { ensureStoreReady, getStore, getUsers } from '@/server/store';

/**
 * Returns the signed-in session. The client calls this on boot to validate
 * the stored token; a 401 tells the shell that the session expired and the
 * user must sign in again.
 */
export async function GET(req: NextRequest) {
  await ensureStoreReady();
  const session = await authenticateRequest(req);

  if (!session) {
    return NextResponse.json(
      { success: false, message: 'No active session.' },
      { status: 401 }
    );
  }

  const user = getUsers().find((u) => u.id === session.userId);
  if (
    !user ||
    user.role !== session.role ||
    (user.role === 'STUDENT' && user.studentId && !getStore().students.some((student) => student.id === user.studentId))
  ) {
    return NextResponse.json(
      { success: false, message: 'Session user no longer exists.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    session,
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      avatar: user.avatar,
      username: user.username,
      studentId: user.studentId,
      coachId: user.coachId,
    },
  });
}

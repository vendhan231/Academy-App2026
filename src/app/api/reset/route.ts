import { NextRequest, NextResponse } from 'next/server';
import { requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { persistStore, persistUsers, resetStore, resetUsers } from '@/server/store';

/**
 * Resets the academy back to its seeded demo state. Admin only.
 */
export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    await requireRole(req, ['ADMIN']);
    resetStore();
    resetUsers();
    await persistStore();
    await persistUsers();
    return NextResponse.json({ success: true, message: 'Academy data reset to the seeded state.' });
  });
}

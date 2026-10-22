import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/sessionServer';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}

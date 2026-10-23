import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { updateNotificationFromProvider } from '@/server/notificationService';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const verifyToken = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');
  if (mode !== 'subscribe' || !verifyToken || verifyToken !== process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || !challenge) {
    return NextResponse.json({ success: false }, { status: 403 });
  }
  return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
}

export async function POST(req: NextRequest) {
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
  if (!appSecret) return NextResponse.json({ success: false, message: 'WhatsApp webhook is not configured.' }, { status: 503 });
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256') ?? '';
  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  let body: any = {};
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: true }, { status: 200 });
  }
  const statuses = body.entry?.flatMap((entry: any) => entry.changes?.flatMap((change: any) => change.value?.statuses ?? []) ?? []) ?? [];
  for (const item of statuses) {
    if (!item.id || !item.status) continue;
    const normalizedStatus = item.status === 'read' ? 'read' : item.status === 'delivered' ? 'delivered' : item.status === 'sent' ? 'sent' : item.status === 'failed' ? 'failed' : null;
    if (!normalizedStatus) continue;
    if (normalizedStatus === 'failed') {
      const code = item.errors?.[0]?.code;
      const message = item.errors?.[0]?.title || item.errors?.[0]?.message || 'Provider reported delivery failure.';
      await updateNotificationFromProvider(item.id, 'failed', message, code);
    } else {
      await updateNotificationFromProvider(item.id, normalizedStatus);
    }
  }
  return NextResponse.json({ success: true }, { status: 200 });
}

import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { updateNotificationFromProvider } from '@/server/notificationService';

export const runtime = 'nodejs';

function normalizeStatus(value?: string): 'sent' | 'delivered' | 'read' | 'failed' | null {
  if (!value) return null;
  if (value === 'sent') return 'sent';
  if (value === 'delivered') return 'delivered';
  if (value === 'read') return 'read';
  if (value === 'failed') return 'failed';
  return null;
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const verifyToken = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');

  if (mode !== 'subscribe' || !verifyToken || verifyToken !== process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || !challenge) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  return new Response(challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
  if (appSecret) {
    const signature = req.headers.get('x-hub-signature-256') ?? '';
    const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(signature);
    if (signature && (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer))) {
      return NextResponse.json({ success: false }, { status: 200 });
    }
  }

  let payload: any = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const statuses = payload.entry?.flatMap((entry: any) => entry.changes?.flatMap((change: any) => change.value?.statuses ?? []) ?? []) ?? [];

  for (const item of statuses) {
    if (!item.id) continue;
    const mappedStatus = normalizeStatus(item.status);
    if (!mappedStatus) continue;

    if (mappedStatus === 'failed') {
      const code = item.errors?.[0]?.code ?? null;
      const message = item.errors?.[0]?.title || item.errors?.[0]?.message || 'Provider reported a WhatsApp delivery failure.';
      await updateNotificationFromProvider(item.id, 'failed', message, code);
      continue;
    }

    await updateNotificationFromProvider(item.id, mappedStatus);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

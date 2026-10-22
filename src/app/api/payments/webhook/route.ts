import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ensureStoreReady, getStore, persistStore } from '@/server/store';
import { mongoState } from '@/lib/mongo';

export const runtime = 'nodejs';

function validStripeSignature(payload: string, signatureHeader: string, secret: string): boolean {
  const parts = signatureHeader.split(',').map((part) => part.split('=', 2));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest();
  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const candidate = Buffer.from(signature, 'hex');
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ success: false, message: 'Payment webhook is not configured.' }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';
  if (!validStripeSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ success: false, message: 'Invalid payment signature.' }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody);
    if (event.type === 'checkout.session.completed') {
      const checkout = event.data?.object;
      const invoiceId = checkout?.metadata?.invoiceId;
      if (checkout?.payment_status === 'paid' && typeof invoiceId === 'string') {
        await ensureStoreReady();
        if (!mongoState.connected) {
          return NextResponse.json({ success: false, message: 'Persistent database is unavailable.' }, { status: 503 });
        }
        const invoice = getStore().invoices.find((item) => item.id === invoiceId);
        if (!invoice) {
          console.error('Paid Stripe Checkout session references an unknown invoice:', invoiceId);
          return NextResponse.json({ success: false, message: 'Invoice not found.' }, { status: 404 });
        }
        const expectedAmount = Math.round(invoice.amount * 100);
        if (
          checkout.amount_total !== expectedAmount ||
          checkout.currency !== 'usd'
        ) {
          console.error('Stripe Checkout amount or currency did not match the invoice:', invoiceId);
          return NextResponse.json({ success: false, message: 'Payment amount does not match invoice.' }, { status: 400 });
        }
        invoice.status = 'PAID';
        invoice.paidAt = new Date().toISOString();
        invoice.paymentMethod = 'Stripe Checkout';
        invoice.transactionId =
          typeof checkout.payment_intent === 'string' ? checkout.payment_intent : checkout.id;
        await persistStore();
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    return NextResponse.json({ success: false, message: 'Webhook processing failed.' }, { status: 500 });
  }
}

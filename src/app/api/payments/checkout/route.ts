import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { getStore, studentForSession } from '@/server/store';
import { mongoState } from '@/lib/mongo';

export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'STUDENT']);
    if (!mongoState.connected) {
      throw new ApiError(503, 'Persistent MongoDB storage is required for online payments.');
    }
    const body = await req.json().catch(() => null);
    const invoiceId = typeof body?.invoiceId === 'string' ? body.invoiceId : '';
    if (!invoiceId) throw new ApiError(400, 'An invoice ID is required.');

    const invoice = getStore().invoices.find((item) => item.id === invoiceId);
    if (!invoice) throw new ApiError(404, 'Invoice not found.');
    const linkedStudent = studentForSession(session);
    if (session.role !== 'ADMIN' && linkedStudent?.id !== invoice.studentId) {
      throw new ApiError(403, 'You cannot pay an invoice for another student.');
    }
    if (invoice.status === 'PAID') throw new ApiError(409, 'This invoice has already been paid.');

    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      throw new ApiError(503, 'Online payments are not configured. Contact the academy administrator.');
    }

    const appUrl = (process.env.APP_URL || req.nextUrl.origin).replace(/\/+$/, '');
    const form = new URLSearchParams({
      mode: 'payment',
      success_url: `${appUrl}${session.role === 'ADMIN' ? '/admin' : '/student'}?payment=success`,
      cancel_url: `${appUrl}${session.role === 'ADMIN' ? '/admin' : '/student'}?payment=cancelled`,
      client_reference_id: invoice.id,
      'metadata[invoiceId]': invoice.id,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(Math.round(invoice.amount * 100)),
      'line_items[0][price_data][product_data][name]': `Academy fees — ${invoice.period}`,
      'line_items[0][price_data][product_data][description]': invoice.invoiceNumber,
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
      cache: 'no-store',
    });
    const checkout = await response.json().catch(() => null);
    if (!response.ok || typeof checkout?.url !== 'string') {
      console.error('Stripe Checkout session creation failed:', checkout?.error?.message ?? response.status);
      throw new ApiError(502, 'The payment provider could not start checkout. Please try again later.');
    }

    return NextResponse.json({ success: true, checkoutUrl: checkout.url });
  });
}

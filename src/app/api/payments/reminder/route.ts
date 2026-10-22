import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { getStore, persistStore } from '@/server/store';
import { sendGuardianMessage } from '@/server/messaging';
import { mongoState } from '@/lib/mongo';

export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN']);
    if (!mongoState.connected) {
      throw new ApiError(503, 'Persistent MongoDB storage is required before sending a payment reminder.');
    }
    const body = await req.json().catch(() => null);
    const invoiceId = typeof body?.invoiceId === 'string' ? body.invoiceId : '';
    const store = getStore();
    const invoice = store.invoices.find((item) => item.id === invoiceId);
    if (!invoice) throw new ApiError(404, 'Invoice not found.');
    if (invoice.status === 'PAID') throw new ApiError(409, 'This invoice is already paid.');
    const student = store.students.find((item) => item.id === invoice.studentId);
    if (!student?.parentMessagingConsentAt || !/^\+[1-9]\d{7,14}$/.test(student.parentPhone)) {
      throw new ApiError(422, 'A valid guardian phone number and recorded messaging opt-in are required.');
    }

    let delivery;
    try {
      delivery = await sendGuardianMessage(
        student.parentPhone,
        `Vendhan Sports Academy fee reminder: ${invoice.invoiceNumber} for ${invoice.period} is $${invoice.amount.toFixed(2)} and due ${invoice.dueDate}.`
      );
    } catch (error) {
      console.error('Payment reminder could not be sent:', error);
      throw new ApiError(503, 'Messaging provider is unavailable; no reminder was sent.');
    }
    if (!delivery.delivered) throw new ApiError(502, 'Messaging provider did not accept the reminder.');

    const record = {
      id: `bcast-${crypto.randomUUID()}`,
      senderName: session.name,
      senderRole: 'ADMIN' as const,
      targetCriteria: { targetType: 'BATCH' as const, targetValue: student.batchShift },
      templateKey: 'CUSTOM' as const,
      templateTitle: `Fee reminder · ${invoice.invoiceNumber}`,
      messageContent: `Fee reminder sent for ${invoice.invoiceNumber}.`,
      channel: delivery.provider === 'SMS' ? 'SMS_FALLBACK' as const : 'WHATSAPP' as const,
      recipientCount: 1,
      deliveredCount: 0,
      readCount: 0,
      sentAt: new Date().toISOString(),
      deliveryStatus: 'IN_TRANSIT' as const,
    };
    store.broadcasts.unshift(record);
    await persistStore();
    return NextResponse.json({
      success: true,
      message: 'Provider accepted the reminder; delivery receipt is not connected.',
      broadcast: record,
    });
  });
}

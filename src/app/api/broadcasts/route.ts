import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { getStore, persistStore } from '@/server/store';
import { sendGuardianMessage } from '@/server/messaging';
import { SportId, isSportId } from '@/lib/sports';
import { mongoState } from '@/lib/mongo';

export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN']);
    if (!mongoState.connected) {
      throw new ApiError(503, 'Persistent MongoDB storage is required before sending a broadcast.');
    }
    const body = await req.json().catch(() => null);
    if (!body || typeof body.messageContent !== 'string') {
      throw new ApiError(400, 'A message body is required.');
    }

    const messageContent = body.messageContent.trim();
    const title = String(body.templateTitle ?? 'Academy update').trim();
    const targetType = body.targetType;
    const targetValue = typeof body.targetValue === 'string' ? body.targetValue : undefined;
    if (!messageContent || messageContent.length > 1000 || !title || title.length > 100) {
      throw new ApiError(400, 'Message title or content is invalid.');
    }
    if (!['ALL_PARENTS', 'SPORT', 'BATCH'].includes(targetType)) {
      throw new ApiError(400, 'Choose a valid recipient group.');
    }
    if (targetType === 'SPORT' && !isSportId(targetValue)) {
      throw new ApiError(400, 'Choose a valid sport.');
    }
    if (targetType === 'BATCH' && !targetValue) {
      throw new ApiError(400, 'Choose a batch before sending.');
    }

    const store = getStore();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dailyCount = store.broadcasts.filter((item) =>
      item.senderName === session.name && new Date(item.sentAt) >= startOfDay
    ).length;
    if (dailyCount >= 5) throw new ApiError(429, 'Daily broadcast limit reached for this administrator.');
    const recipients = store.students.filter((student) => {
      if (!student.parentMessagingConsentAt || !/^\+[1-9]\d{7,14}$/.test(student.parentPhone)) return false;
      if (targetType === 'BATCH') return student.batchShift === targetValue;
      if (targetType === 'SPORT') {
        return store.enrollments.some((enrollment) =>
          enrollment.studentId === student.id && enrollment.active && enrollment.sportId === targetValue
        );
      }
      return true;
    });
    if (recipients.length === 0) {
      throw new ApiError(422, 'No guardians in this group have a recorded opt-in and valid phone number.');
    }
    if (recipients.length > 200) {
      throw new ApiError(413, 'A single broadcast is limited to 200 opted-in guardians.');
    }

    let acceptedCount = 0;
    let smsCount = 0;
    const messageIds: string[] = [];
    for (const student of recipients) {
      try {
        const result = await sendGuardianMessage(student.parentPhone, messageContent);
        if (result.delivered) acceptedCount += 1;
        if (result.provider === 'SMS' && result.delivered) smsCount += 1;
        if (result.messageId) messageIds.push(result.messageId);
      } catch (error) {
        console.error(`Guardian message failed for student ${student.id}:`, error);
      }
    }
    if (acceptedCount === 0) {
      throw new ApiError(502, 'No messaging provider accepted the broadcast. No delivery was confirmed.');
    }

    const record = {
      id: `bcast-${crypto.randomUUID()}`,
      senderName: session.name,
      senderRole: 'ADMIN' as const,
      targetCriteria: { targetType, targetValue },
      templateKey: body.templateKey === 'CUSTOM' ? 'CUSTOM' as const : 'CUSTOM' as const,
      templateTitle: title,
      messageContent,
      channel: smsCount === acceptedCount && acceptedCount > 0 ? 'SMS_FALLBACK' as const : 'WHATSAPP' as const,
      recipientCount: recipients.length,
      deliveredCount: 0,
      readCount: 0,
      sentAt: new Date().toISOString(),
      deliveryStatus: 'IN_TRANSIT' as const,
    };
    store.broadcasts.unshift(record);
    await persistStore();

    return NextResponse.json({
      success: true,
      message: `Accepted by a provider for ${acceptedCount} of ${recipients.length} opted-in guardians; final delivery receipts are not connected.`,
      acceptedCount,
      providerMessageIds: messageIds,
      broadcast: record,
    });
  });
}

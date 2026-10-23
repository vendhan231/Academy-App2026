import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { loadAcademyContent } from '@/server/academyContent';
import { getStore } from '@/server/store';
import {
  listNotifications,
  queueAchievementPreview,
  queueAnnouncementPreview,
  queueEventPreview,
  queueScheduleEmergency,
  resendFailedNotification,
  sendWhatsAppTest,
} from '@/server/notificationService';

export async function GET(req: NextRequest) {
  return withApiErrorHandling(async () => {
    await requireRole(req, ['ADMIN', 'COACH']);
    return NextResponse.json({ success: true, notifications: await listNotifications() });
  });
}

export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const body = await req.json().catch(() => null);
    if (!body || typeof body.action !== 'string') throw new ApiError(400, 'A notification action is required.');

    if (body.action === 'test') {
      if (typeof body.phone !== 'string') throw new ApiError(400, 'A test phone number is required.');
      if (typeof body.message !== 'undefined' && body.message !== null && typeof body.message !== 'string') throw new ApiError(400, 'The message must be a text string.');
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (message.length > 1000) throw new ApiError(400, 'The test message must be 1000 characters or less.');
      try {
        const notification = await sendWhatsAppTest(body.phone, session.name, message || undefined);
        return NextResponse.json({ success: true, notification, message: 'Test message queued.' }, { status: 202 });
      } catch (error) {
        throw new ApiError(400, error instanceof Error ? error.message : 'Could not queue the test message.');
      }
    }

    if (body.action === 'resend') {
      if (typeof body.id !== 'string') throw new ApiError(400, 'A notification ID is required.');
      const resent = await resendFailedNotification(body.id, session.name);
      if (!resent) throw new ApiError(404, 'Failed notification not found.');
      return NextResponse.json({ success: true, message: 'Notification queued for retry.' });
    }

    if (body.action === 'emergency_schedule') {
      if (typeof body.id !== 'string' || typeof body.reason !== 'string' || !body.reason.trim()) throw new ApiError(400, 'Schedule ID and emergency reason are required.');
      const { schedule } = await loadAcademyContent();
      const slot = schedule.find((item) => item.id === body.id);
      if (!slot) throw new ApiError(404, 'Schedule item not found.');
      const result = await queueScheduleEmergency(session, slot, body.reason.trim().slice(0, 160), typeof body.newTiming === 'string' ? body.newTiming.trim().slice(0, 120) : 'will be informed');
      return NextResponse.json({ success: true, result });
    }

    if (body.action === 'preview') {
      if (body.resource === 'event' && typeof body.id === 'string') {
        const { events } = await loadAcademyContent();
        const event = events.find((item) => item.id === body.id) ?? body.event;
        if (!event) throw new ApiError(404, 'Event not found.');
        if (typeof event.title !== 'string' || typeof event.date !== 'string' || typeof event.time !== 'string' || typeof event.venue !== 'string' || typeof event.description !== 'string') throw new ApiError(400, 'Event notification data is invalid.');
        const eventAction = body.eventAction === 'updated' || body.eventAction === 'cancelled' ? body.eventAction : 'created';
        return NextResponse.json({ success: true, result: await queueEventPreview(session, event, eventAction) });
      }
      if (body.resource === 'announcement' && typeof body.id === 'string') {
        const announcement = getStore().announcements.find((item) => item.id === body.id);
        if (!announcement) throw new ApiError(404, 'Announcement not found.');
        return NextResponse.json({ success: true, result: await queueAnnouncementPreview(session, announcement) });
      }
      if (body.resource === 'achievement' && typeof body.id === 'string') {
        const student = getStore().students.find((item) => item.achievements.some((achievement) => achievement.id === body.id));
        const achievement = student?.achievements.find((item) => item.id === body.id);
        if (!student || !achievement) throw new ApiError(404, 'Achievement not found.');
        return NextResponse.json({ success: true, result: await queueAchievementPreview(session, achievement, student) });
      }
      throw new ApiError(400, 'Choose a supported notification resource.');
    }

    throw new ApiError(400, 'Unsupported notification action.');
  });
}

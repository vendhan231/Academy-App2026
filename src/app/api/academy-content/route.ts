import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { loadAcademyContent, mutateAcademyContent } from '@/server/academyContent';
import { queueScheduleEmergency } from '@/server/notificationService';

export async function GET(req: NextRequest) {
  return withApiErrorHandling(async () => {
    await requireRole(req, ['ADMIN', 'COACH', 'STUDENT']);
    const content = await loadAcademyContent();
    return NextResponse.json({ success: true, schedule: content.schedule, events: content.events });
  });
}

export async function POST(req: NextRequest) {
  return writeContent(req, 'create');
}

export async function PUT(req: NextRequest) {
  return writeContent(req, 'update');
}

export async function DELETE(req: NextRequest) {
  return writeContent(req, 'delete');
}

async function writeContent(req: NextRequest, action: 'create' | 'update' | 'delete') {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const body = await req.json().catch(() => null);
    if (!body || (body.resource !== 'schedule' && body.resource !== 'event')) {
      throw new ApiError(400, 'A schedule or event resource is required.');
    }
    if (action !== 'create' && (typeof body.id !== 'string' || !body.id.trim())) {
      throw new ApiError(400, 'An item ID is required.');
    }
    if (body.resource === 'schedule' && action !== 'create' && body.emergency === true && (typeof body.reason !== 'string' || !body.reason.trim())) {
      throw new ApiError(400, 'An emergency reason is required.');
    }
    const previousSchedule = body.resource === 'schedule' && typeof body.id === 'string'
      ? (await loadAcademyContent()).schedule.find((slot) => slot.id === body.id)
      : undefined;
    const previousEvent = body.resource === 'event' && typeof body.id === 'string'
      ? (await loadAcademyContent()).events.find((event) => event.id === body.id)
      : undefined;
    const content = await mutateAcademyContent(session, {
      action,
      resource: body.resource,
      id: body.id,
      item: body.item,
    });
    let emergencyNotification;
    if (body.resource === 'schedule' && action !== 'create' && body.emergency === true) {
      const previous = previousSchedule ?? content.schedule.find((slot) => slot.id === body.id);
      if (!previous) throw new ApiError(404, 'Schedule item not found for the urgent notification.');
      const newTiming = action === 'delete'
        ? 'will be informed'
        : typeof body.newTiming === 'string' && body.newTiming.trim()
          ? body.newTiming.trim()
          : 'will be informed';
      emergencyNotification = await queueScheduleEmergency(session, previous, body.reason.trim().slice(0, 160), newTiming);
    }
    return NextResponse.json({ success: true, message: `The ${body.resource} was ${action === 'delete' ? 'deleted' : action === 'create' ? 'created' : 'updated'}.`, schedule: content.schedule, events: content.events, deletedEvent: action === 'delete' ? previousEvent : undefined, emergencyNotification });
  });
}

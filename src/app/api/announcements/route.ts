import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Announcement } from '@/types';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { appendAcademyAudit } from '@/server/academyContent';
import { getStore, persistStore } from '@/server/store';
import { isSportIdValue } from '@/server/validation';

function text(value: unknown, field: string, max = 180) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new ApiError(400, `${field} is required and must be at most ${max} characters.`);
  }
  return value.trim();
}

function validateAudience(value: unknown): Announcement['audience'] {
  if (value !== 'ALL' && value !== 'COACH' && value !== 'STUDENT') throw new ApiError(400, 'Choose a valid audience.');
  return value;
}

export async function GET(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH', 'STUDENT']);
    const announcements = getStore().announcements
      .filter((item) => session.role !== 'STUDENT' || item.audience === 'ALL' || item.audience === session.role)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ success: true, announcements });
  });
}

export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, 'A JSON body is required.');
    const now = new Date().toISOString();
    const announcement: Announcement = {
      id: randomUUID(),
      title: text(body.title, 'Title'),
      body: text(body.body, 'Announcement', 3000),
      audience: validateAudience(body.audience ?? 'ALL'),
      sportId: body.sportId,
      createdAt: now,
      createdBy: session.name,
      updatedBy: session.name,
      updatedAt: now,
      authorName: session.name,
      pinned: Boolean(body.pinned),
    };
    if (announcement.sportId !== undefined && !isSportIdValue(announcement.sportId)) throw new ApiError(400, 'Choose a valid sport.');
    const store = getStore();
    store.announcements.unshift(announcement);
    await persistStore();
    await appendAcademyAudit(session, 'created', 'announcement', announcement.id, announcement.title);
    return NextResponse.json({ success: true, announcement }, { status: 201 });
  });
}

export async function PUT(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const body = await req.json().catch(() => null);
    if (!body || typeof body.id !== 'string') throw new ApiError(400, 'An announcement ID is required.');
    const store = getStore();
    const index = store.announcements.findIndex((item) => item.id === body.id);
    if (index < 0) throw new ApiError(404, 'Announcement not found.');
    const current = store.announcements[index];
    const updated: Announcement = {
      ...current,
      title: text(body.title, 'Title'),
      body: text(body.body, 'Announcement', 3000),
      audience: validateAudience(body.audience),
      sportId: body.sportId,
      pinned: Boolean(body.pinned),
      updatedBy: session.name,
      updatedAt: new Date().toISOString(),
    };
    if (updated.sportId !== undefined && !isSportIdValue(updated.sportId)) throw new ApiError(400, 'Choose a valid sport.');
    store.announcements[index] = updated;
    await persistStore();
    await appendAcademyAudit(session, 'updated', 'announcement', updated.id, updated.title);
    return NextResponse.json({ success: true, announcement: updated });
  });
}

export async function DELETE(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const body = await req.json().catch(() => null);
    if (!body || typeof body.id !== 'string') throw new ApiError(400, 'An announcement ID is required.');
    const store = getStore();
    const index = store.announcements.findIndex((item) => item.id === body.id);
    if (index < 0) throw new ApiError(404, 'Announcement not found.');
    const [deleted] = store.announcements.splice(index, 1);
    await persistStore();
    await appendAcademyAudit(session, 'deleted', 'announcement', deleted.id, deleted.title);
    return NextResponse.json({ success: true, id: deleted.id });
  });
}

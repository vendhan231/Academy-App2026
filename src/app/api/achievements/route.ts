import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Achievement } from '@/types';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { isIsoDate, isSportIdValue } from '@/server/validation';
import { appendAcademyAudit } from '@/server/academyContent';
import { coachOwnsSport, getStore, persistStore, visibleStudents } from '@/server/store';

const CATEGORIES = new Set<Achievement['category']>(['Tournament', 'Skill Badge', 'Milestone', 'Personal Best']);
const MEDALS = new Set<NonNullable<Achievement['medalType']>>(['Gold', 'Silver', 'Bronze', 'Badge', 'Trophy']);

function requiredText(value: unknown, field: string, maxLength = 180) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new ApiError(400, `${field} is required and must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

function optionalPhoto(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.length > 2048) throw new ApiError(400, 'Achievement photo URL is invalid.');
  if (/^\/api\/media\/file\/[a-z0-9-]{1,64}(?:\?variant=thumb)?$/i.test(value)) return value;
  try {
    if (new URL(value).protocol !== 'https:') throw new Error('scheme');
  } catch {
    throw new ApiError(400, 'Achievement photos must use an https URL.');
  }
  return value;
}

export async function GET(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH', 'STUDENT']);
    const visibleIds = new Set(visibleStudents(session).map((student) => student.id));
    const achievements = getStore().students
      .filter((student) => visibleIds.has(student.id))
      .flatMap((student) => student.achievements.map((achievement) => ({ ...achievement, studentName: `${student.firstName} ${student.lastName}` })));
    return NextResponse.json({ success: true, achievements });
  });
}

export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, 'A JSON body is required.');
    const studentId = requiredText(body.studentId, 'Student');
    const student = getStore().students.find((item) => item.id === studentId && item.isActive);
    if (!student || !visibleStudents(session).some((item) => item.id === studentId)) throw new ApiError(403, 'Student is outside your permitted academy records.');
    if (!isSportIdValue(body.sportId) || !getStore().enrollments.some((item) => item.studentId === studentId && item.sportId === body.sportId && item.active)) throw new ApiError(400, 'Choose a sport in which this student is actively enrolled.');
    if (!coachOwnsSport(session, body.sportId)) throw new ApiError(403, 'You cannot manage achievements for this sport.');
    if (!isIsoDate(body.awardedDate)) throw new ApiError(400, 'Choose a valid achievement date.');
    if (!CATEGORIES.has(body.category)) throw new ApiError(400, 'Choose a valid achievement category.');
    if (body.medalType && !MEDALS.has(body.medalType)) throw new ApiError(400, 'Choose a valid medal type.');
    const now = new Date().toISOString();
    const achievement: Achievement = {
      id: randomUUID(),
      studentId,
      title: requiredText(body.title, 'Title'),
      sport: body.sportId,
      category: body.category,
      description: requiredText(body.description, 'Description', 1000),
      awardedDate: body.awardedDate,
      coachName: session.name,
      medalType: body.medalType || undefined,
      photoUrl: optionalPhoto(body.photoUrl),
      createdBy: session.name,
      updatedBy: session.name,
      createdAt: now,
      updatedAt: now,
    };
    student.achievements.unshift(achievement);
    await persistStore();
    await appendAcademyAudit(session, 'created', 'achievement', achievement.id, `${student.firstName} ${student.lastName}: ${achievement.title}`);
    return NextResponse.json({ success: true, achievement }, { status: 201 });
  });
}

export async function PUT(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const body = await req.json().catch(() => null);
    if (!body || typeof body.id !== 'string') throw new ApiError(400, 'An achievement ID is required.');
    const student = getStore().students.find((item) => item.achievements.some((achievement) => achievement.id === body.id));
    if (!student || !visibleStudents(session).some((item) => item.id === student.id)) throw new ApiError(404, 'Achievement not found in your permitted records.');
    const index = student.achievements.findIndex((achievement) => achievement.id === body.id);
    const previous = student.achievements[index];
    if (!isSportIdValue(body.sportId) || !getStore().enrollments.some((item) => item.studentId === student.id && item.sportId === body.sportId && item.active)) throw new ApiError(400, 'Choose a sport in which this student is actively enrolled.');
    if (!coachOwnsSport(session, body.sportId)) throw new ApiError(403, 'You cannot manage achievements for this sport.');
    if (!isIsoDate(body.awardedDate)) throw new ApiError(400, 'Choose a valid achievement date.');
    if (!CATEGORIES.has(body.category)) throw new ApiError(400, 'Choose a valid achievement category.');
    if (body.medalType && !MEDALS.has(body.medalType)) throw new ApiError(400, 'Choose a valid medal type.');
    const updated: Achievement = {
      ...previous,
      title: requiredText(body.title, 'Title'),
      sport: body.sportId,
      category: body.category,
      description: requiredText(body.description, 'Description', 1000),
      awardedDate: body.awardedDate,
      medalType: body.medalType || undefined,
      photoUrl: optionalPhoto(body.photoUrl),
      updatedBy: session.name,
      updatedAt: new Date().toISOString(),
    };
    student.achievements[index] = updated;
    await persistStore();
    await appendAcademyAudit(session, 'updated', 'achievement', updated.id, `${student.firstName} ${student.lastName}: ${updated.title}`);
    return NextResponse.json({ success: true, achievement: updated });
  });
}

export async function DELETE(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const body = await req.json().catch(() => null);
    if (!body || typeof body.id !== 'string') throw new ApiError(400, 'An achievement ID is required.');
    const student = getStore().students.find((item) => item.achievements.some((achievement) => achievement.id === body.id));
    if (!student || !visibleStudents(session).some((item) => item.id === student.id)) throw new ApiError(404, 'Achievement not found in your permitted records.');
    const index = student.achievements.findIndex((achievement) => achievement.id === body.id);
    const [deleted] = student.achievements.splice(index, 1);
    await persistStore();
    await appendAcademyAudit(session, 'deleted', 'achievement', deleted.id, `${student.firstName} ${student.lastName}: ${deleted.title}`);
    return NextResponse.json({ success: true, id: deleted.id });
  });
}

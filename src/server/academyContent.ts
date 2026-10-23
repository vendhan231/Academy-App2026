import { randomUUID } from 'node:crypto';
import { AcademyEvent, SCHEDULE_DAYS, ScheduleSlot, UPCOMING_EVENTS, WEEK_SCHEDULE } from '@/data/publicSiteData';
import { getDb } from '@/lib/mongo';
import { SessionPayload } from '@/lib/session';
import { isIsoDate, isSportIdValue } from '@/server/validation';
import { ApiError } from '@/lib/apiAuth';
import { ensureStoreReady } from '@/server/store';

export interface AuditMetadata {
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ManagedScheduleSlot = ScheduleSlot & AuditMetadata;
export type ManagedAcademyEvent = AcademyEvent & AuditMetadata;
type ContentResource = 'schedule' | 'event' | 'announcement' | 'achievement' | 'media' | 'consent';
type AuditAction = 'created' | 'updated' | 'deleted';

interface ContentAuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: SessionPayload['role'];
  action: AuditAction;
  resource: ContentResource;
  itemId: string;
  itemTitle: string;
  timestamp: string;
}

interface AcademyContent {
  schedule: ManagedScheduleSlot[];
  events: ManagedAcademyEvent[];
  auditLog: ContentAuditEntry[];
}

const globalContent = globalThis as typeof globalThis & { __vendhanAcademyContent?: AcademyContent };
const DAYS = new Set<string>(SCHEDULE_DAYS);
const EVENT_TYPES = new Set<string>(['Tournament', 'Trial Camp', 'Time Trials', 'Sports Day', 'Celebration', 'Training']);
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function currentTimestamp() {
  return new Date().toISOString();
}

function initialContent(): AcademyContent {
  const timestamp = currentTimestamp();
  return {
    schedule: WEEK_SCHEDULE.map((slot) => ({ ...slot, createdBy: 'System', updatedBy: 'System', createdAt: timestamp, updatedAt: timestamp })),
    events: UPCOMING_EVENTS.map((event) => ({ ...event, createdBy: 'System', updatedBy: 'System', createdAt: timestamp, updatedAt: timestamp })),
    auditLog: [],
  };
}

export async function loadAcademyContent(): Promise<AcademyContent> {
  await ensureStoreReady();
  const db = getDb();
  if (!globalContent.__vendhanAcademyContent) globalContent.__vendhanAcademyContent = initialContent();
  if (!db) return globalContent.__vendhanAcademyContent;

  const collection = db.collection<{ key: string; data: AcademyContent; updatedAt: Date }>('academy_content');
  await collection.updateOne(
    { key: 'primary' },
    { $setOnInsert: { key: 'primary', data: globalContent.__vendhanAcademyContent, updatedAt: new Date() } },
    { upsert: true }
  );
  const snapshot = await collection.findOne({ key: 'primary' });
  if (!snapshot) throw new ApiError(500, 'Academy content could not be loaded.');
  globalContent.__vendhanAcademyContent = snapshot.data;
  return snapshot.data;
}

async function persistAcademyContent(content: AcademyContent) {
  globalContent.__vendhanAcademyContent = content;
  const db = getDb();
  if (!db) return;
  await db.collection<{ key: string; data: AcademyContent; updatedAt: Date }>('academy_content').replaceOne(
    { key: 'primary' },
    { key: 'primary', data: content, updatedAt: new Date() },
    { upsert: true }
  );
}

function requiredText(value: unknown, field: string, maxLength = 120): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new ApiError(400, `${field} is required and must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

function validateSchedule(value: unknown): Omit<ScheduleSlot, 'id'> {
  if (!value || typeof value !== 'object') throw new ApiError(400, 'Schedule details are required.');
  const slot = value as Partial<ScheduleSlot>;
  if (typeof slot.day !== 'string' || !DAYS.has(slot.day)) throw new ApiError(400, 'Choose a valid weekday.');
  if (!TIME_PATTERN.test(slot.startTime ?? '') || !TIME_PATTERN.test(slot.endTime ?? '') || slot.startTime! >= slot.endTime!) {
    throw new ApiError(400, 'Choose valid start and end times.');
  }
  if (!isSportIdValue(slot.sportId)) throw new ApiError(400, 'Choose a valid sport.');
  return {
    day: slot.day as ScheduleSlot['day'],
    startTime: slot.startTime!,
    endTime: slot.endTime!,
    sportId: slot.sportId,
    batch: requiredText(slot.batch, 'Batch'),
    coach: requiredText(slot.coach, 'Coach'),
    venue: requiredText(slot.venue, 'Ground / venue'),
    focus: requiredText(slot.focus, 'Class focus', 240),
  };
}

function validateEvent(value: unknown, requireFutureDate: boolean): Omit<AcademyEvent, 'id'> {
  if (!value || typeof value !== 'object') throw new ApiError(400, 'Event details are required.');
  const event = value as Partial<AcademyEvent>;
  const date = requiredText(event.date, 'Event date', 10);
  const validDate = isIsoDate(date);
  if (!validDate || (requireFutureDate && date < new Date().toISOString().slice(0, 10))) {
    throw new ApiError(400, requireFutureDate ? 'New events must have a date today or later.' : 'Choose a valid event date.');
  }
  if (!event.type || !EVENT_TYPES.has(event.type)) throw new ApiError(400, 'Choose a valid event category.');
  if (typeof event.time !== 'string' || !event.time.trim() || event.time.trim().length > 80) throw new ApiError(400, 'Event time is required.');
  const spotsLeft = Number(event.spotsLeft);
  if (!Number.isInteger(spotsLeft) || spotsLeft < 0) throw new ApiError(400, 'Available spots must be a non-negative whole number.');
  return {
    title: requiredText(event.title, 'Event title'),
    type: event.type,
    date,
    time: event.time.trim(),
    venue: requiredText(event.venue, 'Event location'),
    audience: requiredText(event.audience, 'Event audience'),
    spotsLeft,
    description: requiredText(event.description, 'Event description', 1000),
  };
}

function addAudit(content: AcademyContent, session: SessionPayload, action: AuditAction, resource: ContentResource, itemId: string, itemTitle: string) {
  content.auditLog.unshift({
    id: randomUUID(),
    actorId: session.userId,
    actorName: session.name,
    actorRole: session.role,
    action,
    resource,
    itemId,
    itemTitle,
    timestamp: currentTimestamp(),
  });
  content.auditLog = content.auditLog.slice(0, 1000);
}

export async function appendAcademyAudit(
  session: SessionPayload,
  action: AuditAction,
  resource: ContentResource,
  itemId: string,
  itemTitle: string
) {
  const content = await loadAcademyContent();
  addAudit(content, session, action, resource, itemId, itemTitle);
  await persistAcademyContent(content);
}

export async function mutateAcademyContent(
  session: SessionPayload,
  input: { action: 'create' | 'update' | 'delete'; resource: ContentResource; id?: string; item?: unknown }
): Promise<AcademyContent> {
  const content = await loadAcademyContent();
  const timestamp = currentTimestamp();

  if (input.resource === 'schedule') {
    const index = input.id ? content.schedule.findIndex((slot) => slot.id === input.id) : -1;
    if (input.action !== 'create' && index < 0) throw new ApiError(404, 'Schedule slot not found.');
    if (input.action === 'delete') {
      const [deleted] = content.schedule.splice(index, 1);
      addAudit(content, session, 'deleted', 'schedule', deleted.id, `${deleted.batch} · ${deleted.sportId}`);
    } else {
      const details = validateSchedule(input.item);
      const id = input.action === 'create' ? randomUUID() : content.schedule[index].id;
      const conflict = content.schedule.find((slot) => {
        if (slot.id === id || slot.day !== details.day) return false;
        const overlaps = details.startTime < slot.endTime && details.endTime > slot.startTime;
        return overlaps && (slot.coach.toLowerCase() === details.coach.toLowerCase() || slot.venue.toLowerCase() === details.venue.toLowerCase());
      });
      if (conflict) throw new ApiError(409, 'This coach or ground already has an overlapping class at that time.');
      if (input.action === 'create') {
        content.schedule.push({ ...details, id, createdBy: session.name, updatedBy: session.name, createdAt: timestamp, updatedAt: timestamp });
        addAudit(content, session, 'created', 'schedule', id, `${details.batch} · ${details.sportId}`);
      } else {
        const previous = content.schedule[index];
        content.schedule[index] = { ...previous, ...details, updatedBy: session.name, updatedAt: timestamp };
        addAudit(content, session, 'updated', 'schedule', id, `${details.batch} · ${details.sportId}`);
      }
    }
  } else {
    const index = input.id ? content.events.findIndex((event) => event.id === input.id) : -1;
    if (input.action !== 'create' && index < 0) throw new ApiError(404, 'Event not found.');
    if (input.action === 'delete') {
      const [deleted] = content.events.splice(index, 1);
      addAudit(content, session, 'deleted', 'event', deleted.id, deleted.title);
    } else {
      const details = validateEvent(input.item, input.action === 'create');
      const id = input.action === 'create' ? randomUUID() : content.events[index].id;
      if (input.action === 'create') {
        content.events.unshift({ ...details, id, createdBy: session.name, updatedBy: session.name, createdAt: timestamp, updatedAt: timestamp });
        addAudit(content, session, 'created', 'event', id, details.title);
      } else {
        const previous = content.events[index];
        content.events[index] = { ...previous, ...details, updatedBy: session.name, updatedAt: timestamp };
        addAudit(content, session, 'updated', 'event', id, details.title);
      }
    }
  }

  await persistAcademyContent(content);
  return content;
}

export type { AcademyContent, ContentResource };

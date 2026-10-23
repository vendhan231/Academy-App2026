import { randomUUID } from 'node:crypto';
import { Collection } from 'mongodb';
import { Announcement, Achievement, ActiveStudent } from '@/types';
import { AcademyEvent, ScheduleSlot } from '@/data/publicSiteData';
import { getDb } from '@/lib/mongo';
import { SessionPayload } from '@/lib/session';
import { ensureStoreReady, getStore } from '@/server/store';
import { appendAcademyAudit } from '@/server/academyContent';

export type NotificationType = 'emergency_schedule_change' | 'event_update' | 'announcement' | 'achievement' | 'test';
export type NotificationStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface NotificationRecord {
  id: string;
  recipient: string;
  studentId?: string;
  studentName?: string;
  type: NotificationType;
  priority: 'urgent' | 'normal';
  status: NotificationStatus;
  error?: string;
  message?: string;
  timestamp: string;
  updatedAt: string;
  attempts: number;
  nextAttemptAt: string;
  templateName: string;
  templateParams: string[];
  createdBy: string;
  lockedUntil?: string;
  providerMessageId?: string;
}

export interface QueueResult {
  queued: number;
  skippedNoConsent: number;
  skippedInvalid: number;
  copyMessage: string;
  shareUrl: string;
}

class ProviderNotConfigured extends Error {}

const globalNotifications = globalThis as typeof globalThis & {
  __vendhanNotifications?: NotificationRecord[];
  __vendhanNotificationWorkerBusy?: boolean;
  __vendhanNotificationWorkerTimer?: ReturnType<typeof setInterval>;
};
const MAX_ATTEMPTS = 3;
const TEMPLATE_DEFAULTS: Record<Exclude<NotificationType, 'test'>, string> = {
  emergency_schedule_change: 'emergency_schedule_change',
  event_update: 'event_update',
  announcement: 'announcement',
  achievement: 'achievement',
};

export function normalizeWhatsAppPhone(value: string): string | null {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, '');
  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  if (/^91\d{10}$/.test(digits)) return `+${digits}`;
  if (raw.startsWith('+') && /^\+[1-9]\d{7,14}$/.test(`+${digits}`)) return `+${digits}`;
  return null;
}

export function sanitizeWhatsAppRecipient(value: string): string {
  return value.replace(/[\s+]/g, '');
}

export function resolveWhatsAppTemplateLanguage(value: string | undefined, fallback = 'en_US'): string {
  const cleaned = value?.trim();
  const normalized = cleaned ? cleaned.replace(/-/g, '_') : fallback;
  if (/^[a-z]{2}_[A-Za-z0-9]+$/.test(normalized)) return normalized;
  return fallback;
}

export function resolveWhatsAppTemplateName(value: string | undefined, fallback: string): string {
  const cleaned = value?.trim();
  return cleaned && cleaned.length > 0 ? cleaned : fallback;
}

export function buildWhatsAppTemplatePayload({
  recipient,
  templateName,
  templateLanguage,
  templateParams = [],
  isTest = false,
}: {
  recipient: string;
  templateName: string;
  templateLanguage: string;
  templateParams?: string[];
  isTest?: boolean;
}) {
  const payload: {
    messaging_product: 'whatsapp';
    to: string;
    type: 'template';
    template: {
      name: string;
      language: { code: string };
      components?: Array<{ type: 'body'; parameters: Array<{ type: 'text'; text: string }> }>;
    };
  } = {
    messaging_product: 'whatsapp',
    to: sanitizeWhatsAppRecipient(recipient),
    type: 'template',
    template: {
      name: resolveWhatsAppTemplateName(templateName, 'hello_world'),
      language: { code: resolveWhatsAppTemplateLanguage(templateLanguage, 'en_US') },
    },
  };

  const params = templateParams.filter((text) => typeof text === 'string' && text.trim().length > 0);
  if (params.length > 0 && !isTest) {
    payload.template.components = [{
      type: 'body',
      parameters: params.map((text) => ({ type: 'text', text })),
    }];
  }

  return payload;
}

export function buildWhatsAppTextPayload(recipient: string, message: string) {
  return {
    messaging_product: 'whatsapp',
    to: sanitizeWhatsAppRecipient(recipient),
    type: 'text',
    text: {
      body: message.trim(),
    },
  } as const;
}

export function formatMetaError(payload: any, fallbackStatus?: number): string {
  const error = payload?.error ?? payload;
  const code = error?.code ?? error?.error_data?.code ?? null;
  const message = error?.message ?? error?.error_user_title ?? error?.error_user_msg ?? null;
  const details = typeof message === 'string' ? message.trim() : '';
  if (code && details) return `Meta API error (#${code}): ${details}`;
  if (details) return `Meta API error: ${details}`;
  if (typeof code === 'number' || typeof code === 'string') return `Meta API error (#${code}).`;
  return `WhatsApp provider rejected the message${typeof fallbackStatus === 'number' ? ` (${fallbackStatus})` : ''}.`;
}

export function isPermanentWhatsAppError(message: string): boolean {
  const normalized = message.toLowerCase();
  if (/\b(?:131026|131030|131047|131051|132001|132000)\b/i.test(message)) return true;
  return /(template.*(does not exist|not found)|invalid parameter|invalid number|recipient.*not in allowed list|number.*not in allowed list|invalid recipient|recipient.*not allowed|undeliverable|outside 24[- ]hour window)/i.test(message)
    || /template.*(does not exist|not found)|invalid parameter|invalid number|recipient.*not in allowed list|not in allowed list|undeliverable|outside 24[- ]hour window/i.test(normalized);
}

function templateName(type: NotificationType) {
  const envKey: Partial<Record<NotificationType, string>> = {
    emergency_schedule_change: 'WHATSAPP_TEMPLATE_EMERGENCY_SCHEDULE_CHANGE',
    event_update: 'WHATSAPP_TEMPLATE_EVENT_UPDATE',
    announcement: 'WHATSAPP_TEMPLATE_ANNOUNCEMENT',
    achievement: 'WHATSAPP_TEMPLATE_ACHIEVEMENT',
    test: 'WHATSAPP_TEST_TEMPLATE_NAME',
  };

  if (type === 'test') {
    return resolveWhatsAppTemplateName(process.env.WHATSAPP_TEST_TEMPLATE_NAME, 'hello_world');
  }

  return resolveWhatsAppTemplateName(process.env[envKey[type] ?? '']?.trim(), TEMPLATE_DEFAULTS[type]);
}

async function getCollection(): Promise<Collection<NotificationRecord> | null> {
  await ensureStoreReady();
  const db = getDb();
  return db ? db.collection<NotificationRecord>('whatsapp_notification_queue') : null;
}

function memoryQueue() {
  if (!globalNotifications.__vendhanNotifications) globalNotifications.__vendhanNotifications = [];
  return globalNotifications.__vendhanNotifications;
}

function ensureBackgroundWorker() {
  if (globalNotifications.__vendhanNotificationWorkerTimer) return;
  globalNotifications.__vendhanNotificationWorkerTimer = setInterval(() => {
    void processNotificationQueue();
  }, 15_000);
  globalNotifications.__vendhanNotificationWorkerTimer.unref?.();
}

async function insertNotification(record: NotificationRecord) {
  const collection = await getCollection();
  if (collection) await collection.insertOne(record);
  else memoryQueue().unshift(record);
}

async function updateNotification(id: string, updates: Partial<NotificationRecord>) {
  const collection = await getCollection();
  if (collection) {
    await collection.updateOne({ id }, { $set: updates });
    return;
  }
  const record = memoryQueue().find((item) => item.id === id);
  if (record) Object.assign(record, updates);
}

export async function listNotifications(limit = 300): Promise<NotificationRecord[]> {
  const collection = await getCollection();
  if (collection) return collection.find({}).sort({ timestamp: -1 }).limit(limit).toArray();
  return memoryQueue().slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
}

export async function updateNotificationFromProvider(
  providerMessageId: string,
  status: 'sent' | 'delivered' | 'read' | 'failed',
  error?: string,
  code?: number | string
) {
  const updates: Partial<NotificationRecord> = { status, updatedAt: new Date().toISOString() };
  if (error) updates.error = error;
  if (code !== undefined && code !== null) updates.error = `${code}: ${updates.error ?? 'Provider reported a WhatsApp failure.'}`;
  const collection = await getCollection();
  if (collection) {
    await collection.updateOne({ providerMessageId }, { $set: updates });
    return;
  }
  const record = memoryQueue().find((item) => item.providerMessageId === providerMessageId);
  if (record) Object.assign(record, updates);
}

async function claimDueNotification(): Promise<NotificationRecord | null> {
  const now = new Date().toISOString();
  const lockedUntil = new Date(Date.now() + 60_000).toISOString();
  const collection = await getCollection();
  if (collection) {
    return collection.findOneAndUpdate(
      {
        status: 'queued',
        attempts: { $lt: MAX_ATTEMPTS },
        nextAttemptAt: { $lte: now },
        $or: [{ lockedUntil: { $exists: false } }, { lockedUntil: { $lte: now } }],
      },
      { $set: { lockedUntil }, $inc: { attempts: 1 } },
      { sort: { priority: -1, timestamp: 1 }, returnDocument: 'after' }
    );
  }
  const record = memoryQueue()
    .filter((item) => item.status === 'queued' && item.attempts < MAX_ATTEMPTS && item.nextAttemptAt <= now && (!item.lockedUntil || item.lockedUntil <= now))
    .sort((left, right) => (left.priority === right.priority ? left.timestamp.localeCompare(right.timestamp) : left.priority === 'urgent' ? -1 : 1))[0];
  if (!record) return null;
  record.lockedUntil = lockedUntil;
  record.attempts += 1;
  return { ...record };
}

async function deliverTemplate(record: NotificationRecord): Promise<{ messageId?: string; fallbackUsed?: boolean; fallbackNote?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneNumberId) throw new ProviderNotConfigured('WhatsApp Cloud API credentials are not configured.');
  const version = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0';
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || process.env.WHATSAPP_TEST_TEMPLATE_LANGUAGE?.trim() || 'en_US';
  const maybeSendText = Boolean(record.message && record.message.trim().length > 0 && record.type === 'test');
  const payload = maybeSendText
    ? buildWhatsAppTextPayload(record.recipient, record.message ?? '')
    : buildWhatsAppTemplatePayload({
        recipient: record.recipient,
        templateName: record.templateName,
        templateLanguage,
        templateParams: record.templateParams,
        isTest: record.type === 'test',
      });

  const response = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const code = Number(result?.error?.code ?? 0);
    const shouldFallbackToTemplate = maybeSendText && code === 131047;
    if (shouldFallbackToTemplate) {
      const fallbackPayload = buildWhatsAppTemplatePayload({
        recipient: record.recipient,
        templateName: resolveWhatsAppTemplateName(process.env.WHATSAPP_TEST_TEMPLATE_NAME, 'hello_world'),
        templateLanguage: resolveWhatsAppTemplateLanguage(process.env.WHATSAPP_TEST_TEMPLATE_LANGUAGE, 'en_US'),
        templateParams: [],
        isTest: true,
      });
      const fallbackResponse = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(phoneNumberId)}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackPayload),
      });
      const fallbackResult = await fallbackResponse.json().catch(() => null);
      if (!fallbackResponse.ok) throw new Error(formatMetaError(fallbackResult, fallbackResponse.status));
      return { messageId: fallbackResult?.messages?.[0]?.id as string | undefined, fallbackUsed: true, fallbackNote: 'Meta 24-hour window was closed; used template hello_world (en_US) instead.' };
    }
    throw new Error(formatMetaError(result, response.status));
  }

  return { messageId: result?.messages?.[0]?.id as string | undefined };
}

export async function processNotificationQueue() {
  if (globalNotifications.__vendhanNotificationWorkerBusy) return;
  globalNotifications.__vendhanNotificationWorkerBusy = true;
  try {
    for (let processed = 0; processed < 25; processed += 1) {
      const record = await claimDueNotification();
      if (!record) break;
      const updatedAt = new Date().toISOString();
      try {
        const result = await deliverTemplate(record);
        const providerMessageId = result.messageId;
        await updateNotification(record.id, {
          status: 'sent',
          error: result.fallbackNote,
          updatedAt,
          lockedUntil: undefined,
          providerMessageId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'WhatsApp delivery failed.';
        const permanent = error instanceof ProviderNotConfigured || isPermanentWhatsAppError(message);
        if (permanent) {
          await updateNotification(record.id, {
            status: 'failed',
            error: message,
            updatedAt,
            lockedUntil: undefined,
            nextAttemptAt: new Date().toISOString(),
          });
          continue;
        }
        const failed = record.attempts >= MAX_ATTEMPTS;
        const retryDelays = [30_000, 5 * 60_000];
        await updateNotification(record.id, {
          status: failed ? 'failed' : 'queued',
          error: message,
          updatedAt,
          lockedUntil: undefined,
          nextAttemptAt: failed ? new Date().toISOString() : new Date(Date.now() + retryDelays[Math.min(record.attempts - 1, retryDelays.length - 1)]).toISOString(),
        });
      }
    }
  } finally {
    globalNotifications.__vendhanNotificationWorkerBusy = false;
  }
}

export async function enqueueMessages(input: {
  session: SessionPayload;
  type: NotificationType;
  recipients: Array<{ phone: string; student?: ActiveStudent }>;
  params: string[];
  message: string;
  priority?: 'urgent' | 'normal';
}): Promise<QueueResult> {
  const now = new Date().toISOString();
  let queued = 0;
  let skippedInvalid = 0;
  let skippedNoConsent = 0;
  const seen = new Set<string>();
  for (const candidate of input.recipients) {
    const student = candidate.student;
    if (student && !student.parentMessagingConsentAt) {
      skippedNoConsent += 1;
      continue;
    }
    const normalized = normalizeWhatsAppPhone(candidate.phone);
    if (!normalized) {
      skippedInvalid += 1;
      await insertNotification({
        id: randomUUID(), recipient: candidate.phone || 'missing', studentId: student?.id,
        studentName: student ? `${student.firstName} ${student.lastName}` : undefined,
        type: input.type, priority: input.priority ?? 'normal', status: 'failed', error: 'Skipped: invalid guardian phone number.',
        timestamp: now, updatedAt: now, attempts: 0, nextAttemptAt: now,
        templateName: templateName(input.type), templateParams: input.params, createdBy: input.session.name,
      });
      continue;
    }
    const uniqueKey = `${student?.id ?? ''}:${normalized}`;
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);
    await insertNotification({
      id: randomUUID(), recipient: normalized, studentId: student?.id,
      studentName: student ? `${student.firstName} ${student.lastName}` : undefined,
      type: input.type, priority: input.priority ?? 'normal', status: 'queued', timestamp: now, updatedAt: now, attempts: 0,
      nextAttemptAt: now, templateName: templateName(input.type),
      templateParams: input.params, createdBy: input.session.name,
    });
    queued += 1;
  }
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(input.message)}`;
  if (queued) {
    ensureBackgroundWorker();
    void processNotificationQueue();
  }
  return { queued, skippedNoConsent, skippedInvalid, copyMessage: input.message, shareUrl };
}

function optedInStudents(students: ActiveStudent[]) {
  return students.filter((student) => Boolean(student.parentMessagingConsentAt));
}

export async function queueScheduleEmergency(session: SessionPayload, slot: ScheduleSlot, reason: string, newTiming: string) {
  const store = getStore();
  const eligibleIds = new Set(store.enrollments.filter((item) => item.active && item.sportId === slot.sportId).map((item) => item.studentId));
  const recipients = optedInStudents(store.students.filter((student) => eligibleIds.has(student.id) && student.batchShift.toLowerCase() === slot.batch.toLowerCase()))
    .map((student) => ({ phone: student.parentPhone, student }));
  const message = `Vendhan Sports Academy: Today's ${slot.batch} class at ${slot.startTime} is postponed due to ${reason}. New timing: ${newTiming || 'will be informed'}.`;
  const result = await enqueueMessages({ session, type: 'emergency_schedule_change', priority: 'urgent', recipients, params: [slot.batch, slot.startTime, reason, newTiming || 'will be informed'], message });
  await appendAcademyAudit(session, 'updated', 'schedule', slot.id, `Emergency schedule change: ${reason}`);
  return result;
}

export async function queueEventPreview(session: SessionPayload, event: AcademyEvent, action: 'created' | 'updated' | 'cancelled') {
  const recipients = optedInStudents(getStore().students).map((student) => ({ phone: student.parentPhone, student }));
  const message = `Vendhan Sports Academy: ${event.title} ${action} for ${event.date} at ${event.time}, ${event.venue}. ${event.description}`;
  return enqueueMessages({ session, type: 'event_update', recipients, params: [action, event.title, event.date, event.time, event.venue, event.description], message });
}

export async function queueAnnouncementPreview(session: SessionPayload, announcement: Announcement) {
  const eligible = getStore().students.filter((student) => {
    if (announcement.audience !== 'ALL' && announcement.audience !== 'STUDENT') return false;
    if (announcement.sportId && !getStore().enrollments.some((item) => item.studentId === student.id && item.active && item.sportId === announcement.sportId)) return false;
    return true;
  });
  const recipients = optedInStudents(eligible).map((student) => ({ phone: student.parentPhone, student }));
  const message = `Vendhan Sports Academy announcement: ${announcement.title}. ${announcement.body}`;
  return enqueueMessages({ session, type: 'announcement', recipients, params: [announcement.title, announcement.body], message });
}

export async function queueAchievementPreview(session: SessionPayload, achievement: Achievement, student: ActiveStudent) {
  const message = `Congratulations ${student.firstName}! You earned ${achievement.title} in ${achievement.sport} on ${achievement.awardedDate}. ${achievement.description}`;
  const recipients = student.parentMessagingConsentAt ? [{ phone: student.parentPhone, student }] : [];
  return enqueueMessages({ session, type: 'achievement', recipients, params: [student.firstName, achievement.title, achievement.sport, achievement.awardedDate, achievement.description], message });
}

export async function resendFailedNotification(id: string, actor: string) {
  const record = (await listNotifications(1000)).find((item) => item.id === id);
  if (!record || record.status !== 'failed') return false;
  await updateNotification(id, { status: 'queued', error: undefined, attempts: 0, nextAttemptAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: actor });
  ensureBackgroundWorker();
  void processNotificationQueue();
  return true;
}

export async function sendWhatsAppTest(phone: string, actor: string, message?: string) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) throw new Error('Enter a valid international phone number, such as +919876543210.');
  const trimmedMessage = message?.trim() ?? '';
  const record: NotificationRecord = {
    id: randomUUID(), recipient: normalized, type: 'test', priority: 'normal', status: 'queued', timestamp: new Date().toISOString(),
    updatedAt: new Date().toISOString(), attempts: 0, nextAttemptAt: new Date().toISOString(),
    templateName: resolveWhatsAppTemplateName(process.env.WHATSAPP_TEST_TEMPLATE_NAME, 'hello_world'),
    templateParams: [],
    message: trimmedMessage || undefined,
    createdBy: actor,
  };
  if (trimmedMessage.length > 0) {
    record.message = trimmedMessage;
    record.templateName = resolveWhatsAppTemplateName(process.env.WHATSAPP_TEST_TEMPLATE_NAME, 'hello_world');
  }
  await insertNotification(record);
  ensureBackgroundWorker();
  void processNotificationQueue();
  return record;
}

import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { MediaItem } from '@/types';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { isSportIdValue } from '@/server/validation';
import { appendAcademyAudit } from '@/server/academyContent';
import { deleteStoredImage, MAX_MEDIA_BATCH, processImageUpload } from '@/server/mediaFiles';
import { getStore, persistStore } from '@/server/store';

export const runtime = 'nodejs';
const CATEGORIES = new Set<MediaItem['category']>(['Match', 'Training', 'Award Ceremony', 'Clinic']);

function text(value: FormDataEntryValue | null, field: string, max = 120) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new ApiError(400, `${field} is required and must be at most ${max} characters.`);
  }
  return value.trim();
}

function mediaCategory(value: FormDataEntryValue | null): MediaItem['category'] {
  if (typeof value !== 'string' || !CATEGORIES.has(value as MediaItem['category'])) throw new ApiError(400, 'Choose a valid photo category.');
  return value as MediaItem['category'];
}

function uploadFiles(form: FormData): File[] {
  const files = form.getAll('files').filter((entry): entry is File => typeof entry !== 'string' && entry.size > 0);
  if (files.length === 0) throw new ApiError(400, 'Select at least one JPG, PNG, or WebP photo.');
  if (files.length > MAX_MEDIA_BATCH) throw new ApiError(400, `Upload at most ${MAX_MEDIA_BATCH} photos at a time.`);
  return files;
}

export async function GET(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH', 'STUDENT']);
    const media = getStore().media.filter((item) => session.role !== 'STUDENT' || item.isApproved);
    return NextResponse.json({ success: true, media });
  });
}

export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const form = await req.formData();
    const files = uploadFiles(form);
    const sport = form.get('sport');
    if (!isSportIdValue(sport)) throw new ApiError(400, 'Choose a valid sport.');
    const category = mediaCategory(form.get('category'));
    const titleValue = form.get('title');
    if (titleValue !== null && typeof titleValue !== 'string') throw new ApiError(400, 'Photo title is invalid.');
    const sharedTitle = typeof titleValue === 'string' ? titleValue : '';
    const created: MediaItem[] = [];
    try {
      for (const file of files) {
        const id = randomUUID();
        await processImageUpload(file, id);
        const now = new Date().toISOString();
        const item: MediaItem = {
          id,
          title: sharedTitle.trim() || file.name.replace(/\.[^.]+$/, '').slice(0, 120) || 'Academy photo',
          sport,
          mediaUrl: `/api/media/file/${id}`,
          thumbnailUrl: `/api/media/file/${id}?variant=thumb`,
          category,
          uploadedBy: session.name,
          uploadedAt: now.slice(0, 10),
          taggedStudentNames: [],
          isApproved: true,
          createdBy: session.name,
          updatedBy: session.name,
          createdAt: now,
          updatedAt: now,
        };
        created.push(item);
      }
      getStore().media.unshift(...created);
      await persistStore();
    } catch (error) {
      getStore().media = getStore().media.filter((item) => !created.some((made) => made.id === item.id));
      await Promise.all(created.map((item) => deleteStoredImage(item.id)));
      throw error;
    }
    await Promise.all(created.map((item) => appendAcademyAudit(session, 'created', 'media', item.id, item.title)));
    return NextResponse.json({ success: true, media: created }, { status: 201 });
  });
}

export async function PUT(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const form = await req.formData();
    const id = text(form.get('id'), 'Photo ID', 64);
    const store = getStore();
    const index = store.media.findIndex((item) => item.id === id);
    if (index < 0) throw new ApiError(404, 'Photo not found.');
    const previous = store.media[index];
    const sport = form.get('sport');
    if (!isSportIdValue(sport)) throw new ApiError(400, 'Choose a valid sport.');
    const updated: MediaItem = {
      ...previous,
      title: text(form.get('title'), 'Photo title'),
      sport,
      category: mediaCategory(form.get('category')),
      taggedStudentNames: form.getAll('taggedStudentNames').filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean),
      updatedBy: session.name,
      updatedAt: new Date().toISOString(),
      isApproved: true,
    };
    const files = form.getAll('files').filter((entry): entry is File => typeof entry !== 'string' && entry.size > 0);
    if (files.length > 1) throw new ApiError(400, 'Replace a photo with only one file.');
    if (files.length === 1) await processImageUpload(files[0], id);
    store.media[index] = updated;
    try {
      await persistStore();
    } catch (error) {
      store.media[index] = previous;
      throw error;
    }
    await appendAcademyAudit(session, 'updated', 'media', id, updated.title);
    return NextResponse.json({ success: true, media: updated });
  });
}

export async function PATCH(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN']);
    const body = await req.json().catch(() => null);
    if (!body || typeof body.id !== 'string' || typeof body.isApproved !== 'boolean') {
      throw new ApiError(400, 'Photo ID and approval status are required.');
    }
    const item = getStore().media.find((media) => media.id === body.id);
    if (!item) throw new ApiError(404, 'Photo not found.');
    item.isApproved = body.isApproved;
    item.updatedBy = session.name;
    item.updatedAt = new Date().toISOString();
    await persistStore();
    await appendAcademyAudit(session, 'updated', 'media', item.id, `${item.title} (${item.isApproved ? 'approved' : 'unapproved'})`);
    return NextResponse.json({ success: true, media: item });
  });
}

export async function DELETE(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const body = await req.json().catch(() => null);
    if (!body || typeof body.id !== 'string') throw new ApiError(400, 'A photo ID is required.');
    const store = getStore();
    const index = store.media.findIndex((item) => item.id === body.id);
    if (index < 0) throw new ApiError(404, 'Photo not found.');
    const [deleted] = store.media.splice(index, 1);
    try {
      await persistStore();
      await deleteStoredImage(deleted.id);
      await appendAcademyAudit(session, 'deleted', 'media', deleted.id, deleted.title);
    } catch (error) {
      store.media.splice(index, 0, deleted);
      throw error;
    }
    return NextResponse.json({ success: true, id: deleted.id });
  });
}

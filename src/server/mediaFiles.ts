import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { ApiError } from '@/lib/apiAuth';

export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;
export const MAX_MEDIA_BATCH = 10;
const MIME_TO_FORMAT = new Map<string, string>([
  ['image/jpeg', 'jpeg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function uploadDirectory() {
  return path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_UPLOAD_DIR?.trim() || path.join(process.cwd(), '.data', 'media'));
}

function filePath(id: string, variant: 'full' | 'thumb') {
  if (!/^[a-z0-9-]{1,64}$/i.test(id)) throw new ApiError(400, 'Invalid media ID.');
  return path.join(uploadDirectory(), `${id}-${variant}.webp`);
}

export async function processImageUpload(file: File, id: string) {
  const expectedFormat = MIME_TO_FORMAT.get(file.type.toLowerCase());
  if (!expectedFormat) throw new ApiError(400, 'Photos must be JPG, PNG, or WebP files.');
  if (file.size <= 0 || file.size > MAX_MEDIA_BYTES) throw new ApiError(400, 'Each photo must be 5 MB or smaller.');

  const input = Buffer.from(await file.arrayBuffer());
  try {
    const metadata = await sharp(input, { limitInputPixels: 40_000_000, failOn: 'error' }).metadata();
    if (metadata.format !== expectedFormat || !metadata.width || !metadata.height) {
      throw new ApiError(400, 'The photo content does not match its file type or is invalid.');
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'The uploaded photo could not be decoded.');
  }

  const fullPath = filePath(id, 'full');
  const thumbnailPath = filePath(id, 'thumb');
  const temporaryFull = `${fullPath}.tmp`;
  const temporaryThumb = `${thumbnailPath}.tmp`;
  await mkdir(uploadDirectory(), { recursive: true });
  try {
    const [full, thumbnail] = await Promise.all([
      sharp(input).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer(),
      sharp(input).rotate().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
    ]);
    await Promise.all([writeFile(temporaryFull, full), writeFile(temporaryThumb, thumbnail)]);
    await Promise.all([rename(temporaryFull, fullPath), rename(temporaryThumb, thumbnailPath)]);
  } catch {
    await Promise.all([rm(temporaryFull, { force: true }), rm(temporaryThumb, { force: true })]);
    throw new ApiError(500, 'The photo could not be stored. Check upload storage permissions.');
  }
  return { fullPath, thumbnailPath };
}

export async function readStoredImage(id: string, variant: 'full' | 'thumb') {
  try {
    return await readFile(filePath(id, variant));
  } catch {
    return null;
  }
}

export async function deleteStoredImage(id: string) {
  await Promise.all([
    rm(filePath(id, 'full'), { force: true }),
    rm(filePath(id, 'thumb'), { force: true }),
  ]);
}

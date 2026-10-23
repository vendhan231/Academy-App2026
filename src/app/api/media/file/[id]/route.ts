import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { getStore } from '@/server/store';
import { readStoredImage } from '@/server/mediaFiles';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH', 'STUDENT']);
    const { id } = await context.params;
    const item = getStore().media.find((media) => media.id === id);
    if (!item || (session.role === 'STUDENT' && !item.isApproved)) {
      throw new ApiError(404, 'Photo not found.');
    }
    const variant = req.nextUrl.searchParams.get('variant') === 'thumb' ? 'thumb' : 'full';
    const image = await readStoredImage(id, variant);
    if (!image) throw new ApiError(404, 'Photo file not found.');
    return new NextResponse(new Uint8Array(image), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// CORS headers — storefront calls this from the merchant's domain
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const VALID_EVENTS = new Set([
  'page_view',
  'block_interaction',
  'faq_open',
  'video_play',
  'scroll_depth',
]);

const schema = z.object({
  storeId: z.number().int().positive(),
  productId: z.number().int().positive(),
  eventType: z.string(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse('Bad Request', { status: 400, headers: CORS_HEADERS });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse('Bad Request', { status: 400, headers: CORS_HEADERS });
  }

  const { storeId, productId, eventType, metadata } = parsed.data;

  if (!VALID_EVENTS.has(eventType)) {
    return new NextResponse('OK', { status: 200, headers: CORS_HEADERS });
  }

  try {
    // Validate store exists to prevent spoofed storeId spam
    const store = await prisma.store.findUnique({
      where: { storeId },
      select: { id: true, uninstalledAt: true },
    });

    if (!store || store.uninstalledAt) {
      return new NextResponse('OK', { status: 200, headers: CORS_HEADERS });
    }

    await prisma.analyticsEvent.create({
      data: { storeId, productId, eventType, metadata: (metadata ?? {}) as object },
    });
  } catch (err) {
    console.error('[Analytics] Ingest error:', err);
    // Silent fail — don't break the storefront
  }

  return new NextResponse('OK', { status: 200, headers: CORS_HEADERS });
}

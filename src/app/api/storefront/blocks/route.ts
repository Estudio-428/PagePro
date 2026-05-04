import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeBlocksForStorefront } from '@/lib/blocks/serializer';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const storeId = Number(request.nextUrl.searchParams.get('storeId'));
  const productId = Number(request.nextUrl.searchParams.get('productId'));

  if (!Number.isInteger(storeId) || storeId <= 0 || !Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ v: 1, blocks: [] }, { headers: CORS_HEADERS });
  }

  try {
    const store = await prisma.store.findUnique({
      where: { storeId },
      select: { uninstalledAt: true, redactedAt: true },
    });

    if (!store || store.uninstalledAt || store.redactedAt) {
      return NextResponse.json({ v: 1, blocks: [] }, { headers: CORS_HEADERS });
    }

    const config = await prisma.productConfig.findUnique({
      where: { storeId_productId: { storeId, productId } },
      include: { blocks: { orderBy: { order: 'asc' } } },
    });

    if (!config?.isActive) {
      return NextResponse.json({ v: 1, blocks: [] }, { headers: CORS_HEADERS });
    }

    return new NextResponse(serializeBlocksForStorefront(config.blocks), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[Storefront Blocks] Error:', error);
    return NextResponse.json({ v: 1, blocks: [] }, { headers: CORS_HEADERS });
  }
}

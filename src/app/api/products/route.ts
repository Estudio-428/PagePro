import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { listProducts, getProduct } from '@/lib/nuvemshop/api-client';
import { prisma } from '@/lib/prisma';

// GET /api/products?page=1&per_page=50
export async function GET(request: NextRequest) {
  try {
    const storeId = await requireAuth();
    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get('page') ?? '1');
    const perPage = Math.min(Number(searchParams.get('per_page') ?? '50'), 200);
    const productId = searchParams.get('productId');

    if (productId) {
      const product = await getProduct(storeId, Number(productId));
      return NextResponse.json({ product });
    }

    const products = await listProducts(storeId, page, perPage);

    // Enriquece com status de configuração do app
    const productIds = products.map((p) => p.id);
    const configs = await prisma.productConfig.findMany({
      where: { storeId, productId: { in: productIds } },
      select: { productId: true, isActive: true, metafieldId: true },
    });
    const links = await prisma.productLink.findMany({
      where: { storeId, nuvemshopProductId: { in: productIds } },
      select: { nuvemshopProductId: true, templateId: true, template: { select: { name: true } } },
    });

    const configMap = new Map(configs.map((c) => [c.productId, c]));
    const linkMap = new Map(links.map((l) => [l.nuvemshopProductId, l]));

    const enriched = products.map((p) => ({
      ...p,
      appConfig: configMap.get(p.id) ?? null,
      templateLink: linkMap.get(p.id) ?? null,
    }));

    return NextResponse.json({ products: enriched, page, perPage });
  } catch (error: unknown) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

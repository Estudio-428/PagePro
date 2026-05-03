import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';
import { upsertProductMetafield } from '@/lib/nuvemshop/api-client';
import { serializeBlocksForStorefront } from '@/lib/blocks/serializer';
import { z } from 'zod';

const BlockSchema = z.object({
  type: z.enum(['DESCRIPTION', 'FEATURES', 'IMAGES', 'BADGES', 'TABLE', 'INFO_BOX', 'SEO_TEXT', 'VIDEO', 'FAQ', 'CUSTOM_HTML']),
  title: z.string().optional(),
  content: z.record(z.unknown()),
  order: z.number().int().min(0).default(0),
  effect: z.enum(['NONE', 'ACCORDION', 'COLLAPSE', 'TABS']).default('NONE'),
  isVisible: z.boolean().default(true),
});

// GET /api/blocks?productId=123
export async function GET(request: NextRequest) {
  try {
    const storeId = await requireAuth();
    const productId = Number(request.nextUrl.searchParams.get('productId'));

    if (!productId) {
      return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 });
    }

    const config = await prisma.productConfig.findUnique({
      where: { storeId_productId: { storeId, productId } },
      include: { blocks: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json({ config: config ?? null });
  } catch (error: unknown) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/blocks — salva todos os blocos de um produto e publica no metafield
export async function POST(request: NextRequest) {
  try {
    const storeId = await requireAuth();
    const body = await request.json();

    const { productId, productName, productHandle, blocks } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 });
    }

    // Valida todos os blocos
    const validatedBlocks = z.array(BlockSchema).parse(blocks ?? []);

    // Upsert config + recria blocos em transação
    const config = await prisma.$transaction(async (tx) => {
      const cfg = await tx.productConfig.upsert({
        where: { storeId_productId: { storeId, productId } },
        update: { productName, productHandle, updatedAt: new Date() },
        create: { storeId, productId, productName, productHandle },
      });

      // Deleta blocos antigos e recria
      await tx.block.deleteMany({ where: { productConfigId: cfg.id } });

      if (validatedBlocks.length > 0) {
        await tx.block.createMany({
          data: validatedBlocks.map((b) => ({
            productConfigId: cfg.id,
            type: b.type,
            title: b.title,
            content: b.content as Prisma.InputJsonValue,
            order: b.order,
            effect: b.effect,
            isVisible: b.isVisible,
          })),
        });
      }

      return cfg;
    });

    // Busca blocos salvos para serializar
    const savedBlocks = await prisma.block.findMany({
      where: { productConfigId: config.id },
      orderBy: { order: 'asc' },
    });

    // Serializa para o storefront e salva no metafield
    const storefrontJson = serializeBlocksForStorefront(savedBlocks);
    const metafield = await upsertProductMetafield(
      storeId,
      productId,
      storefrontJson,
      config.metafieldId ?? undefined
    );

    // Salva o metafieldId para futuras atualizações
    await prisma.productConfig.update({
      where: { id: config.id },
      data: { metafieldId: metafield.id },
    });

    return NextResponse.json({ success: true, configId: config.id, metafieldId: metafield.id });
  } catch (error: unknown) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.error('POST /api/blocks error:', error);
    return NextResponse.json({ error: 'Erro ao salvar blocos' }, { status: 500 });
  }
}

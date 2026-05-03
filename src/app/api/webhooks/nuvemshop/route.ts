import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHmac, timingSafeEqual } from 'crypto';
import { nuvemshopRequest, upsertProductMetafield, METAFIELD_NAMESPACE, METAFIELD_KEY } from '@/lib/nuvemshop/api-client';

function verifyHmac(body: Buffer, signature: string): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', process.env.NUVEMSHOP_CLIENT_SECRET!)
    .update(body)
    .digest('hex');
  try {
    return timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  } catch {
    return false;
  }
}

async function isDuplicate(storeId: number, eventKey: string): Promise<boolean> {
  try {
    await prisma.webhookEvent.create({ data: { storeId, eventKey } });
    return false;
  } catch {
    return true; // unique constraint violation = duplicado
  }
}

export async function POST(request: NextRequest) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get('x-linkedstore-hmac-sha256') ?? '';

  if (!verifyHmac(rawBody, signature)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let payload: { store_id: number; event: string; id?: number };
  try {
    payload = JSON.parse(rawBody.toString());
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const { store_id, event, id } = payload;
  const eventKey = `${event}:${id ?? 'no-id'}`;

  if (await isDuplicate(store_id, eventKey)) {
    return new NextResponse('OK', { status: 200 });
  }

  try {
    switch (event) {
      case 'app/uninstalled':
        await handleAppUninstalled(store_id);
        break;

      case 'product/created':
      case 'product/updated':
        if (id) await applyMatchingRules(store_id, id);
        break;

      case 'product/deleted':
        if (id) {
          await Promise.all([
            prisma.productLink.deleteMany({ where: { storeId: store_id, nuvemshopProductId: id } }),
            prisma.productConfig.deleteMany({ where: { storeId: store_id, productId: id } }),
          ]);
        }
        break;

      default:
        break;
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error(`[Webhook] Error processing ${event} for store ${store_id}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function handleAppUninstalled(storeId: number) {
  await prisma.$transaction([
    prisma.block.deleteMany({ where: { productConfig: { storeId } } }),
    prisma.productConfig.deleteMany({ where: { storeId } }),
    prisma.productLink.deleteMany({ where: { storeId } }),
    prisma.autoRule.deleteMany({ where: { storeId } }),
    prisma.template.deleteMany({ where: { storeId } }),
    prisma.importJob.deleteMany({ where: { storeId } }),
    prisma.analyticsEvent.deleteMany({ where: { storeId } }),
    prisma.webhookEvent.deleteMany({ where: { storeId } }),
    prisma.store.update({
      where: { storeId },
      data: { accessToken: null, uninstalledAt: new Date() },
    }),
  ]);
}

async function applyMatchingRules(storeId: number, productId: number) {
  const activeRules = await prisma.autoRule.findMany({
    where: { storeId, isActive: true },
    include: { template: true },
    orderBy: { createdAt: 'asc' },
  });

  if (activeRules.length === 0) return;

  const product = await nuvemshopRequest<Record<string, unknown>>(
    storeId,
    `/products/${productId}`
  );

  for (const rule of activeRules) {
    if (!evaluateRule(rule, product)) continue;

    try {
      const blocksJson = JSON.stringify(rule.template.blocks);

      const existingLink = await prisma.productLink.findUnique({
        where: { storeId_nuvemshopProductId: { storeId, nuvemshopProductId: productId } },
        select: { id: true },
      });

      await upsertProductMetafield(storeId, productId, blocksJson);

      const productName =
        typeof product.name === 'string'
          ? product.name
          : ((product.name as Record<string, string>)?.pt ??
             (product.name as Record<string, string>)?.es ??
             `Produto ${productId}`);

      if (existingLink) {
        await prisma.productLink.update({
          where: { storeId_nuvemshopProductId: { storeId, nuvemshopProductId: productId } },
          data: { templateId: rule.templateId, appliedAt: new Date(), appliedBy: 'rule' },
        });
      } else {
        await prisma.productLink.create({
          data: { storeId, templateId: rule.templateId, nuvemshopProductId: productId, productName, appliedBy: 'rule' },
        });
      }

      break; // primeira regra que bate ganha
    } catch (err) {
      console.error(`[Rules] Error applying rule ${rule.id} to product ${productId}:`, err);
    }
  }
}

function evaluateRule(rule: { ruleType: string; ruleValue: unknown }, product: Record<string, unknown>): boolean {
  const rv = rule.ruleValue as Record<string, unknown>;
  switch (rule.ruleType) {
    case 'category': {
      const cats = (product.categories as { id: number }[] | undefined) ?? [];
      return cats.some((c) => c.id === rv.categoryId);
    }
    case 'tag': {
      const tags = ((product.tags as string | undefined) ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      return tags.includes(rv.tag as string);
    }
    case 'price_range': {
      const price = parseFloat((product.price as string | undefined) ?? '0');
      if (rv.min !== undefined && price < (rv.min as number)) return false;
      if (rv.max !== undefined && price > (rv.max as number)) return false;
      return true;
    }
    default:
      return false;
  }
}

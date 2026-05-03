import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { METAFIELD_NAMESPACE, METAFIELD_KEY } from '@/types';

export interface WebhookPayload {
  store_id: number;
  event: string;
  id?: number;
}

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
  clientSecret: string
): boolean {
  if (!signature) return false;
  const computed = crypto.createHmac('sha256', clientSecret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

async function isDuplicate(storeId: number, eventKey: string): Promise<boolean> {
  try {
    await prisma.webhookEvent.create({ data: { storeId, eventKey } });
    return false;
  } catch {
    return true;
  }
}

export async function processWebhookPayload(payload: WebhookPayload): Promise<void> {
  const { store_id, event, id } = payload;
  const eventKey = `${event}:${id ?? 'no-id'}`;

  if (await isDuplicate(store_id, eventKey)) {
    console.log(`[Webhook] Duplicate skipped: ${eventKey} for store ${store_id}`);
    return;
  }

  console.log(`[Webhook] Processing: ${event} for store ${store_id}`);

  switch (event) {
    case 'app/uninstalled':
      await handleAppUninstalled(store_id);
      break;

    case 'product/created':
      if (id) await applyMatchingRules(store_id, id);
      break;

    case 'product/updated':
      if (id) await applyMatchingRules(store_id, id);
      break;

    case 'product/deleted':
      if (id) {
        await prisma.productLink.deleteMany({
          where: { storeId: store_id, nuvemshopProductId: id },
        });
      }
      break;

    default:
      console.log(`[Webhook] Unhandled event: ${event}`);
  }
}

/**
 * Verifica se o produto recém-criado/atualizado corresponde a alguma regra ativa
 * e aplica o template correspondente via metafield.
 */
async function applyMatchingRules(storeId: number, productId: number): Promise<void> {
  const activeRules = await prisma.autoRule.findMany({
    where: { storeId, isActive: true },
    include: { template: true },
  });

  if (activeRules.length === 0) return;

  // Busca dados frescos do produto para avaliação
  const { createAPIForStore } = await import('./api-client');
  const api = await createAPIForStore(storeId);
  const product = await api.get<any>(`/products/${productId}`);

  for (const rule of activeRules) {
    const matches = evaluateRule(rule, product);
    if (!matches) continue;

    const blocksJson = JSON.stringify(rule.template.blocks);

    try {
      await api.upsertProductMetafield(productId, {
        namespace: METAFIELD_NAMESPACE,
        key: METAFIELD_KEY,
        value: blocksJson,
        value_type: 'string',
      });

      await prisma.productLink.upsert({
        where: { storeId_nuvemshopProductId: { storeId, nuvemshopProductId: productId } },
        update: { templateId: rule.templateId, appliedAt: new Date(), appliedBy: 'rule' },
        create: {
          storeId,
          templateId: rule.templateId,
          nuvemshopProductId: productId,
          productName: typeof product.name === 'string'
            ? product.name
            : (product.name?.pt ?? product.name?.es ?? `Product ${productId}`),
          appliedBy: 'rule',
        },
      });

      console.log(`[Rules] Applied template "${rule.template.name}" to product ${productId} via rule "${rule.name}"`);
      break; // Aplica apenas a primeira regra que corresponde (prioridade de criação)
    } catch (err) {
      console.error(`[Rules] Error applying rule ${rule.id} to product ${productId}:`, err);
    }
  }
}

function evaluateRule(rule: { ruleType: string; ruleValue: any }, product: any): boolean {
  switch (rule.ruleType) {
    case 'category': {
      const categoryIds: number[] = (product.categories ?? []).map((c: any) => c.id);
      return categoryIds.includes(rule.ruleValue.categoryId);
    }
    case 'tag': {
      const tags: string[] = (product.tags ?? '')
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean);
      return tags.includes(rule.ruleValue.tag);
    }
    case 'price_range': {
      const price = parseFloat(product.price ?? '0');
      const { min, max } = rule.ruleValue;
      if (min !== undefined && price < min) return false;
      if (max !== undefined && price > max) return false;
      return true;
    }
    default:
      return false;
  }
}

async function handleAppUninstalled(storeId: number) {
  await prisma.$transaction([
    prisma.productLink.deleteMany({ where: { storeId } }),
    prisma.autoRule.deleteMany({ where: { storeId } }),
    prisma.template.deleteMany({ where: { storeId } }),
    prisma.analyticsEvent.deleteMany({ where: { storeId } }),
    prisma.webhookEvent.deleteMany({ where: { storeId } }),
    prisma.store.update({
      where: { storeId },
      data: { accessToken: null, uninstalledAt: new Date() },
    }),
  ]);
  console.log(`[Webhook] Store ${storeId} uninstalled — data cleared`);
}

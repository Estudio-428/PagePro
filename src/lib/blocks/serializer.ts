import type { Block } from '@prisma/client';

/**
 * Serializa os blocos do banco em JSON compacto para o metafield do produto.
 * Este JSON é lido pelo script de storefront (public/storefront/ppb.js).
 */
export function serializeBlocksForStorefront(blocks: Block[]): string {
  const visibleBlocks = blocks
    .filter((b) => b.isVisible)
    .map((b) => ({
      id: b.id,
      type: b.type,
      title: b.title ?? null,
      content: b.content,
      effect: b.effect,
      order: b.order,
    }));

  return JSON.stringify({ v: 1, blocks: visibleBlocks });
}

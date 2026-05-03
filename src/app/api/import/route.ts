import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';
import { upsertProductMetafield } from '@/lib/nuvemshop/api-client';
import { serializeBlocksForStorefront } from '@/lib/blocks/serializer';
import type { ImportRowError } from '@/types/blocks';

export const dynamic = 'force-dynamic';

// POST /api/import — recebe JSON pré-parseado do XLSX (parsing feito no frontend com SheetJS)
export async function POST(request: NextRequest) {
  try {
    const storeId = await requireAuth(request);
    const { fileName, rows } = await request.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Nenhuma linha válida encontrada' }, { status: 400 });
    }

    // Cria o job de importação
    const job = await prisma.importJob.create({
      data: {
        storeId,
        fileName: fileName ?? 'import.xlsx',
        totalRows: rows.length,
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    // Processa assincronamente (não bloqueia a resposta)
    processImportJob(storeId, job.id, rows).catch((err) => {
      console.error(`Import job ${job.id} failed:`, err);
      prisma.importJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', finishedAt: new Date() },
      });
    });

    return NextResponse.json({ jobId: job.id, status: 'PROCESSING' });
  } catch (error: unknown) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro ao iniciar importação' }, { status: 500 });
  }
}

// GET /api/import?jobId=123 — status do job
export async function GET(request: NextRequest) {
  try {
    const storeId = await requireAuth(request);
    const jobId = Number(request.nextUrl.searchParams.get('jobId'));

    if (!jobId) {
      // Lista jobs recentes
      const jobs = await prisma.importJob.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      return NextResponse.json({ jobs });
    }

    const job = await prisma.importJob.findFirst({
      where: { id: jobId, storeId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error: unknown) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// ---- Processamento assíncrono ----

interface ImportRow {
  rowNumber: number;
  productId: string | number;
  blockType: string;
  title?: string;
  content: string;
  order?: number;
  effect?: string;
}

const VALID_BLOCK_TYPES = [
  'DESCRIPTION', 'FEATURES', 'IMAGES', 'BADGES',
  'TABLE', 'INFO_BOX', 'SEO_TEXT', 'VIDEO', 'FAQ', 'CUSTOM_HTML',
] as const;

const VALID_EFFECTS = ['NONE', 'ACCORDION', 'COLLAPSE', 'TABS'] as const;

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function processImportJob(storeId: number, jobId: number, rows: ImportRow[]) {
  const errors: ImportRowError[] = [];
  let processed = 0;

  // Agrupa linhas por produto
  const byProduct = new Map<number, ImportRow[]>();
  for (const row of rows) {
    const pid = Number(row.productId);
    if (isNaN(pid) || pid <= 0) {
      errors.push({ row: row.rowNumber, productId: row.productId, message: 'productId inválido' });
      continue;
    }
    if (!byProduct.has(pid)) byProduct.set(pid, []);
    byProduct.get(pid)!.push(row);
  }

  // Processa produto por produto
  for (const [productId, productRows] of byProduct.entries()) {
    try {
      const blocksToCreate: {
        type: typeof VALID_BLOCK_TYPES[number];
        title?: string;
        content: object;
        order: number;
        effect: typeof VALID_EFFECTS[number];
        isVisible: boolean;
      }[] = [];

      for (const row of productRows) {
        const type = row.blockType?.toUpperCase() as typeof VALID_BLOCK_TYPES[number];
        if (!VALID_BLOCK_TYPES.includes(type)) {
          errors.push({ row: row.rowNumber, productId, message: `Tipo de bloco inválido: ${row.blockType}` });
          continue;
        }

        let content: object;
        try {
          content = typeof row.content === 'string' && row.content.trim().startsWith('{')
            ? JSON.parse(row.content)
            : { html: row.content }; // fallback: trata como HTML/texto
        } catch {
          errors.push({ row: row.rowNumber, productId, message: 'content não é JSON válido' });
          continue;
        }

        const effect = (row.effect?.toUpperCase() ?? 'NONE') as typeof VALID_EFFECTS[number];

        blocksToCreate.push({
          type,
          title: row.title,
          content,
          order: row.order ?? blocksToCreate.length,
          effect: VALID_EFFECTS.includes(effect) ? effect : 'NONE',
          isVisible: true,
        });
      }

      if (blocksToCreate.length === 0) continue;

      // Salva no banco
      const config = await prisma.$transaction(async (tx) => {
        const cfg = await tx.productConfig.upsert({
          where: { storeId_productId: { storeId, productId } },
          update: { updatedAt: new Date() },
          create: { storeId, productId },
        });

        await tx.block.deleteMany({ where: { productConfigId: cfg.id } });
        await tx.block.createMany({
          data: blocksToCreate.map((b) => ({ productConfigId: cfg.id, ...b, content: b.content as Prisma.InputJsonValue })),
        });

        return cfg;
      });

      // Publica no metafield
      const savedBlocks = await prisma.block.findMany({
        where: { productConfigId: config.id },
        orderBy: { order: 'asc' },
      });

      const json = serializeBlocksForStorefront(savedBlocks);
      const metafield = await upsertProductMetafield(
        storeId,
        productId,
        json,
        config.metafieldId ?? undefined
      );

      await prisma.productConfig.update({
        where: { id: config.id },
        data: { metafieldId: metafield.id },
      });

      processed++;
    } catch (err) {
      errors.push({
        row: productRows[0].rowNumber,
        productId,
        message: `Erro ao processar produto: ${(err as Error).message}`,
      });
    }

    // Respeita rate limit: ~2 req/s (product save + metafield = 2 requests)
    await sleep(600);

    // Atualiza progresso
    await prisma.importJob.update({
      where: { id: jobId },
      data: { processedRows: processed, errorRows: errors.length },
    });
  }

  const finalStatus =
    errors.length === 0
      ? 'COMPLETED'
      : processed === 0
      ? 'FAILED'
      : 'COMPLETED_WITH_ERRORS';

  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: finalStatus,
      processedRows: processed,
      errorRows: errors.length,
      errorsJson: errors.length > 0 ? (errors as unknown as Prisma.InputJsonValue) : undefined,
      finishedAt: new Date(),
    },
  });
}

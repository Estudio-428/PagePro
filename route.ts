import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStoreIdFromRequest } from '@/lib/auth-helpers';

/**
 * GET /api/analytics/dashboard?period=7|30|90
 *
 * Retorna:
 * - totalPageViews: total de page_views no período
 * - totalProducts: produtos com template aplicado
 * - avgScrollDepth: profundidade média de scroll
 * - faqInteractions: total de aberturas de FAQ
 * - videoPlays: total de plays de vídeo
 * - topProducts: top 10 produtos por page_views
 * - eventsByDay: distribuição de eventos por dia
 * - interactionBreakdown: breakdown por tipo de interação
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = getStoreIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') ?? '30');

    const since = new Date();
    since.setDate(since.getDate() - period);

    // Busca em paralelo para performance
    const [
      pageViews,
      interactionEvents,
      scrollEvents,
      topProductsRaw,
      eventsByDayRaw,
      totalLinked,
    ] = await Promise.all([
      // Total de page_views
      prisma.analyticsEvent.count({
        where: { storeId, eventType: 'page_view', createdAt: { gte: since } },
      }),

      // Interações por tipo (FAQ, video)
      prisma.analyticsEvent.groupBy({
        by: ['metadata'],
        where: { storeId, eventType: 'block_interaction', createdAt: { gte: since } },
        _count: { id: true },
      }),

      // Scroll depth
      prisma.analyticsEvent.findMany({
        where: { storeId, eventType: 'scroll_depth', createdAt: { gte: since } },
        select: { metadata: true },
      }),

      // Top 10 produtos por page_views
      prisma.analyticsEvent.groupBy({
        by: ['productId'],
        where: { storeId, eventType: 'page_view', createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Eventos por dia (últimos N dias)
      prisma.$queryRaw<Array<{ day: Date; event_type: string; count: bigint }>>`
        SELECT
          DATE_TRUNC('day', created_at) as day,
          event_type,
          COUNT(*) as count
        FROM analytics_events
        WHERE store_id = ${storeId}
          AND created_at >= ${since}
        GROUP BY DATE_TRUNC('day', created_at), event_type
        ORDER BY day ASC
      `,

      // Produtos com template vinculado
      prisma.productLink.count({ where: { storeId } }),
    ]);

    // Processa interações por tipo de bloco
    let faqInteractions = 0;
    let videoPlays = 0;

    interactionEvents.forEach((ev) => {
      const meta = ev.metadata as Record<string, unknown>;
      if (meta?.blockType === 'faq') faqInteractions += ev._count.id;
      if (meta?.blockType === 'video') videoPlays += ev._count.id;
    });

    // Scroll depth médio
    const scrollDepths = scrollEvents
      .map((e) => (e.metadata as Record<string, number>)?.depth ?? 0)
      .filter(Boolean);
    const avgScrollDepth = scrollDepths.length > 0
      ? Math.round(scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length)
      : 0;

    // Top produtos com nomes
    const topProductLinks = await prisma.productLink.findMany({
      where: {
        storeId,
        nuvemshopProductId: { in: topProductsRaw.map((r) => r.productId) },
      },
      select: { nuvemshopProductId: true, productName: true, template: { select: { name: true } } },
    });

    const topProducts = topProductsRaw.map((r) => {
      const link = topProductLinks.find((l) => l.nuvemshopProductId === r.productId);
      return {
        productId: r.productId,
        productName: link?.productName ?? `Produto ${r.productId}`,
        templateName: link?.template.name ?? '—',
        pageViews: r._count.id,
      };
    });

    // Eventos por dia — normaliza para estrutura simples
    const eventsByDay = buildEventsByDay(eventsByDayRaw, period);

    return NextResponse.json({
      period,
      totalPageViews: pageViews,
      totalLinkedProducts: totalLinked,
      avgScrollDepth,
      faqInteractions,
      videoPlays,
      topProducts,
      eventsByDay,
    });
  } catch (err) {
    console.error('[GET /api/analytics/dashboard]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function buildEventsByDay(
  raw: Array<{ day: Date; event_type: string; count: bigint }>,
  period: number
): Array<{ date: string; pageViews: number; interactions: number }> {
  // Gera todos os dias do período
  const days: Record<string, { pageViews: number; interactions: number }> = {};
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days[key] = { pageViews: 0, interactions: 0 };
  }

  raw.forEach((row) => {
    const key = new Date(row.day).toISOString().slice(0, 10);
    if (!days[key]) return;
    const count = Number(row.count);
    if (row.event_type === 'page_view') days[key].pageViews += count;
    else days[key].interactions += count;
  });

  return Object.entries(days).map(([date, vals]) => ({ date, ...vals }));
}

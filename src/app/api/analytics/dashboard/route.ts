import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const storeId = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const period = Math.min(parseInt(searchParams.get('period') ?? '30'), 90);

    const since = new Date();
    since.setDate(since.getDate() - period);

    const [
      pageViews,
      interactionEvents,
      scrollEvents,
      topProductsRaw,
      eventsByDayRaw,
      totalLinked,
    ] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { storeId, eventType: 'page_view', createdAt: { gte: since } },
      }),

      // block_interaction — lemos todos e agregamos no JS (metadata é Json)
      prisma.analyticsEvent.findMany({
        where: { storeId, eventType: 'block_interaction', createdAt: { gte: since } },
        select: { metadata: true },
      }),

      prisma.analyticsEvent.findMany({
        where: { storeId, eventType: 'scroll_depth', createdAt: { gte: since } },
        select: { metadata: true },
      }),

      prisma.analyticsEvent.groupBy({
        by: ['productId'],
        where: { storeId, eventType: 'page_view', createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

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

      prisma.productLink.count({ where: { storeId } }),
    ]);

    let faqInteractions = 0;
    let videoPlays = 0;

    for (const ev of interactionEvents) {
      const meta = ev.metadata as Record<string, unknown> | null;
      if (meta?.blockType === 'faq' || meta?.blockType === 'FAQ') faqInteractions++;
      if (meta?.blockType === 'video' || meta?.blockType === 'VIDEO') videoPlays++;
    }

    const scrollDepths = scrollEvents
      .map((e) => (e.metadata as Record<string, number> | null)?.depth ?? 0)
      .filter(Boolean);
    const avgScrollDepth =
      scrollDepths.length > 0
        ? Math.round(scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length)
        : 0;

    const topProductLinks = await prisma.productLink.findMany({
      where: {
        storeId,
        nuvemshopProductId: { in: topProductsRaw.map((r) => r.productId) },
      },
      select: {
        nuvemshopProductId: true,
        productName: true,
        template: { select: { name: true } },
      },
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
  } catch (err: unknown) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.error('[GET /api/analytics/dashboard]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function buildEventsByDay(
  raw: Array<{ day: Date; event_type: string; count: bigint }>,
  period: number
): Array<{ date: string; pageViews: number; interactions: number }> {
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

'use client';

import { useState } from 'react';
import {
  Box, Button, Select, Text, Title, Skeleton,
} from '@nimbus-ds/components';
import { AppShell } from '@/components/shell/AppShell';
import { useDashboard } from '@/components/analytics/useDashboard';
import { KpiCard } from '@/components/analytics/KpiCard';
import { EventsByDayChart } from '@/components/analytics/EventsByDayChart';
import { TopProductsTable } from '@/components/analytics/TopProductsTable';
import { InteractionBreakdown } from '@/components/analytics/InteractionBreakdown';
import { SnippetStatusBanner } from '@/components/analytics/SnippetStatusBanner';

const PERIODS = [
  { value: 7, label: 'Últimos 7 dias' },
  { value: 30, label: 'Últimos 30 dias' },
  { value: 90, label: 'Últimos 90 dias' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);
  const { data, loading, error, refetch } = useDashboard(period);

  const hasData = (data?.totalPageViews ?? 0) > 0;
  const maxViews = data?.topProducts?.[0]?.pageViews ?? 1;

  return (
    <AppShell>
      <Box display="flex" flexDirection="column" gap="6">

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="3">
          <Box>
            <Title as="h1">Analytics</Title>
            <Text color="neutral-textLow">
              Impacto do Página Pro nas páginas de produto da sua loja.
            </Text>
          </Box>
          <Box display="flex" gap="2" alignItems="center">
            <Select
              value={String(period)}
              onChange={(e) => setPeriod(Number(e.target.value))}
            >
              {PERIODS.map((p) => (
                <Select.Option key={p.value} value={String(p.value)} label={p.label} />
              ))}
            </Select>
            <Button appearance="neutral" size="small" onClick={refetch} disabled={loading}>
              Atualizar
            </Button>
          </Box>
        </Box>

        {/* Banner de snippet não instalado */}
        {!loading && <SnippetStatusBanner hasData={hasData} />}

        {/* KPIs */}
        <Box
          display="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}
        >
          <KpiCard
            label="Visualizações de produto"
            value={loading ? '…' : (data?.totalPageViews ?? 0).toLocaleString('pt-BR')}
            sub={`nos últimos ${period} dias`}
            color="primary"
            loading={loading}
          />
          <KpiCard
            label="Produtos com template"
            value={loading ? '…' : (data?.totalLinkedProducts ?? 0).toLocaleString('pt-BR')}
            sub="templates aplicados"
            color="success"
            loading={loading}
          />
          <KpiCard
            label="FAQ abertos"
            value={loading ? '…' : (data?.faqInteractions ?? 0).toLocaleString('pt-BR')}
            sub="cliques em perguntas"
            loading={loading}
          />
          <KpiCard
            label="Vídeos assistidos"
            value={loading ? '…' : (data?.videoPlays ?? 0).toLocaleString('pt-BR')}
            sub="plays iniciados"
            loading={loading}
          />
          <KpiCard
            label="Scroll médio"
            value={loading ? '…' : `${data?.avgScrollDepth ?? 0}%`}
            sub="profundidade média"
            color={
              (data?.avgScrollDepth ?? 0) >= 75 ? 'success' :
              (data?.avgScrollDepth ?? 0) >= 50 ? 'warning' : 'default'
            }
            loading={loading}
          />
        </Box>

        {/* Gráfico de linha */}
        {loading ? (
          <Skeleton width="100%" height="220px" borderRadius="2" />
        ) : data?.eventsByDay ? (
          <EventsByDayChart data={data.eventsByDay} />
        ) : null}

        {/* Grid inferior: interações + top produtos */}
        <Box
          display="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}
        >
          {loading ? (
            <>
              <Skeleton width="100%" height="200px" borderRadius="2" />
              <Skeleton width="100%" height="200px" borderRadius="2" />
            </>
          ) : (
            <>
              <InteractionBreakdown
                faqInteractions={data?.faqInteractions ?? 0}
                videoPlays={data?.videoPlays ?? 0}
                avgScrollDepth={data?.avgScrollDepth ?? 0}
              />
              <TopProductsTable
                products={data?.topProducts ?? []}
                maxViews={maxViews}
                loading={loading}
              />
            </>
          )}
        </Box>

        {/* Rodapé informativo */}
        <Box
          backgroundColor="neutral-surface"
          borderRadius="2"
          padding="4"
        >
          <Text fontSize="caption" color="neutral-textLow">
            📊 Os dados são coletados via snippet instalado no tema. Cada visualização de página de produto,
            abertura de FAQ, play de vídeo e profundidade de scroll é registrada automaticamente.
            Eventos chegam em tempo real e ficam disponíveis aqui.
          </Text>
        </Box>

      </Box>
    </AppShell>
  );
}

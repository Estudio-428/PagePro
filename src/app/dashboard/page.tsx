'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { fetchWithNexoAuth } from '@/lib/nexo/client';

interface DashboardData {
  period: number;
  totalPageViews: number;
  totalLinkedProducts: number;
  avgScrollDepth: number;
  faqInteractions: number;
  videoPlays: number;
  topProducts: { productId: number; productName: string; templateName: string; pageViews: number }[];
  eventsByDay: { date: string; pageViews: number; interactions: number }[];
}

const PERIODS = [
  { value: 7,  label: 'Últimos 7 dias' },
  { value: 30, label: 'Últimos 30 dias' },
  { value: 90, label: 'Últimos 90 dias' },
];

function KpiCard({ label, value, sub, color = 'blue' }: { label: string; value: string; sub: string; color?: string }) {
  const colors: Record<string, string> = {
    blue:   'bg-[#eef6ff] text-[#1b4f8a]',
    green:  'bg-[var(--green-50)] text-[var(--green)]',
    yellow: 'bg-[var(--amber-50)] text-[#8a6400]',
    gray:   'bg-[var(--surface-2)] text-[var(--muted)]',
  };
  return (
    <div className="pp-card p-5">
      <p className="mb-2 text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className={`font-display inline-block rounded px-2 py-0.5 text-2xl font-bold ${colors[color] ?? colors.gray}`}>{value}</p>
      <p className="mt-2 text-xs text-[var(--muted-2)]">{sub}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(p: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithNexoAuth(`/api/analytics/dashboard?period=${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(period); }, [period]);

  const hasData = (data?.totalPageViews ?? 0) > 0;

  return (
    <AppShell
      title="Analytics"
      subtitle="Impacto do Page Pro nas páginas de produto."
      actions={[
        { label: loading ? 'Atualizando...' : 'Atualizar', onClick: () => load(period), variant: 'ghost', disabled: loading },
      ]}
    >
        <div className="mb-6 flex justify-end">
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="pp-input h-9 px-3"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {!loading && !hasData && (
          <div className="mb-6 rounded-[10px] border border-[#f7dfaa] bg-[var(--amber-50)] p-4 text-sm font-medium text-[#8a6400]">
            Nenhum dado coletado ainda. Certifique-se de que o snippet está instalado no tema da sua loja.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label="Visualizações" value={loading ? '…' : (data?.totalPageViews ?? 0).toLocaleString('pt-BR')} sub={`últimos ${period} dias`} color="blue" />
          <KpiCard label="Produtos c/ template" value={loading ? '…' : (data?.totalLinkedProducts ?? 0).toLocaleString('pt-BR')} sub="templates aplicados" color="green" />
          <KpiCard label="FAQ abertos" value={loading ? '…' : (data?.faqInteractions ?? 0).toLocaleString('pt-BR')} sub="cliques em perguntas" />
          <KpiCard label="Vídeos assistidos" value={loading ? '…' : (data?.videoPlays ?? 0).toLocaleString('pt-BR')} sub="plays iniciados" />
          <KpiCard label="Scroll médio" value={loading ? '…' : `${data?.avgScrollDepth ?? 0}%`} sub="profundidade média" color={(data?.avgScrollDepth ?? 0) >= 50 ? 'green' : 'yellow'} />
        </div>

        {!loading && data?.topProducts && data.topProducts.length > 0 && (
          <div className="pp-card overflow-hidden">
            <div className="border-b border-[var(--line)] px-6 py-4">
              <h2 className="font-display text-lg font-bold">Top 10 produtos por visualizações</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
                <tr>
                  <th className="text-left px-6 py-3">Produto</th>
                  <th className="text-left px-6 py-3">Template</th>
                  <th className="text-right px-6 py-3">Visualizações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {data.topProducts.map((p) => (
                  <tr key={p.productId} className="hover:bg-[var(--background)]">
                    <td className="px-6 py-3 text-[var(--foreground)]">{p.productName}</td>
                    <td className="px-6 py-3 text-[var(--muted)]">{p.templateName}</td>
                    <td className="px-6 py-3 text-right font-medium">{p.pageViews.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-8 text-xs text-[var(--muted-2)]">
          Dados coletados via snippet instalado no tema. Eventos chegam em tempo real.
        </p>
    </AppShell>
  );
}

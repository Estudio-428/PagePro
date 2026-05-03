'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    gray:   'bg-gray-50 text-gray-700',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[color] ?? colors.gray} inline-block px-2 py-0.5 rounded`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-gray-900">Product Page Builder</span>
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Analytics</Link>
        <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900">Produtos</Link>
        <Link href="/import" className="text-sm text-gray-600 hover:text-gray-900">Importar</Link>
        <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">Configurações</Link>
      </div>
    </nav>
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
      const res = await fetch(`/api/analytics/dashboard?period=${p}`);
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
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Impacto do Product Page Builder nas páginas de produto.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <button
              onClick={() => load(period)}
              disabled={loading}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Atualizar
            </button>
          </div>
        </div>

        {!loading && !hasData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
            Nenhum dado coletado ainda. Certifique-se de que o snippet está instalado no tema da sua loja.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label="Visualizações" value={loading ? '…' : (data?.totalPageViews ?? 0).toLocaleString('pt-BR')} sub={`últimos ${period} dias`} color="blue" />
          <KpiCard label="Produtos c/ template" value={loading ? '…' : (data?.totalLinkedProducts ?? 0).toLocaleString('pt-BR')} sub="templates aplicados" color="green" />
          <KpiCard label="FAQ abertos" value={loading ? '…' : (data?.faqInteractions ?? 0).toLocaleString('pt-BR')} sub="cliques em perguntas" />
          <KpiCard label="Vídeos assistidos" value={loading ? '…' : (data?.videoPlays ?? 0).toLocaleString('pt-BR')} sub="plays iniciados" />
          <KpiCard label="Scroll médio" value={loading ? '…' : `${data?.avgScrollDepth ?? 0}%`} sub="profundidade média" color={(data?.avgScrollDepth ?? 0) >= 50 ? 'green' : 'yellow'} />
        </div>

        {!loading && data?.topProducts && data.topProducts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Top 10 produtos por visualizações</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-6 py-3">Produto</th>
                  <th className="text-left px-6 py-3">Template</th>
                  <th className="text-right px-6 py-3">Visualizações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.topProducts.map((p) => (
                  <tr key={p.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-900">{p.productName}</td>
                    <td className="px-6 py-3 text-gray-500">{p.templateName}</td>
                    <td className="px-6 py-3 text-right font-medium">{p.pageViews.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-8">
          Dados coletados via snippet instalado no tema. Eventos chegam em tempo real.
        </p>
      </main>
    </div>
  );
}

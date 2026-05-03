'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { fetchWithNexoAuth } from '@/lib/nexo/client';

interface Product {
  id: number;
  name: Record<string, string>;
  images: { src: string }[];
  appConfig: { isActive: boolean; metafieldId: number | null } | null;
  templateLink: { templateId: number; template: { name: string } } | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchWithNexoAuth(`/api/products?page=${page}&per_page=50`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setProducts(d.products ?? []))
      .catch(() => {
        setProducts([]);
        setError('Não foi possível carregar os produtos.');
      })
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = products.filter((p) => {
    const name = p.name?.pt ?? p.name?.es ?? Object.values(p.name)[0] ?? '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AppShell
      title="Produtos"
      subtitle="Escolha um produto para editar e publicar blocos personalizados."
      actions={[{ label: 'Importar em massa', href: '/import' }]}
    >
        <div className="mb-4 flex items-center justify-between gap-4">
          <input
            type="search"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pp-input h-10 w-full max-w-sm px-3"
          />
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
            Página {page}
          </span>
        </div>

        {loading ? (
          <div className="pp-card py-12 text-center text-[var(--muted)]">Carregando produtos...</div>
        ) : error ? (
          <div className="rounded-[10px] border border-red-200 bg-red-50 px-6 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : (
          <div className="pp-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
                <tr>
                  <th className="text-left px-6 py-3">Produto</th>
                  <th className="text-left px-6 py-3">Template</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filtered.map((p) => {
                  const name = p.name?.pt ?? p.name?.es ?? Object.values(p.name)[0] ?? `Produto ${p.id}`;
                  return (
                    <tr key={p.id} className="hover:bg-[var(--background)]">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] && (
                            <img src={p.images[0].src} alt="" className="w-10 h-10 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-bold text-[var(--foreground)]">{name}</p>
                            <p className="text-xs text-[var(--muted-2)]">ID: {p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[var(--muted)]">
                        {p.templateLink?.template.name ?? '—'}
                      </td>
                      <td className="px-6 py-3">
                        {p.appConfig?.isActive ? (
                          <span className="inline-block rounded-full bg-[var(--green-50)] px-2 py-0.5 text-xs font-bold text-[var(--green)]">Ativo</span>
                        ) : (
                          <span className="inline-block rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-bold text-[var(--muted)]">Sem config</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          href={`/editor?productId=${p.id}&productName=${encodeURIComponent(name)}`}
                          className="text-sm font-bold text-[var(--pink)] hover:text-[var(--pink-deep)]"
                        >
                          Editar blocos
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[var(--muted)]">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="pp-btn pp-btn-ghost disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm font-semibold text-[var(--muted)]">Página {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={products.length < 50}
            className="pp-btn pp-btn-ghost disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
    </AppShell>
  );
}

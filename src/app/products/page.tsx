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
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setAuthError(false);
    fetchWithNexoAuth(`/api/products?page=${page}&per_page=50`)
      .then((r) => {
        if (!r.ok) {
          const error = new Error(`HTTP ${r.status}`);
          error.name = String(r.status);
          throw error;
        }
        return r.json();
      })
      .then((d) => setProducts(d.products ?? []))
      .catch((err) => {
        setProducts([]);
        if (err?.name === '401') {
          setAuthError(true);
          setError('Abra o Page Pro pelo painel admin da Nuvemshop para carregar os produtos da loja.');
          return;
        }
        setError('Não foi possível carregar os produtos. Recarregue a página ou tente novamente pelo painel admin.');
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
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm">
          <input
            type="search"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pp-input h-11 w-full max-w-xl px-4"
          />
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
            Página {page}
          </span>
        </div>

        {loading ? (
          <div className="pp-card py-12 text-center text-[var(--muted)]">Carregando produtos...</div>
        ) : error ? (
          <div className={`rounded-lg border px-6 py-5 text-sm font-medium ${
            authError ? 'border-[var(--amber)] bg-[var(--amber-50)] text-[#7a5200]' : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            <p className="font-bold">{authError ? 'Sessão local sem autenticação' : 'Falha ao carregar produtos'}</p>
            <p className="mt-1 max-w-[70ch]">{error}</p>
            {authError && (
              <Link
                href="/editor?productId=295914599&productName=Refletor%20LED%2030W"
                className="pp-btn pp-btn-ghost mt-4"
              >
                Abrir produto de teste
              </Link>
            )}
          </div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div className="pp-card px-6 py-12 text-center text-[var(--muted)]">
                Nenhum produto encontrado.
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                {filtered.map((p) => {
                  const name = p.name?.pt ?? p.name?.es ?? Object.values(p.name)[0] ?? `Produto ${p.id}`;
                  const active = Boolean(p.appConfig?.isActive);
                  return (
                    <article key={p.id} className="pp-card flex min-h-[220px] flex-col overflow-hidden p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-2)]">
                          {p.images?.[0] ? (
                            <img src={p.images[0].src} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-[var(--muted-2)]">PP</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="line-clamp-2 text-[15px] font-extrabold leading-snug text-[var(--foreground)]">{name}</h2>
                          <p className="mt-1 text-xs text-[var(--muted-2)]">Produto {p.id}</p>
                        </div>
                        {active ? (
                          <span className="shrink-0 rounded-full bg-[var(--green-50)] px-2 py-0.5 text-xs font-bold text-[var(--green)]">Ativo</span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-bold text-[var(--muted)]">Novo</span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[var(--muted)]">
                        <span className="rounded-md border border-[var(--line)] px-2 py-1">
                          {p.templateLink?.template.name ?? 'Sem template'}
                        </span>
                        {p.appConfig?.metafieldId && (
                          <span className="rounded-md border border-[var(--line)] px-2 py-1">Publicado</span>
                        )}
                      </div>

                      <p className="mt-4 flex-1 text-sm leading-6 text-[var(--muted)]">
                        Edite descrições, imagens, selos, tabelas e FAQs com pré-visualização da página do produto.
                      </p>

                      <Link
                        href={`/editor?productId=${p.id}&productName=${encodeURIComponent(name)}`}
                        className="pp-btn pp-btn-ghost mt-4 w-full"
                      >
                        Entrar
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </>
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

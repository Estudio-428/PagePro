'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithNexoAuth } from '@/lib/nexo/client';

interface Product {
  id: number;
  name: Record<string, string>;
  images: { src: string }[];
  appConfig: { isActive: boolean; metafieldId: number | null } | null;
  templateLink: { templateId: number; template: { name: string } } | null;
}

function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
      <span className="font-semibold text-gray-900">Page Pro</span>
      <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Analytics</Link>
      <Link href="/products" className="text-sm text-blue-600 font-medium">Produtos</Link>
      <Link href="/import" className="text-sm text-gray-600 hover:text-gray-900">Importar</Link>
      <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">Configurações</Link>
    </nav>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchWithNexoAuth(`/api/products?page=${page}&per_page=50`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = products.filter((p) => {
    const name = p.name?.pt ?? p.name?.es ?? Object.values(p.name)[0] ?? '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <Link
            href="/import"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Importar em massa
          </Link>
        </div>

        <div className="mb-4">
          <input
            type="search"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando produtos...</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-6 py-3">Produto</th>
                  <th className="text-left px-6 py-3">Template</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const name = p.name?.pt ?? p.name?.es ?? Object.values(p.name)[0] ?? `Produto ${p.id}`;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] && (
                            <img src={p.images[0].src} alt="" className="w-10 h-10 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{name}</p>
                            <p className="text-xs text-gray-400">ID: {p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {p.templateLink?.template.name ?? '—'}
                      </td>
                      <td className="px-6 py-3">
                        {p.appConfig?.isActive ? (
                          <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Ativo</span>
                        ) : (
                          <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">Sem config</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          href={`/editor?productId=${p.id}&productName=${encodeURIComponent(name)}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Editar blocos
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
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
            className="text-sm px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">Página {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={products.length < 50}
            className="text-sm px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Próxima
          </button>
        </div>
      </main>
    </div>
  );
}

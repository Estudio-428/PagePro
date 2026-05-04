'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { BlockEditor } from '@/components/editor/BlockEditor';
import type { ProductPreviewData } from '@/components/editor/ProductPagePreview';
import type { BlockType, BlockEffect } from '@/types/blocks';
import { fetchWithNexoAuth } from '@/lib/nexo/client';

interface BlockData {
  id?: number;
  type: BlockType;
  title?: string;
  content: Record<string, unknown>;
  order: number;
  effect: BlockEffect;
  isVisible: boolean;
}

function EditorContent() {
  const params = useSearchParams();
  const productId = Number(params.get('productId'));
  const productNameFromQuery = params.get('productName') ?? `Produto ${productId}`;

  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [product, setProduct] = useState<ProductPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetchWithNexoAuth(`/api/blocks?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.config?.blocks) setBlocks(d.config.blocks);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    setProductLoading(true);
    fetchWithNexoAuth(`/api/products?productId=${productId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.product) setProduct(d.product);
      })
      .catch(() => setProduct(null))
      .finally(() => setProductLoading(false));
  }, [productId]);

  const localizedProductName = (() => {
    const name = product?.name;
    if (!name) return productNameFromQuery;
    if (typeof name === 'string') return name;
    return name.pt ?? name.es ?? Object.values(name)[0] ?? productNameFromQuery;
  })();

  const productHandle = (() => {
    const handle = (product as { handle?: Record<string, string> | string } | null)?.handle;
    if (!handle) return undefined;
    if (typeof handle === 'string') return handle;
    return handle.pt ?? handle.es ?? Object.values(handle)[0];
  })();

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetchWithNexoAuth('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productName: localizedProductName, productHandle, blocks }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (!productId) {
    return (
      <AppShell title="Editor" subtitle="Selecione um produto para editar seus blocos.">
        <div className="pp-card p-8 text-sm text-[var(--muted)]">
          Selecione um produto em <Link href="/products" className="font-bold text-[var(--pink)] hover:text-[var(--pink-deep)]">Produtos</Link>.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={localizedProductName}
      subtitle={`ID: ${productId}`}
      eyebrow="Produtos"
      showPageHeader={false}
      contentClassName="flex h-full flex-col p-0"
      actions={[
        { label: 'Voltar para produtos', href: '/products', variant: 'ghost' },
        { label: saving ? 'Salvando...' : saved ? 'Salvo' : 'Salvar e publicar', onClick: handleSave, disabled: saving },
      ]}
    >
      <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--line)] bg-white px-5">
        <div>
          <p className="font-display text-lg font-bold">{localizedProductName}</p>
          <p className="text-xs text-[var(--muted-2)]">{productLoading ? 'Carregando produto...' : `Produto ${productId}`}</p>
        </div>
        {saved && <span className="rounded-full bg-[var(--green-50)] px-3 py-1 text-xs font-bold text-[var(--green)]">Publicado</span>}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-[var(--muted)]">Carregando...</div>
      ) : (
        <BlockEditor
          blocks={blocks}
          onChange={setBlocks}
          productId={productId}
          productName={localizedProductName}
          product={product}
        />
      )}
    </AppShell>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Carregando editor...</div>}>
      <EditorContent />
    </Suspense>
  );
}

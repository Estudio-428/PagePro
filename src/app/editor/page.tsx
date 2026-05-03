'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlockEditor } from '@/components/editor/BlockEditor';
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
  const router = useRouter();
  const productId = Number(params.get('productId'));
  const productName = params.get('productName') ?? `Produto ${productId}`;

  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!productId) return;
    fetchWithNexoAuth(`/api/blocks?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.config?.blocks) setBlocks(d.config.blocks);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetchWithNexoAuth('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productName, blocks }),
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Selecione um produto em <Link href="/products" className="text-blue-600 hover:underline">Produtos</Link>.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700">← Produtos</Link>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{productName}</p>
            <p className="text-xs text-gray-400">ID: {productId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">✓ Salvo</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar e publicar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">Carregando...</div>
      ) : (
        <BlockEditor blocks={blocks} onChange={setBlocks} />
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Carregando editor...</div>}>
      <EditorContent />
    </Suspense>
  );
}

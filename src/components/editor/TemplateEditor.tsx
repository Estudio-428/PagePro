'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlockEditor } from './BlockEditor';
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

interface TemplateEditorProps {
  templateId?: number;
  initialName?: string;
  initialBlocks?: BlockData[];
}

export function TemplateEditor({ templateId, initialName = '', initialBlocks = [] }: TemplateEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [blocks, setBlocks] = useState<BlockData[]>(initialBlocks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) { setError('Dê um nome ao template antes de salvar.'); return; }
    setError(null);
    setSaving(true);

    try {
      const method = templateId ? 'PUT' : 'POST';
      const url = templateId ? `/api/templates?id=${templateId}` : '/api/templates';

      const res = await fetchWithNexoAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, blocks }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push('/products');
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← Voltar</button>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do template (ex: Eletrônicos Premium)"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <span className="text-xs text-gray-400">{blocks.length} bloco{blocks.length !== 1 ? 's' : ''}</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar template'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden flex">
        <BlockEditor blocks={blocks} onChange={setBlocks} />
      </div>
    </div>
  );
}

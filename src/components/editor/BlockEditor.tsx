'use client';

import { useState } from 'react';
import type { BlockType, BlockEffect } from '@/types/blocks';
import { BlockConfigPanel } from './BlockConfigPanel';

interface BlockData {
  id?: number;
  type: BlockType;
  title?: string;
  content: Record<string, unknown>;
  order: number;
  effect: BlockEffect;
  isVisible: boolean;
}

const BLOCK_TYPES: { type: BlockType; label: string; emoji: string }[] = [
  { type: 'DESCRIPTION',  label: 'Descrição',      emoji: '📝' },
  { type: 'FEATURES',     label: 'Características', emoji: '✅' },
  { type: 'IMAGES',       label: 'Imagens',         emoji: '🖼️' },
  { type: 'BADGES',       label: 'Selos',           emoji: '🏅' },
  { type: 'TABLE',        label: 'Tabela',          emoji: '📊' },
  { type: 'INFO_BOX',     label: 'Caixa info',      emoji: 'ℹ️' },
  { type: 'SEO_TEXT',     label: 'Texto SEO',       emoji: '🔍' },
  { type: 'VIDEO',        label: 'Vídeo',           emoji: '▶️' },
  { type: 'FAQ',          label: 'FAQ',             emoji: '❓' },
  { type: 'CUSTOM_HTML',  label: 'HTML livre',      emoji: '</>' },
];

function defaultContent(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'DESCRIPTION':  return { html: '' };
    case 'FEATURES':     return { items: [], columns: 1 };
    case 'IMAGES':       return { items: [], layout: 'grid' };
    case 'BADGES':       return { items: [], layout: 'row' };
    case 'TABLE':        return { rows: [], striped: false };
    case 'INFO_BOX':     return { text: '', style: 'info' };
    case 'SEO_TEXT':     return { text: '', displayMode: 'collapsed' };
    case 'VIDEO':        return { url: '' };
    case 'FAQ':          return { items: [] };
    case 'CUSTOM_HTML':  return { html: '' };
    default:             return {};
  }
}

interface BlockEditorProps {
  blocks: BlockData[];
  onChange: (blocks: BlockData[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  function addBlock(type: BlockType) {
    const newBlock: BlockData = {
      type,
      content: defaultContent(type),
      order: blocks.length,
      effect: 'NONE',
      isVisible: true,
    };
    const next = [...blocks, newBlock];
    onChange(next);
    setSelectedIdx(next.length - 1);
  }

  function removeBlock(idx: number) {
    const next = blocks.filter((_, i) => i !== idx).map((b, i) => ({ ...b, order: i }));
    onChange(next);
    setSelectedIdx(null);
  }

  function moveBlock(idx: number, dir: 'up' | 'down') {
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next.map((b, i) => ({ ...b, order: i })));
    setSelectedIdx(target);
  }

  function updateBlock(idx: number, partial: Partial<BlockData>) {
    const next = blocks.map((b, i) => (i === idx ? { ...b, ...partial } : b));
    onChange(next);
  }

  const selected = selectedIdx !== null ? blocks[selectedIdx] : null;

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Paleta */}
      <div className="w-48 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase px-4 pt-4 pb-2">Blocos</p>
        {BLOCK_TYPES.map((bt) => (
          <button
            key={bt.type}
            onClick={() => addBlock(bt.type)}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
          >
            <span>{bt.emoji}</span>
            <span>{bt.label}</span>
          </button>
        ))}
      </div>

      {/* Lista de blocos */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4" onClick={() => setSelectedIdx(null)}>
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Ordem dos blocos ({blocks.length})</p>
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm">Clique em um bloco à esquerda para adicionar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...blocks].sort((a, b) => a.order - b.order).map((block, idx) => {
              const bt = BLOCK_TYPES.find((b) => b.type === block.type);
              return (
                <div
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setSelectedIdx(idx); }}
                  className={`bg-white rounded-lg border px-4 py-3 flex items-center gap-3 cursor-pointer transition ${
                    selectedIdx === idx ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>{bt?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{block.title || bt?.label}</p>
                    <p className="text-xs text-gray-400">{bt?.label} · {block.effect}</p>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => moveBlock(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">↑</button>
                    <button onClick={() => moveBlock(idx, 'down')} disabled={idx === blocks.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">↓</button>
                    <button onClick={() => removeBlock(idx)} className="p-1 text-red-400 hover:text-red-600">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Painel de configuração */}
      <div className="w-72 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
        {selected !== null && selectedIdx !== null ? (
          <BlockConfigPanel
            block={selected}
            onUpdate={(partial) => updateBlock(selectedIdx, partial)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
            <p className="text-3xl mb-2">🎛️</p>
            <p className="text-sm text-center px-6">Selecione um bloco para configurar</p>
          </div>
        )}
      </div>
    </div>
  );
}

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

const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: 'DESCRIPTION',  label: 'Descrição',       icon: 'text' },
  { type: 'FEATURES',     label: 'Características', icon: 'check' },
  { type: 'IMAGES',       label: 'Imagens',         icon: 'image' },
  { type: 'BADGES',       label: 'Selos',           icon: 'badge' },
  { type: 'TABLE',        label: 'Tabela',          icon: 'table' },
  { type: 'INFO_BOX',     label: 'Caixa info',      icon: 'info' },
  { type: 'SEO_TEXT',     label: 'Texto SEO',       icon: 'search' },
  { type: 'VIDEO',        label: 'Vídeo',           icon: 'play' },
  { type: 'FAQ',          label: 'FAQ',             icon: 'help' },
  { type: 'CUSTOM_HTML',  label: 'HTML livre',      icon: 'code' },
];

function Icon({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'text':
      return <svg {...common}><path d="M5 6h14M5 12h10M5 18h7" /></svg>;
    case 'check':
      return <svg {...common}><path d="M20 6 9 17l-5-5" /></svg>;
    case 'image':
      return <svg {...common}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="m8 15 3-3 3 3 2-2 4 4" /><circle cx="9" cy="9" r="1" /></svg>;
    case 'badge':
      return <svg {...common}><path d="M12 3 9.7 7.7 4.5 8.5l3.8 3.7-.9 5.3L12 15l4.6 2.5-.9-5.3 3.8-3.7-5.2-.8L12 3Z" /></svg>;
    case 'table':
      return <svg {...common}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 11h16M10 5v14" /></svg>;
    case 'info':
      return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 16v-4M12 8h.01" /></svg>;
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>;
    case 'play':
      return <svg {...common}><path d="m9 7 8 5-8 5V7Z" /></svg>;
    case 'help':
      return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M9.8 9a2.3 2.3 0 1 1 3.4 2c-.8.5-1.2 1-1.2 2M12 17h.01" /></svg>;
    case 'code':
      return <svg {...common}><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" /></svg>;
    case 'box':
      return <svg {...common}><path d="M12 3 4 7l8 4 8-4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></svg>;
    case 'settings':
      return <svg {...common}><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /><path d="M3 12h2M19 12h2M12 3v2M12 19v2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

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
            <Icon name={bt.icon} />
            <span>{bt.label}</span>
          </button>
        ))}
      </div>

      {/* Lista de blocos */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4" onClick={() => setSelectedIdx(null)}>
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Ordem dos blocos ({blocks.length})</p>
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Icon name="box" className="h-10 w-10 mb-3" />
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
                  <span className="text-blue-700"><Icon name={bt?.icon ?? 'text'} /></span>
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
            <Icon name="settings" className="h-8 w-8 mb-2" />
            <p className="text-sm text-center px-6">Selecione um bloco para configurar</p>
          </div>
        )}
      </div>
    </div>
  );
}

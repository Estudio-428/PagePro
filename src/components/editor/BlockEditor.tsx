'use client';

import { useState } from 'react';
import type { BlockType, BlockEffect } from '@/types/blocks';
import { BlockConfigPanel } from './BlockConfigPanel';
import { ProductPagePreview, type ProductPreviewData } from './ProductPagePreview';

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
  productId?: number;
  productName?: string;
  product?: ProductPreviewData | null;
}

export function BlockEditor({ blocks, onChange, productId = 0, productName = 'Produto de exemplo', product }: BlockEditorProps) {
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
  const orderedBlocks = blocks
    .map((block, index) => ({ block, index }))
    .sort((a, b) => a.block.order - b.block.order);

  return (
    <div className="grid h-full flex-1 grid-cols-[360px_minmax(460px,1fr)_292px] overflow-hidden">
      <div className="flex min-w-0 flex-col border-r border-[var(--line)] bg-white">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--line)] px-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--pink-50)] text-[var(--pink)]">
            <Icon name="settings" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-[16px] font-bold">Customizar produto</p>
            <p className="text-xs text-[var(--muted)]">{blocks.length} blocos configurados</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <details className="border-b border-[var(--line)]" open>
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-bold">
              Adicionar bloco
              <span className="text-[var(--muted-2)]">+</span>
            </summary>
            <div className="grid grid-cols-2 gap-2 px-5 pb-5">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.type}
                  type="button"
                  onClick={() => addBlock(bt.type)}
                  className="flex min-h-[66px] flex-col items-start justify-between rounded-lg border border-[var(--line)] bg-white p-3 text-left text-[12px] font-bold text-[var(--foreground)] transition hover:border-[var(--pink)] hover:bg-[var(--pink-50)] hover:text-[var(--pink)]"
                >
                  <Icon name={bt.icon} />
                  <span>{bt.label}</span>
                </button>
              ))}
            </div>
          </details>

          <details className="border-b border-[var(--line)]" open>
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-bold">
              Ordem dos blocos
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--muted)]">{blocks.length}</span>
            </summary>
            <div className="px-5 pb-5" onClick={() => setSelectedIdx(null)}>
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] py-12 text-[var(--muted-2)]">
                  <Icon name="box" className="mb-3 h-9 w-9" />
                  <p className="max-w-[200px] text-center text-sm">Clique em um bloco acima para começar.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orderedBlocks.map(({ block, index }) => {
                    const bt = BLOCK_TYPES.find((b) => b.type === block.type);
                    return (
                      <div
                        key={`${block.id ?? 'new'}-${index}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedIdx(index); }}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-3 transition ${
                          selectedIdx === index ? 'border-[var(--pink)] shadow-sm' : 'border-[var(--line)] hover:border-[var(--line-strong)]'
                        }`}
                      >
                        <span className="text-[var(--pink)]"><Icon name={bt?.icon ?? 'text'} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[var(--foreground)]">{block.title || bt?.label}</p>
                          <p className="text-xs text-[var(--muted-2)]">{bt?.label} · {block.isVisible ? 'Visível' : 'Oculto'}</p>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button type="button" onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="grid h-7 w-7 place-items-center rounded text-[var(--muted-2)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-30" aria-label="Mover para cima">↑</button>
                          <button type="button" onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="grid h-7 w-7 place-items-center rounded text-[var(--muted-2)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-30" aria-label="Mover para baixo">↓</button>
                          <button type="button" onClick={() => removeBlock(index)} className="grid h-7 w-7 place-items-center rounded text-red-400 hover:bg-red-50 hover:text-red-600" aria-label="Remover bloco">×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </details>

          <details className="border-b border-[var(--line)]" open>
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-bold">
              Configurar bloco
              <span className="text-[var(--muted-2)]">{selected ? 'editando' : 'selecione'}</span>
            </summary>
            {selected !== null && selectedIdx !== null ? (
              <BlockConfigPanel
                block={selected}
                onUpdate={(partial) => updateBlock(selectedIdx, partial)}
              />
            ) : (
              <div className="px-5 pb-5">
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] py-12 text-gray-400">
                  <Icon name="settings" className="mb-3 h-8 w-8" />
                  <p className="max-w-[220px] text-center text-sm">Selecione um bloco na ordem para abrir as configurações.</p>
                </div>
              </div>
            )}
          </details>
        </div>
      </div>

      <ProductPagePreview productId={productId} productName={productName} product={product} blocks={blocks} />

      <EditorAssistPanel blocks={blocks} selected={selected} />
    </div>
  );
}

function EditorAssistPanel({ blocks, selected }: { blocks: BlockData[]; selected: BlockData | null }) {
  const visibleCount = blocks.filter((block) => block.isVisible).length;
  const hiddenCount = blocks.length - visibleCount;
  const selectedType = selected ? BLOCK_TYPES.find((blockType) => blockType.type === selected.type)?.label : null;

  return (
    <aside className="flex min-w-0 flex-col border-l border-[var(--line)] bg-white">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--line)] px-5">
        <div>
          <p className="font-display text-[16px] font-bold">Ajuda</p>
          <p className="text-xs text-[var(--muted)]">Page Pro</p>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--sidebar)] text-white">
          <Icon name="help" />
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <p className="text-sm font-bold">Fluxo recomendado</p>
          <div className="mt-3 space-y-3 text-sm text-[var(--muted)]">
            <StatusLine done={blocks.length > 0} label="Adicionar blocos" />
            <StatusLine done={visibleCount > 0} label="Manter blocos visíveis" />
            <StatusLine done={Boolean(selected)} label="Configurar conteúdo" />
            <StatusLine done={blocks.length > 0} label="Salvar e publicar" />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-[var(--line)] p-4">
          <p className="text-sm font-bold">Resumo</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[var(--muted)]">Blocos</dt>
              <dd className="font-bold">{blocks.length}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--muted)]">Visíveis</dt>
              <dd className="font-bold text-[var(--green)]">{visibleCount}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--muted)]">Ocultos</dt>
              <dd className="font-bold text-[var(--muted)]">{hiddenCount}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-4 rounded-lg border border-[var(--line)] p-4">
          <p className="text-sm font-bold">{selectedType ? `Editando ${selectedType}` : 'Nenhum bloco selecionado'}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {selectedType
              ? 'As alterações aparecem no preview central antes de publicar na loja.'
              : 'Escolha um bloco na coluna da esquerda para editar textos, imagens, selos e efeitos.'}
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
          Use os ícones de desktop e mobile no preview para validar como o bloco vai aparecer nos dois tamanhos.
        </div>
      </div>
    </aside>
  );
}

function StatusLine({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${done ? 'bg-[var(--green)] text-white' : 'bg-white text-[var(--muted-2)]'}`}>
        {done ? <Icon name="check" className="h-3 w-3" /> : null}
      </span>
      <span>{label}</span>
    </div>
  );
}

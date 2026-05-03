'use client';

import type { BlockType, BlockEffect } from '@/types/blocks';

interface BlockData {
  type: BlockType;
  title?: string;
  content: Record<string, unknown>;
  order: number;
  effect: BlockEffect;
  isVisible: boolean;
}

interface BlockConfigPanelProps {
  block: BlockData;
  onUpdate: (partial: Partial<BlockData>) => void;
}

const EFFECTS: { value: BlockEffect; label: string }[] = [
  { value: 'NONE',      label: 'Sempre visível' },
  { value: 'ACCORDION', label: 'Sanfona (accordion)' },
  { value: 'COLLAPSE',  label: 'Ver mais / Ver menos' },
  { value: 'TABS',      label: 'Abas (tabs)' },
];

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-gray-600 mb-1">{children}</p>;
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
    />
  );
}

export function BlockConfigPanel({ block, onUpdate }: BlockConfigPanelProps) {
  const updateContent = (partial: Record<string, unknown>) =>
    onUpdate({ content: { ...block.content, ...partial } });

  return (
    <div className="p-4">
      <p className="text-xs font-bold text-gray-400 uppercase mb-4">Configurar bloco</p>

      {/* Título e efeito — comuns a todos */}
      <Field>
        <Label>Título do bloco</Label>
        <TextInput value={block.title ?? ''} onChange={(v) => onUpdate({ title: v })} placeholder="Título (opcional)" />
      </Field>

      <Field>
        <Label>Efeito visual</Label>
        <select
          value={block.effect}
          onChange={(e) => onUpdate({ effect: e.target.value as BlockEffect })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {EFFECTS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </Field>

      <Field>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={block.isVisible}
            onChange={(e) => onUpdate({ isVisible: e.target.checked })}
            className="rounded"
          />
          Visível na loja
        </label>
      </Field>

      <hr className="border-gray-200 my-4" />

      {/* Configuração específica por tipo */}
      {block.type === 'DESCRIPTION' && (
        <Field>
          <Label>Conteúdo HTML</Label>
          <TextArea value={(block.content.html as string) ?? ''} onChange={(v) => updateContent({ html: v })} placeholder="<p>Descrição...</p>" rows={8} />
          <p className="text-xs text-gray-400 mt-1">Suporte a HTML básico: p, strong, em, ul, li.</p>
        </Field>
      )}

      {block.type === 'VIDEO' && (
        <>
          <Field>
            <Label>URL do vídeo (YouTube ou Vimeo)</Label>
            <TextInput value={(block.content.url as string) ?? ''} onChange={(v) => updateContent({ url: v })} placeholder="https://youtube.com/watch?v=..." />
          </Field>
          <Field>
            <Label>Título do vídeo</Label>
            <TextInput value={(block.content.title as string) ?? ''} onChange={(v) => updateContent({ title: v })} placeholder="Título" />
          </Field>
        </>
      )}

      {block.type === 'FAQ' && (
        <FaqEditor items={(block.content.items as { question: string; answer: string }[]) ?? []} onChange={(items) => updateContent({ items })} />
      )}

      {block.type === 'TABLE' && (
        <TableEditor rows={(block.content.rows as { label: string; value: string }[]) ?? []} onChange={(rows) => updateContent({ rows })} />
      )}

      {block.type === 'FEATURES' && (
        <FeaturesEditor items={(block.content.items as { text: string; icon?: string }[]) ?? []} columns={(block.content.columns as number) ?? 1} onChange={(p) => updateContent(p)} />
      )}

      {block.type === 'INFO_BOX' && (
        <>
          <Field>
            <Label>Texto</Label>
            <TextArea value={(block.content.text as string) ?? ''} onChange={(v) => updateContent({ text: v })} placeholder="Conteúdo da caixa de informação" />
          </Field>
          <Field>
            <Label>Estilo</Label>
            <select value={(block.content.style as string) ?? 'info'} onChange={(e) => updateContent({ style: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="info">Informação</option>
              <option value="success">Sucesso</option>
              <option value="warning">Atenção</option>
              <option value="tip">Dica</option>
            </select>
          </Field>
        </>
      )}

      {block.type === 'SEO_TEXT' && (
        <>
          <Field>
            <Label>Texto SEO</Label>
            <TextArea value={(block.content.text as string) ?? ''} onChange={(v) => updateContent({ text: v })} placeholder="Texto otimizado para SEO..." rows={6} />
          </Field>
          <Field>
            <Label>Modo de exibição</Label>
            <select value={(block.content.displayMode as string) ?? 'collapsed'} onChange={(e) => updateContent({ displayMode: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="collapsed">Ver mais / menos</option>
              <option value="hidden">Oculto (só DOM)</option>
            </select>
          </Field>
        </>
      )}

      {block.type === 'CUSTOM_HTML' && (
        <Field>
          <Label>HTML livre</Label>
          <TextArea value={(block.content.html as string) ?? ''} onChange={(v) => updateContent({ html: v })} placeholder="<div>...</div>" rows={10} />
          <p className="text-xs text-gray-400 mt-1">Atenção: HTML não sanitizado. Responsabilidade do lojista.</p>
        </Field>
      )}

      {block.type === 'BADGES' && (
        <BadgesEditor items={(block.content.items as { label: string; icon?: string; color?: string }[]) ?? []} onChange={(items) => updateContent({ items })} />
      )}
    </div>
  );
}

// --- Sub-editores ---

function FaqEditor({ items, onChange }: { items: { question: string; answer: string }[]; onChange: (items: { question: string; answer: string }[]) => void }) {
  return (
    <div>
      <Label>Perguntas e respostas</Label>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium text-gray-500">Pergunta {i + 1}</p>
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-xs text-red-400 hover:text-red-600">Remover</button>
            </div>
            <input type="text" value={item.question} onChange={(e) => onChange(items.map((x, j) => j === i ? { ...x, question: e.target.value } : x))} placeholder="Pergunta..." className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
            <textarea value={item.answer} onChange={(e) => onChange(items.map((x, j) => j === i ? { ...x, answer: e.target.value } : x))} placeholder="Resposta..." rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm resize-y" />
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...items, { question: '', answer: '' }])} className="mt-2 text-sm text-blue-600 hover:underline">+ Adicionar pergunta</button>
    </div>
  );
}

function TableEditor({ rows, onChange }: { rows: { label: string; value: string }[]; onChange: (rows: { label: string; value: string }[]) => void }) {
  return (
    <div>
      <Label>Linhas da tabela</Label>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input type="text" value={row.label} onChange={(e) => onChange(rows.map((r, j) => j === i ? { ...r, label: e.target.value } : r))} placeholder="Atributo" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" />
            <input type="text" value={row.value} onChange={(e) => onChange(rows.map((r, j) => j === i ? { ...r, value: e.target.value } : r))} placeholder="Valor" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" />
            <button onClick={() => onChange(rows.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-sm">✕</button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...rows, { label: '', value: '' }])} className="mt-2 text-sm text-blue-600 hover:underline">+ Adicionar linha</button>
    </div>
  );
}

function FeaturesEditor({ items, columns, onChange }: { items: { text: string; icon?: string }[]; columns: number; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <div>
      <Field>
        <Label>Colunas</Label>
        <select value={columns} onChange={(e) => onChange({ columns: Number(e.target.value), items })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value={1}>1 coluna</option>
          <option value={2}>2 colunas</option>
          <option value={3}>3 colunas</option>
        </select>
      </Field>
      <Label>Itens</Label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input type="text" value={item.icon ?? ''} onChange={(e) => onChange({ columns, items: items.map((x, j) => j === i ? { ...x, icon: e.target.value } : x) })} placeholder="ícone" className="w-16 border border-gray-300 rounded px-2 py-1.5 text-sm" />
            <input type="text" value={item.text} onChange={(e) => onChange({ columns, items: items.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} placeholder="Texto da característica" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" />
            <button onClick={() => onChange({ columns, items: items.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600 text-sm">✕</button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange({ columns, items: [...items, { text: '', icon: 'check' }] })} className="mt-2 text-sm text-blue-600 hover:underline">+ Adicionar item</button>
    </div>
  );
}

function BadgesEditor({ items, onChange }: { items: { label: string; icon?: string; color?: string }[]; onChange: (items: { label: string; icon?: string; color?: string }[]) => void }) {
  return (
    <div>
      <Label>Selos</Label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input type="text" value={item.icon ?? ''} onChange={(e) => onChange(items.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))} placeholder="emoji" className="w-12 border border-gray-300 rounded px-2 py-1.5 text-sm" />
            <input type="text" value={item.label} onChange={(e) => onChange(items.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Texto do selo" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" />
            <input type="color" value={item.color ?? '#3d5cff'} onChange={(e) => onChange(items.map((x, j) => j === i ? { ...x, color: e.target.value } : x))} className="w-8 h-8 rounded cursor-pointer border border-gray-300" />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-sm">✕</button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...items, { label: '', icon: '✓', color: '#3d5cff' }])} className="mt-2 text-sm text-blue-600 hover:underline">+ Adicionar selo</button>
    </div>
  );
}

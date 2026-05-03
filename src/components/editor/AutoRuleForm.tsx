'use client';

import { useState } from 'react';

type RuleType = 'category' | 'tag' | 'price_range';

interface Template { id: number; name: string }
interface Category { id: number; name: string }

export interface RulePayload {
  name: string;
  templateId: number;
  ruleType: RuleType;
  ruleValue: Record<string, unknown>;
}

interface AutoRuleFormProps {
  templates: Template[];
  categories: Category[];
  onSave: (rule: RulePayload) => Promise<void>;
  onCancel: () => void;
  initial?: Partial<RulePayload>;
}

export function AutoRuleForm({ templates, categories, onSave, onCancel, initial }: AutoRuleFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [templateId, setTemplateId] = useState<number | null>(initial?.templateId ?? null);
  const [ruleType, setRuleType] = useState<RuleType>(initial?.ruleType ?? 'category');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tag, setTag] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function buildRuleValue(): Record<string, unknown> | null {
    if (ruleType === 'category') return categoryId ? { categoryId, categoryName: categories.find((c) => c.id === categoryId)?.name ?? '' } : null;
    if (ruleType === 'tag') return tag.trim() ? { tag: tag.trim() } : null;
    if (ruleType === 'price_range') {
      if (!priceMin && !priceMax) return null;
      return { ...(priceMin ? { min: parseFloat(priceMin) } : {}), ...(priceMax ? { max: parseFloat(priceMax) } : {}) };
    }
    return null;
  }

  async function handleSave() {
    setError('');
    if (!name.trim()) { setError('Dê um nome à regra.'); return; }
    if (!templateId) { setError('Selecione um template.'); return; }
    const rv = buildRuleValue();
    if (!rv) { setError('Preencha os critérios da regra.'); return; }
    setSaving(true);
    try {
      await onSave({ name, templateId, ruleType, ruleValue: rv });
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Nova regra automática</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Nome da regra</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Eletrodomésticos com garantia" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Template a aplicar</label>
          <select value={templateId ?? ''} onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : null)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Selecione um template…</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Aplicar quando o produto…</label>
          <select value={ruleType} onChange={(e) => setRuleType(e.target.value as RuleType)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="category">Pertencer a uma categoria</option>
            <option value="tag">Tiver uma tag específica</option>
            <option value="price_range">Estiver em uma faixa de preço</option>
          </select>
        </div>

        {ruleType === 'category' && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Categoria</label>
            <select value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Selecione uma categoria…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {ruleType === 'tag' && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Tag</label>
            <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Ex: garantia, premium" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        )}

        {ruleType === 'price_range' && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">Preço mínimo (R$)</label>
              <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="0,00" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">Preço máximo (R$)</label>
              <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="sem limite" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={onCancel} className="text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Salvando…' : 'Criar regra'}
        </button>
      </div>
    </div>
  );
}

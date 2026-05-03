'use client';

import { useState, useCallback } from 'react';
import { fetchWithNexoAuth } from '@/lib/nexo/client';

interface Template {
  id: number;
  name: string;
  blocks?: unknown[];
}

interface ApplyTemplateModalProps {
  templates: Template[];
  productId: number;
  productName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplyTemplateModal({ templates, productId, productName, onClose, onSuccess }: ApplyTemplateModalProps) {
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleApply = useCallback(async () => {
    if (!templateId) return;
    setApplying(true);
    setError('');

    try {
      const res = await fetchWithNexoAuth('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName,
          blocks: templates.find((t) => t.id === templateId)?.blocks ?? [],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDone(true);
      onSuccess();
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Erro ao aplicar template.');
    } finally {
      setApplying(false);
    }
  }, [templateId, productId, productName, templates, onSuccess]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Aplicar template</h2>
        <p className="text-sm text-gray-500 mb-4">{productName}</p>

        {done ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-green-700 font-medium">Template aplicado com sucesso!</p>
            <button onClick={onClose} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">Fechar</button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">Selecionar template</label>
              <select
                value={templateId ?? ''}
                onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Selecione um template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <div className="flex justify-between">
              <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
              <button
                onClick={handleApply}
                disabled={!templateId || applying}
                className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {applying ? 'Aplicando…' : 'Aplicar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

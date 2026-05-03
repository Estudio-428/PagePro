'use client';

import { useState, useCallback } from 'react';
import {
  Box, Button, Modal, Text, Title, Select, Alert,
  Spinner, Icon, ProgressBar,
} from '@nimbus-ds/components';
import { CheckCircleIcon, AlertCircleIcon } from '@nimbus-ds/icons';
import { getSessionToken } from '@tiendanube/nexo/helpers';
import nexo from '@/lib/nexo/nexo-client';
import { ProductSelector } from './ProductSelector';

interface Template {
  id: number;
  name: string;
}

interface ApplyTemplateModalProps {
  templates: Template[];
  initialProductId?: number;   // se vier de um produto específico
  initialTemplateId?: number;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

type Step = 'select_products' | 'select_template' | 'applying' | 'done' | 'error';

export function ApplyTemplateModal({
  templates,
  initialProductId,
  initialTemplateId,
  onClose,
  onSuccess,
}: ApplyTemplateModalProps) {
  const [step, setStep] = useState<Step>(
    initialProductId ? 'select_template' : 'select_products'
  );
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    initialProductId ? new Set([initialProductId]) : new Set()
  );
  const [templateId, setTemplateId] = useState<number | null>(initialTemplateId ?? null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ succeeded: number; failed: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleToggle = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback((ids: number[]) => {
    setSelectedIds(ids.length === 0 ? new Set() : new Set(ids));
  }, []);

  const handleApply = async () => {
    if (!templateId || selectedIds.size === 0) return;

    setStep('applying');
    setProgress(0);

    try {
      const token = await getSessionToken(nexo);
      const productIds = Array.from(selectedIds);

      // Divide em batches de 50 para evitar timeout e mostrar progresso
      const BATCH = 50;
      let totalSucceeded = 0;
      let totalFailed = 0;

      for (let i = 0; i < productIds.length; i += BATCH) {
        const batch = productIds.slice(i, i + BATCH);

        const res = await fetch('/api/metafields/apply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ templateId, productIds: batch }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();
        totalSucceeded += data.succeeded;
        totalFailed += data.failed;
        setProgress(Math.round(((i + batch.length) / productIds.length) * 100));

        // Pausa entre batches para respeitar rate limit (2 req/s)
        if (i + BATCH < productIds.length) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      setResult({ succeeded: totalSucceeded, failed: totalFailed });
      setStep('done');
      onSuccess(totalSucceeded);
    } catch (err: any) {
      setErrorMessage(err.message ?? 'Erro desconhecido');
      setStep('error');
    }
  };

  return (
    <Modal open onDismiss={step === 'applying' ? undefined : onClose}>
      <Modal.Header title={STEP_TITLES[step]} />

      <Modal.Body>
        <Box display="flex" flexDirection="column" gap="4">

          {/* STEP: Selecionar produtos */}
          {step === 'select_products' && (
            <ProductSelector
              selectedIds={selectedIds}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
            />
          )}

          {/* STEP: Selecionar template */}
          {step === 'select_template' && (
            <Box display="flex" flexDirection="column" gap="4">
              {selectedIds.size > 0 && (
                <Alert appearance="primary">
                  <Text fontSize="caption">
                    {selectedIds.size} produto{selectedIds.size !== 1 ? 's' : ''} selecionado{selectedIds.size !== 1 ? 's' : ''}
                  </Text>
                </Alert>
              )}
              <Box display="flex" flexDirection="column" gap="2">
                <Text fontSize="caption" fontWeight="medium">Template a aplicar</Text>
                <Select
                  value={templateId ? String(templateId) : ''}
                  onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : null)}
                >
                  <Select.Option value="" label="Selecione um template…" />
                  {templates.map((t) => (
                    <Select.Option key={t.id} value={String(t.id)} label={t.name} />
                  ))}
                </Select>
              </Box>
              {templates.length === 0 && (
                <Alert appearance="warning">
                  <Text fontSize="caption">
                    Nenhum template criado. Crie um template antes de aplicar.
                  </Text>
                </Alert>
              )}
            </Box>
          )}

          {/* STEP: Aplicando */}
          {step === 'applying' && (
            <Box display="flex" flexDirection="column" alignItems="center" gap="4" padding="4">
              <Spinner size="large" />
              <Text fontWeight="medium">Aplicando template…</Text>
              <Box width="100%">
                <ProgressBar progress={progress} appearance="primary" />
              </Box>
              <Text fontSize="caption" color="neutral-textLow">
                {progress}% — não feche esta janela
              </Text>
            </Box>
          )}

          {/* STEP: Concluído */}
          {step === 'done' && result && (
            <Box display="flex" flexDirection="column" alignItems="center" gap="4" padding="4">
              <Icon source={<CheckCircleIcon />} color="success-interactive" style={{ fontSize: 48 }} />
              <Title as="h3">Template aplicado!</Title>
              <Box display="flex" gap="6">
                <Box textAlign="center">
                  <Text fontSize="highlight" fontWeight="bold" color="success-interactive">
                    {result.succeeded}
                  </Text>
                  <Text fontSize="caption" color="neutral-textLow">com sucesso</Text>
                </Box>
                {result.failed > 0 && (
                  <Box textAlign="center">
                    <Text fontSize="highlight" fontWeight="bold" color="danger-interactive">
                      {result.failed}
                    </Text>
                    <Text fontSize="caption" color="neutral-textLow">com falha</Text>
                  </Box>
                )}
              </Box>
              {result.failed > 0 && (
                <Alert appearance="warning">
                  <Text fontSize="caption">
                    {result.failed} produto{result.failed !== 1 ? 's' : ''} não foi{result.failed !== 1 ? 'ram' : ''} atualizado{result.failed !== 1 ? 's' : ''}.
                    Verifique se os IDs ainda existem na loja.
                  </Text>
                </Alert>
              )}
            </Box>
          )}

          {/* STEP: Erro */}
          {step === 'error' && (
            <Box display="flex" flexDirection="column" alignItems="center" gap="4" padding="4">
              <Icon source={<AlertCircleIcon />} color="danger-interactive" style={{ fontSize: 48 }} />
              <Title as="h3">Falha ao aplicar</Title>
              <Alert appearance="danger">
                <Text fontSize="caption">{errorMessage}</Text>
              </Alert>
            </Box>
          )}

        </Box>
      </Modal.Body>

      <Modal.Footer>
        <Box display="flex" justifyContent="space-between" width="100%">
          {/* Botão esquerdo */}
          {step === 'select_products' && (
            <Button appearance="neutral" onClick={onClose}>Cancelar</Button>
          )}
          {step === 'select_template' && !initialProductId && (
            <Button appearance="neutral" onClick={() => setStep('select_products')}>← Voltar</Button>
          )}
          {(step === 'done' || step === 'error') && (
            <Button appearance="neutral" onClick={onClose}>Fechar</Button>
          )}
          {step === 'applying' && <Box />}

          {/* Botão direito */}
          {step === 'select_products' && (
            <Button
              appearance="primary"
              disabled={selectedIds.size === 0}
              onClick={() => setStep('select_template')}
            >
              Próximo ({selectedIds.size})
            </Button>
          )}
          {step === 'select_template' && (
            <Button
              appearance="primary"
              disabled={!templateId || selectedIds.size === 0}
              onClick={handleApply}
            >
              Aplicar em {selectedIds.size} produto{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          )}
          {step === 'done' && (
            <Button appearance="primary" onClick={onClose}>Concluído</Button>
          )}
          {step === 'error' && (
            <Button appearance="primary" onClick={() => setStep('select_template')}>Tentar novamente</Button>
          )}
        </Box>
      </Modal.Footer>
    </Modal>
  );
}

const STEP_TITLES: Record<Step, string> = {
  select_products: 'Selecionar produtos',
  select_template: 'Escolher template',
  applying: 'Aplicando template',
  done: 'Aplicação concluída',
  error: 'Erro na aplicação',
};

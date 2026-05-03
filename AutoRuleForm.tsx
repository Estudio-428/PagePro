'use client';

import { useState } from 'react';
import {
  Box, Button, Card, Input, Select, Text, Title, Alert, Spinner,
} from '@nimbus-ds/components';
import { AutomationIcon } from '@nimbus-ds/icons';
import { RuleType } from '@/types';

interface Template { id: number; name: string }
interface Category { id: number; name: string }

interface AutoRuleFormProps {
  templates: Template[];
  categories: Category[];
  onSave: (rule: RulePayload) => Promise<void>;
  onCancel: () => void;
  initial?: Partial<RulePayload>;
}

export interface RulePayload {
  name: string;
  templateId: number;
  ruleType: RuleType;
  ruleValue: Record<string, unknown>;
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

  const buildRuleValue = (): Record<string, unknown> | null => {
    switch (ruleType) {
      case 'category':
        if (!categoryId) return null;
        return { categoryId, categoryName: categories.find((c) => c.id === categoryId)?.name ?? '' };
      case 'tag':
        if (!tag.trim()) return null;
        return { tag: tag.trim() };
      case 'price_range':
        if (!priceMin && !priceMax) return null;
        return {
          ...(priceMin ? { min: parseFloat(priceMin) } : {}),
          ...(priceMax ? { max: parseFloat(priceMax) } : {}),
        };
    }
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) { setError('Dê um nome à regra.'); return; }
    if (!templateId) { setError('Selecione um template.'); return; }

    const ruleValue = buildRuleValue();
    if (!ruleValue) { setError('Preencha os critérios da regra.'); return; }

    setSaving(true);
    try {
      await onSave({ name, templateId, ruleType, ruleValue });
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Card.Header>
        <Box display="flex" alignItems="center" gap="2">
          <AutomationIcon />
          <Title as="h3" fontSize="base">Nova regra automática</Title>
        </Box>
      </Card.Header>
      <Card.Body>
        <Box display="flex" flexDirection="column" gap="4">

          {/* Nome */}
          <Box display="flex" flexDirection="column" gap="1">
            <Text fontSize="caption" fontWeight="medium">Nome da regra</Text>
            <Input
              placeholder="Ex: Eletrodomésticos com garantia"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Box>

          {/* Template */}
          <Box display="flex" flexDirection="column" gap="1">
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

          {/* Tipo da regra */}
          <Box display="flex" flexDirection="column" gap="1">
            <Text fontSize="caption" fontWeight="medium">Aplicar quando o produto…</Text>
            <Select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as RuleType)}
            >
              <Select.Option value="category" label="Pertencer a uma categoria" />
              <Select.Option value="tag" label="Tiver uma tag específica" />
              <Select.Option value="price_range" label="Estiver em uma faixa de preço" />
            </Select>
          </Box>

          {/* Critério: categoria */}
          {ruleType === 'category' && (
            <Box display="flex" flexDirection="column" gap="1">
              <Text fontSize="caption" fontWeight="medium">Categoria</Text>
              <Select
                value={categoryId ? String(categoryId) : ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              >
                <Select.Option value="" label="Selecione uma categoria…" />
                {categories.map((c) => (
                  <Select.Option key={c.id} value={String(c.id)} label={c.name} />
                ))}
              </Select>
            </Box>
          )}

          {/* Critério: tag */}
          {ruleType === 'tag' && (
            <Box display="flex" flexDirection="column" gap="1">
              <Text fontSize="caption" fontWeight="medium">Tag</Text>
              <Input
                placeholder="Ex: garantia, premium, importado"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
              <Text fontSize="caption" color="neutral-textLow">
                A regra será aplicada a produtos que contenham exatamente esta tag.
              </Text>
            </Box>
          )}

          {/* Critério: faixa de preço */}
          {ruleType === 'price_range' && (
            <Box display="flex" gap="3">
              <Box flex="1" display="flex" flexDirection="column" gap="1">
                <Text fontSize="caption" fontWeight="medium">Preço mínimo (R$)</Text>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                />
              </Box>
              <Box flex="1" display="flex" flexDirection="column" gap="1">
                <Text fontSize="caption" fontWeight="medium">Preço máximo (R$)</Text>
                <Input
                  type="number"
                  placeholder="sem limite"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                />
              </Box>
            </Box>
          )}

          {error && (
            <Alert appearance="danger">
              <Text fontSize="caption">{error}</Text>
            </Alert>
          )}
        </Box>
      </Card.Body>
      <Card.Footer>
        <Box display="flex" justifyContent="space-between">
          <Button appearance="neutral" onClick={onCancel}>Cancelar</Button>
          <Button appearance="primary" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="small" /> : null}
            {saving ? 'Salvando…' : 'Criar regra'}
          </Button>
        </Box>
      </Card.Footer>
    </Card>
  );
}

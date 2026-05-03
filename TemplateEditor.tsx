'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Input,
  Text,
  Title,
  Alert,
  Spinner,
} from '@nimbus-ds/components';
import { useBlocks } from './useBlocks';
import { BlockPalette } from './BlockPalette';
import { BlockItem } from './BlockItem';
import { BlockConfigPanel } from './BlockConfigPanel';
import { TemplatePreview } from './TemplatePreview';
import { Block } from '@/types';

interface TemplateEditorProps {
  templateId?: number;          // undefined = novo template
  initialName?: string;
  initialBlocks?: Block[];
  getSessionToken: () => Promise<string>; // injetado pela page via Nexo
}

type Tab = 'blocks' | 'preview';

export function TemplateEditor({
  templateId,
  initialName = '',
  initialBlocks = [],
  getSessionToken,
}: TemplateEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('blocks');

  const {
    blocks,
    selectedId,
    selectedBlock,
    draggedId,
    setSelectedId,
    setDraggedId,
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
  } = useBlocks(initialBlocks);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Dê um nome ao template antes de salvar.');
      return;
    }
    setError(null);
    setSaving(true);

    try {
      const token = await getSessionToken();
      const method = templateId ? 'PUT' : 'POST';
      const url = templateId ? `/api/templates/${templateId}` : '/api/templates';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, blocks }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const saved = await res.json();
      router.push(`/app/templates/${saved.id}`);
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" height="100vh" backgroundColor="neutral-surface">
      {/* Top bar */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        padding="3"
        paddingX="4"
        backgroundColor="neutral-background"
        borderBottomWidth="1"
        borderBottomStyle="solid"
        borderBottomColor="neutral-interactive"
        style={{ flexShrink: 0 }}
      >
        <Box display="flex" alignItems="center" gap="4">
          <Button appearance="transparent" size="small" onClick={() => router.push('/app/templates')}>
            ← Templates
          </Button>
          <Input
            placeholder="Nome do template (ex: Eletrônicos Premium)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ minWidth: 300 }}
          />
        </Box>

        {/* Tabs desktop/preview */}
        <Box display="flex" gap="2">
          <Button
            appearance={activeTab === 'blocks' ? 'primary' : 'neutral'}
            size="small"
            onClick={() => setActiveTab('blocks')}
          >
            Editor
          </Button>
          <Button
            appearance={activeTab === 'preview' ? 'primary' : 'neutral'}
            size="small"
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </Button>
        </Box>

        <Box display="flex" alignItems="center" gap="3">
          {error && <Text fontSize="caption" color="danger-interactive">{error}</Text>}
          <Text fontSize="caption" color="neutral-textLow">
            {blocks.length} bloco{blocks.length !== 1 ? 's' : ''}
          </Text>
          <Button
            appearance="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Spinner size="small" /> : null}
            {saving ? 'Salvando…' : 'Salvar template'}
          </Button>
        </Box>
      </Box>

      {/* Corpo do editor */}
      {activeTab === 'blocks' ? (
        <Box display="flex" flex="1" overflow="hidden">
          {/* Coluna 1 — Paleta de blocos */}
          <Box style={{ width: 220, flexShrink: 0 }}>
            <BlockPalette onAddBlock={addBlock} />
          </Box>

          {/* Coluna 2 — Lista de blocos */}
          <Box
            flex="1"
            display="flex"
            flexDirection="column"
            overflowY="auto"
            padding="4"
            gap="2"
            backgroundColor="neutral-surface"
            onClick={() => setSelectedId(null)}
          >
            <Text fontSize="caption" fontWeight="medium" color="neutral-textLow">
              ORDEM DOS BLOCOS
            </Text>

            {blocks.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                flex="1"
                style={{ minHeight: 300 }}
                gap="2"
              >
                <Text color="neutral-textLow">Nenhum bloco adicionado.</Text>
                <Text fontSize="caption" color="neutral-textLow">
                  Clique em um bloco na lista à esquerda para começar.
                </Text>
              </Box>
            ) : (
              blocks
                .sort((a, b) => a.order - b.order)
                .map((block, index) => (
                  <BlockItem
                    key={block.id}
                    block={block}
                    index={index}
                    total={blocks.length}
                    isSelected={selectedId === block.id}
                    isDragging={draggedId === block.id}
                    onSelect={() => setSelectedId(block.id)}
                    onRemove={() => removeBlock(block.id)}
                    onMove={moveBlock}
                    onDragStart={setDraggedId}
                    onDragEnd={() => setDraggedId(null)}
                    onDrop={(fromIndex) => moveBlock(fromIndex, index)}
                  />
                ))
            )}
          </Box>

          {/* Coluna 3 — Config do bloco selecionado */}
          <Box style={{ width: 280, flexShrink: 0 }}>
            {selectedBlock ? (
              <BlockConfigPanel
                block={selectedBlock}
                onUpdate={(config) => updateBlock(selectedBlock.id, config)}
              />
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
                padding="6"
                backgroundColor="neutral-background"
                borderLeftWidth="1"
                borderLeftStyle="solid"
                borderLeftColor="neutral-interactive"
              >
                <Text color="neutral-textLow" textAlign="center" fontSize="caption">
                  Selecione um bloco para configurar seu conteúdo.
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <Box flex="1" overflow="hidden">
          <TemplatePreview blocks={blocks} />
        </Box>
      )}
    </Box>
  );
}

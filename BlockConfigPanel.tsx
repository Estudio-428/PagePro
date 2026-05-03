'use client';

import { Box, Text, Title, Input, Textarea, Select, Toggle, Button } from '@nimbus-ds/components';
import { Block, RichTextConfig, SpecsTableConfig, FaqConfig, ImageConfig, VideoConfig, BadgesConfig, SeoTextConfig } from '@/types';

interface BlockConfigPanelProps {
  block: Block;
  onUpdate: (config: Partial<Block['config']>) => void;
}

export function BlockConfigPanel({ block, onUpdate }: BlockConfigPanelProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      backgroundColor="neutral-background"
      borderLeftWidth="1"
      borderLeftStyle="solid"
      borderLeftColor="neutral-interactive"
    >
      <Box
        padding="4"
        borderBottomWidth="1"
        borderBottomStyle="solid"
        borderBottomColor="neutral-interactive"
      >
        <Title as="h3" fontSize="base">Configurar bloco</Title>
        <Text fontSize="caption" color="neutral-textLow" textTransform="capitalize">
          {block.type.replace('_', ' ')}
        </Text>
      </Box>

      <Box padding="4" overflowY="auto" flex="1">
        {block.type === 'rich_text'   && <RichTextEditor   config={block.config as RichTextConfig}   onUpdate={onUpdate} />}
        {block.type === 'specs_table' && <SpecsTableEditor  config={block.config as SpecsTableConfig}  onUpdate={onUpdate} />}
        {block.type === 'faq'         && <FaqEditor         config={block.config as FaqConfig}         onUpdate={onUpdate} />}
        {block.type === 'image'       && <ImageEditor       config={block.config as ImageConfig}       onUpdate={onUpdate} />}
        {block.type === 'video'       && <VideoEditor       config={block.config as VideoConfig}       onUpdate={onUpdate} />}
        {block.type === 'badges'      && <BadgesEditor      config={block.config as BadgesConfig}      onUpdate={onUpdate} />}
        {block.type === 'seo_text'    && <SeoTextEditor     config={block.config as SeoTextConfig}     onUpdate={onUpdate} />}
      </Box>
    </Box>
  );
}

// ── Editores por tipo de bloco ────────────────────────────────────────────

function RichTextEditor({ config, onUpdate }: { config: RichTextConfig; onUpdate: Function }) {
  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Box display="flex" flexDirection="column" gap="1">
        <Text fontSize="caption" fontWeight="medium">Título (opcional)</Text>
        <Input
          placeholder="Ex: Sobre este produto"
          value={config.title ?? ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </Box>
      <Box display="flex" flexDirection="column" gap="1">
        <Text fontSize="caption" fontWeight="medium">Conteúdo HTML</Text>
        <Textarea
          rows={8}
          placeholder="<p>Descrição do produto...</p>"
          value={config.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
        />
        <Text fontSize="caption" color="neutral-textLow">
          Suporte a HTML básico: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;
        </Text>
      </Box>
    </Box>
  );
}

function SpecsTableEditor({ config, onUpdate }: { config: SpecsTableConfig; onUpdate: Function }) {
  const addRow = () => onUpdate({ rows: [...config.rows, { label: '', value: '' }] });
  const removeRow = (i: number) => onUpdate({ rows: config.rows.filter((_, idx) => idx !== i) });
  const updateRow = (i: number, field: 'label' | 'value', value: string) => {
    const rows = config.rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r);
    onUpdate({ rows });
  };

  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Box display="flex" flexDirection="column" gap="1">
        <Text fontSize="caption" fontWeight="medium">Título</Text>
        <Input value={config.title ?? ''} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Especificações técnicas" />
      </Box>
      <Box display="flex" flexDirection="column" gap="2">
        <Text fontSize="caption" fontWeight="medium">Linhas da tabela</Text>
        {config.rows.map((row, i) => (
          <Box key={i} display="flex" gap="2" alignItems="center">
            <Input placeholder="Atributo" value={row.label} onChange={(e) => updateRow(i, 'label', e.target.value)} />
            <Input placeholder="Valor" value={row.value} onChange={(e) => updateRow(i, 'value', e.target.value)} />
            <Button appearance="transparent" size="small" onClick={() => removeRow(i)}>✕</Button>
          </Box>
        ))}
        <Button appearance="neutral" size="small" onClick={addRow}>+ Adicionar linha</Button>
      </Box>
    </Box>
  );
}

function FaqEditor({ config, onUpdate }: { config: FaqConfig; onUpdate: Function }) {
  const addItem = () => onUpdate({ items: [...config.items, { question: '', answer: '' }] });
  const removeItem = (i: number) => onUpdate({ items: config.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: 'question' | 'answer', value: string) => {
    const items = config.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item);
    onUpdate({ items });
  };

  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Box display="flex" flexDirection="column" gap="1">
        <Text fontSize="caption" fontWeight="medium">Título</Text>
        <Input value={config.title ?? ''} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Perguntas frequentes" />
      </Box>
      <Box display="flex" flexDirection="column" gap="3">
        <Text fontSize="caption" fontWeight="medium">Perguntas</Text>
        {config.items.map((item, i) => (
          <Box key={i} display="flex" flexDirection="column" gap="2" padding="3" backgroundColor="neutral-surface" borderRadius="2">
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Text fontSize="caption" fontWeight="medium">Pergunta {i + 1}</Text>
              <Button appearance="transparent" size="small" onClick={() => removeItem(i)}>✕</Button>
            </Box>
            <Input placeholder="Qual a pergunta?" value={item.question} onChange={(e) => updateItem(i, 'question', e.target.value)} />
            <Textarea rows={3} placeholder="Qual a resposta?" value={item.answer} onChange={(e) => updateItem(i, 'answer', e.target.value)} />
          </Box>
        ))}
        <Button appearance="neutral" size="small" onClick={addItem}>+ Adicionar pergunta</Button>
      </Box>
    </Box>
  );
}

function ImageEditor({ config, onUpdate }: { config: ImageConfig; onUpdate: Function }) {
  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Box display="flex" flexDirection="column" gap="1">
        <Text fontSize="caption" fontWeight="medium">URL da imagem</Text>
        <Input placeholder="https://..." value={config.url} onChange={(e) => onUpdate({ url: e.target.value })} />
      </Box>
      <Box display="flex" flexDirection="column" gap="1">
        <Text fontSize="caption" fontWeight="medium">Texto alternativo (SEO)</Text>
        <Input placeholder="Descrição da imagem" value={config.alt ?? ''} onChange={(e) => onUpdate({ alt: e.target.value })} />
      </Box>
      <Box display="flex" flexDirection="column" gap="1">
        <Text fontSize="caption" fontWeight="medium">Legenda</Text>
        <Input placeholder="Legenda opcional" value={config.caption ?? ''} onChange={(e) => onUpdate({ caption: e.target.value })} />
      </Box>
      <Box display="flex" flexDirection="column" gap="1">
        <Text fontSize="caption" fontWeight="medium">Largura</Text>
        <Select value={config.width ?? 'full'} onChange={(e) => onUpdate({ width: e.target.value })}>
          <Select.Option value="full" label="Largura total" />
          <Select.Option value="contained" label="Contida (max 800px)" />
        </Select>
      </Box>
    </Box>
  );
}

function VideoEditor({ config, onUpdate }: { config: VideoConfig; onUpdate: Function }) {
  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Box display="flex" flexDirection="column" gap="1">
        <Text fontSize="caption" fontWeight="medium">URL do vídeo</Text>
        <Input placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..." value={config.url} onChange={(e) => onUpdate({ url: e.target.value })} />
        <Text fontSize="caption" color="neutral-textLow">Suporte a YouTube e Vimeo</Text>
      </Box>
      <Box display="flex" flexDirection="column" gap="1">
        <Text fontSize="caption" fontWeight="medium">Título</Text>
        <Input placeholder="Título do vídeo" value={config.title ?? ''} onChange={(e) => onUpdate({ title: e.target.value })} />
      </Box>
    </Box>
  );
}

function BadgesEditor({ config, onUpdate }: { config: BadgesConfig; onUpdate: Function }) {
  const addBadge = () => onUpdate({ items: [...config.items, { label: '', icon: '✓', color: '#00875A' }] });
  const removeBadge = (i: number) => onUpdate({ items: config.items.filter((_, idx) => idx !== i) });
  const updateBadge = (i: number, field: string, value: string) => {
    const items = config.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item);
    onUpdate({ items });
  };

  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Box display="flex" flexDirection="column" gap="3">
        <Text fontSize="caption" fontWeight="medium">Selos</Text>
        {config.items.map((item, i) => (
          <Box key={i} display="flex" gap="2" alignItems="center">
            <Input placeholder="Ícone" value={item.icon ?? ''} onChange={(e) => updateBadge(i, 'icon', e.target.value)} style={{ width: 60 }} />
            <Input placeholder="Texto do selo" value={item.label} onChange={(e) => updateBadge(i, 'label', e.target.value)} />
            <input type="color" value={item.color ?? '#00875A'} onChange={(e) => updateBadge(i, 'color', e.target.value)} style={{ width: 36, height: 36, borderRadius: 4, border: 'none', cursor: 'pointer' }} />
            <Button appearance="transparent" size="small" onClick={() => removeBadge(i)}>✕</Button>
          </Box>
        ))}
        <Button appearance="neutral" size="small" onClick={addBadge}>+ Adicionar selo</Button>
      </Box>
    </Box>
  );
}

function SeoTextEditor({ config, onUpdate }: { config: SeoTextConfig; onUpdate: Function }) {
  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Box display="flex" flexDirection="column" gap="1">
        <Text fontSize="caption" fontWeight="medium">Conteúdo SEO</Text>
        <Textarea
          rows={8}
          placeholder="Texto otimizado para SEO. Inclua palavras-chave naturalmente..."
          value={config.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
        />
        <Text fontSize="caption" color="neutral-textLow">
          Este conteúdo é renderizado de forma visualmente oculta, mas indexado pelos buscadores.
        </Text>
      </Box>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Text fontSize="caption" fontWeight="medium">Ocultar visualmente</Text>
        <Toggle
          checked={config.hidden ?? true}
          onChange={(e) => onUpdate({ hidden: e.target.checked })}
          label=""
          name="seo-hidden"
        />
      </Box>
    </Box>
  );
}

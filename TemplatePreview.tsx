'use client';

import { useState } from 'react';
import { Box, Button, Text, Icon } from '@nimbus-ds/components';
import { DesktopIcon, TabletIcon, MobileIcon } from '@nimbus-ds/icons';
import { Block } from '@/types';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_WIDTHS: Record<Viewport, number> = {
  desktop: 900,
  tablet: 768,
  mobile: 375,
};

interface TemplatePreviewProps {
  blocks: Block[];
}

export function TemplatePreview({ blocks }: TemplatePreviewProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const width = VIEWPORT_WIDTHS[viewport];

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      backgroundColor="neutral-surface"
    >
      {/* Toolbar de viewport */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        padding="3"
        borderBottomWidth="1"
        borderBottomStyle="solid"
        borderBottomColor="neutral-interactive"
        backgroundColor="neutral-background"
      >
        <Text fontSize="caption" fontWeight="medium" color="neutral-textLow">
          Preview
        </Text>
        <Box display="flex" gap="1">
          {(['desktop', 'tablet', 'mobile'] as Viewport[]).map((vp) => (
            <Button
              key={vp}
              appearance={viewport === vp ? 'primary' : 'neutral'}
              size="small"
              onClick={() => setViewport(vp)}
            >
              <Icon source={vp === 'desktop' ? <DesktopIcon /> : vp === 'tablet' ? <TabletIcon /> : <MobileIcon />} />
            </Button>
          ))}
        </Box>
        <Text fontSize="caption" color="neutral-textLow">{width}px</Text>
      </Box>

      {/* Área de preview */}
      <Box
        flex="1"
        overflowY="auto"
        display="flex"
        justifyContent="center"
        padding="6"
        backgroundColor="neutral-surface"
      >
        <Box
          style={{
            width: width,
            maxWidth: '100%',
            transition: 'width 0.3s ease',
            backgroundColor: '#fff',
            borderRadius: 8,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            minHeight: 400,
            overflow: 'hidden',
          }}
        >
          {blocks.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              padding="8"
              style={{ minHeight: 300 }}
            >
              <Text color="neutral-textLow" textAlign="center">
                Adicione blocos à esquerda para ver o preview aqui.
              </Text>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column">
              {[...blocks].sort((a, b) => a.order - b.order).map((block) => (
                <BlockPreviewRenderer key={block.id} block={block} />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function BlockPreviewRenderer({ block }: { block: Block }) {
  const style: React.CSSProperties = {
    padding: '24px 32px',
    borderBottom: '1px solid #f0f0f0',
  };

  switch (block.type) {
    case 'rich_text': {
      const c = block.config as any;
      return (
        <div style={style}>
          {c.title && <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 600 }}>{c.title}</h3>}
          <div dangerouslySetInnerHTML={{ __html: c.content }} style={{ lineHeight: 1.7, color: '#333' }} />
        </div>
      );
    }
    case 'specs_table': {
      const c = block.config as any;
      return (
        <div style={style}>
          {c.title && <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600 }}>{c.title}</h3>}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {c.rows?.map((row: any, i: number) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500, width: '40%', borderBottom: '1px solid #eee' }}>{row.label}</td>
                  <td style={{ padding: '10px 16px', color: '#555', borderBottom: '1px solid #eee' }}>{row.value || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'faq': {
      const c = block.config as any;
      return (
        <div style={style}>
          {c.title && <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600 }}>{c.title}</h3>}
          {c.items?.map((item: any, i: number) => (
            <details key={i} style={{ marginBottom: 8, border: '1px solid #eee', borderRadius: 6 }}>
              <summary style={{ padding: '12px 16px', cursor: 'pointer', fontWeight: 500 }}>
                {item.question || 'Pergunta sem texto'}
              </summary>
              <p style={{ padding: '0 16px 12px', margin: 0, color: '#555', lineHeight: 1.6 }}>
                {item.answer || 'Resposta não preenchida.'}
              </p>
            </details>
          ))}
        </div>
      );
    }
    case 'image': {
      const c = block.config as any;
      return (
        <div style={{ ...style, padding: c.width === 'contained' ? '24px 32px' : 0 }}>
          {c.url ? (
            <img
              src={c.url}
              alt={c.alt ?? ''}
              style={{
                width: c.width === 'contained' ? '100%' : '100%',
                maxWidth: c.width === 'contained' ? 800 : undefined,
                display: 'block',
                borderRadius: c.width === 'contained' ? 8 : 0,
              }}
            />
          ) : (
            <div style={{ background: '#f5f5f5', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              URL da imagem não configurada
            </div>
          )}
          {c.caption && <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 8 }}>{c.caption}</p>}
        </div>
      );
    }
    case 'video': {
      const c = block.config as any;
      const embedUrl = getEmbedUrl(c.url);
      return (
        <div style={style}>
          {c.title && <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 600 }}>{c.title}</h3>}
          {embedUrl ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={embedUrl}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div style={{ background: '#f5f5f5', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', borderRadius: 8 }}>
              {c.url ? 'URL de vídeo inválida' : 'URL do vídeo não configurada'}
            </div>
          )}
        </div>
      );
    }
    case 'badges': {
      const c = block.config as any;
      return (
        <div style={style}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {c.items?.map((badge: any, i: number) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: `${badge.color}18`,
                  color: badge.color ?? '#00875A',
                  border: `1px solid ${badge.color ?? '#00875A'}40`,
                }}
              >
                <span>{badge.icon}</span>
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      );
    }
    case 'seo_text': {
      const c = block.config as any;
      return (
        <div style={{ ...style, backgroundColor: '#fffbeb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13 }}>🔍</span>
            <Text fontSize="caption" fontWeight="medium" color="warning-interactive">
              Bloco SEO (visível apenas no editor)
            </Text>
          </div>
          <p style={{ margin: 0, color: '#666', fontSize: 13, lineHeight: 1.6 }}>
            {c.content || 'Conteúdo SEO não preenchido.'}
          </p>
        </div>
      );
    }
    default:
      return null;
  }
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

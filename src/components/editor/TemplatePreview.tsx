'use client';

import { useState } from 'react';
import type { BlockType, BlockEffect } from '@/types/blocks';

interface BlockData {
  type: BlockType;
  title?: string;
  content: Record<string, unknown>;
  effect: BlockEffect;
  isVisible: boolean;
}

type Viewport = 'desktop' | 'tablet' | 'mobile';

const WIDTHS: Record<Viewport, number> = { desktop: 900, tablet: 768, mobile: 375 };

interface TemplatePreviewProps {
  blocks: BlockData[];
}

export function TemplatePreview({ blocks }: TemplatePreviewProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const w = WIDTHS[viewport];

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">Preview</span>
        <div className="flex gap-1">
          {(['desktop', 'tablet', 'mobile'] as Viewport[]).map((vp) => (
            <button
              key={vp}
              onClick={() => setViewport(vp)}
              className={`text-xs px-3 py-1 rounded ${viewport === vp ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {vp === 'desktop' ? '🖥' : vp === 'tablet' ? '📱' : '📱'} {WIDTHS[vp]}px
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex justify-center p-8">
        <div
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          style={{ width: w, maxWidth: '100%', minHeight: 400, transition: 'width 0.2s ease' }}
        >
          {blocks.filter((b) => b.isVisible).length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Adicione blocos visíveis para ver o preview
            </div>
          ) : (
            blocks.filter((b) => b.isVisible).map((block, i) => (
              <BlockPreview key={i} block={block} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BlockPreview({ block }: { block: BlockData }) {
  const c = block.content;
  const s: React.CSSProperties = { padding: '24px 32px', borderBottom: '1px solid #f0f0f0' };

  switch (block.type) {
    case 'DESCRIPTION':
      return <div style={s}>{block.title && <h3 style={{ fontWeight: 600, marginBottom: 12 }}>{block.title}</h3>}<div dangerouslySetInnerHTML={{ __html: (c.html as string) || '' }} /></div>;

    case 'FAQ':
      return (
        <div style={s}>
          {block.title && <h3 style={{ fontWeight: 600, marginBottom: 16 }}>{block.title}</h3>}
          {((c.items as { question: string; answer: string }[]) ?? []).map((item, i) => (
            <details key={i} style={{ marginBottom: 8, border: '1px solid #eee', borderRadius: 6 }}>
              <summary style={{ padding: '10px 14px', cursor: 'pointer', fontWeight: 500 }}>{item.question}</summary>
              <p style={{ padding: '0 14px 10px', margin: 0, color: '#555', lineHeight: 1.6 }}>{item.answer}</p>
            </details>
          ))}
        </div>
      );

    case 'TABLE':
      return (
        <div style={s}>
          {block.title && <h3 style={{ fontWeight: 600, marginBottom: 16 }}>{block.title}</h3>}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              {((c.rows as { label: string; value: string }[]) ?? []).map((row, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500, width: '40%', borderBottom: '1px solid #eee' }}>{row.label}</td>
                  <td style={{ padding: '8px 12px', color: '#555', borderBottom: '1px solid #eee' }}>{row.value || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'VIDEO': {
      const url = (c.url as string) ?? '';
      const embed = getEmbed(url);
      return (
        <div style={s}>
          {block.title && <h3 style={{ fontWeight: 600, marginBottom: 12 }}>{block.title}</h3>}
          {embed ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe src={embed} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', borderRadius: 8 }} allowFullScreen />
            </div>
          ) : (
            <div style={{ background: '#f5f5f5', height: 160, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>
              {url ? 'URL de vídeo inválida' : 'URL não configurada'}
            </div>
          )}
        </div>
      );
    }

    case 'IMAGES':
      return (
        <div style={s}>
          {block.title && <h3 style={{ fontWeight: 600, marginBottom: 16 }}>{block.title}</h3>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {((c.items as { desktopUrl?: string; mobileUrl?: string; url?: string; alt?: string; caption?: string }[]) ?? []).map((item, i) => {
              const src = item.desktopUrl || item.url || item.mobileUrl;
              if (!src) return null;
              return (
                <figure key={i} style={{ margin: 0 }}>
                  <img src={src} alt={item.alt ?? ''} style={{ width: '100%', borderRadius: 4, border: '1px solid #eee' }} />
                  {item.caption && <figcaption style={{ color: '#777', fontSize: 12, marginTop: 6 }}>{item.caption}</figcaption>}
                </figure>
              );
            })}
          </div>
        </div>
      );

    case 'INFO_BOX': {
      const styles: Record<string, { bg: string; color: string }> = {
        info:    { bg: '#eef4ff', color: '#2a4db5' },
        success: { bg: '#edfbf0', color: '#1a6e37' },
        warning: { bg: '#fff8e1', color: '#8a6400' },
        tip:     { bg: '#f3f0ff', color: '#4a28b5' },
      };
      const st = styles[(c.style as string) ?? 'info'] ?? styles.info;
      return <div style={{ ...s, background: st.bg, color: st.color, borderRadius: 8, margin: '0 0 8px' }}><p style={{ margin: 0 }}>{(c.text as string) ?? ''}</p></div>;
    }

    case 'BADGES':
      return (
        <div style={{ ...s, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {((c.items as { label: string; icon?: string; color?: string; imageUrl?: string; imageDesktopUrl?: string; imageMobileUrl?: string }[]) ?? []).map((badge, i) => {
            const color = badge.color ?? '#2f80b8';
            const src = badge.imageDesktopUrl || badge.imageUrl || badge.imageMobileUrl;
            return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 4, fontSize: 13, background: '#fff', color, border: `1px solid ${color}40` }}>
              {src ? <img src={src} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} /> : <StorefrontIcon name={badge.icon ?? 'check'} />}
              {badge.label}
            </span>
          );})}
        </div>
      );

    default:
      return <div style={s}><em style={{ color: '#999', fontSize: 13 }}>{block.type}</em></div>;
  }
}

function StorefrontIcon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'star':
      return <svg {...common} fill="currentColor" stroke="none"><path d="M8 1.6 9.9 5.4l4.2.6-3 2.9.7 4.1L8 11l-3.8 2 .7-4.1-3-2.9 4.2-.6L8 1.6Z" /></svg>;
    case 'shield':
      return <svg {...common}><path d="M8 1.8 3.2 3.9v3.8c0 3 2.1 5.4 4.8 6.5 2.7-1.1 4.8-3.5 4.8-6.5V3.9L8 1.8Z" /></svg>;
    case 'truck':
      return <svg {...common}><path d="M1.5 4.5h8v6h-8zM9.5 6.5h2.7l1.3 2v2h-4z" /><path d="M4 12a1.2 1.2 0 1 0 0-2.4A1.2 1.2 0 0 0 4 12ZM11.5 12a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z" /></svg>;
    case 'info':
      return <svg {...common}><circle cx="8" cy="8" r="6" /><path d="M8 7.5v4M8 4.8h.01" /></svg>;
    default:
      return <svg {...common}><path d="M3 8.2 6.4 11.5 13 4.8" /></svg>;
  }
}

function getEmbed(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

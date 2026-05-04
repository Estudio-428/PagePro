'use client';

import { useState } from 'react';
import type { BlockEffect, BlockType } from '@/types/blocks';

interface BlockData {
  type: BlockType;
  title?: string;
  content: Record<string, unknown>;
  order: number;
  effect: BlockEffect;
  isVisible: boolean;
}

export interface ProductPreviewData {
  id: number;
  name?: Record<string, string> | string;
  description?: Record<string, string> | string | null;
  images?: { src: string }[];
  variants?: {
    price_short?: string;
    price?: string;
    promotional_price_short?: string | null;
    sku?: string | null;
    stock?: number | null;
  }[];
}

type Viewport = 'desktop' | 'mobile';

interface ProductPagePreviewProps {
  productId: number;
  productName: string;
  product?: ProductPreviewData | null;
  blocks: BlockData[];
}

function pickLocalized(value: Record<string, string> | string | null | undefined) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.pt ?? value.es ?? Object.values(value)[0] ?? '';
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function Icon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'desktop':
      return <svg {...common}><rect x="4" y="5" width="16" height="11" rx="2" /><path d="M8 20h8M12 16v4" /></svg>;
    case 'mobile':
      return <svg {...common}><rect x="8" y="3" width="8" height="18" rx="2" /><path d="M11.5 18h1" /></svg>;
    case 'check':
      return <svg {...common}><path d="M20 6 9 17l-5-5" /></svg>;
    case 'star':
      return <svg {...common} fill="currentColor" stroke="none"><path d="m12 3 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7L6.8 19l1-5.8L3.6 9.1l5.8-.8L12 3Z" /></svg>;
    case 'shield':
      return <svg {...common}><path d="M12 3 5 6v5c0 4.2 3 7.7 7 9 4-1.3 7-4.8 7-9V6l-7-3Z" /></svg>;
    case 'truck':
      return <svg {...common}><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" /><path d="M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
  }
}

export function ProductPagePreview({ productId, productName, product, blocks }: ProductPagePreviewProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const isMobile = viewport === 'mobile';
  const visibleBlocks = [...blocks].filter((block) => block.isVisible).sort((a, b) => a.order - b.order);
  const variant = product?.variants?.[0];
  const price = variant?.promotional_price_short || variant?.price_short || variant?.price || 'R$ 0,00';
  const sku = variant?.sku;
  const image = product?.images?.[0]?.src;
  const description = stripHtml(pickLocalized(product?.description));
  const previewWidth = isMobile ? 390 : 1080;

  return (
    <div className="flex h-full flex-col bg-[#f4f4f7]">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--line)] bg-white px-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted-2)]">Pré-visualização</p>
          <p className="text-[11px] text-[var(--muted)]">Produto {productId}</p>
        </div>
        <div className="inline-flex rounded-lg border border-[var(--line-strong)] bg-white p-1">
          {(['desktop', 'mobile'] as Viewport[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setViewport(item)}
              className={`grid h-8 w-9 place-items-center rounded-md transition ${viewport === item ? 'bg-[var(--foreground)] text-white' : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]'}`}
              aria-label={item === 'desktop' ? 'Prévia desktop' : 'Prévia mobile'}
              title={item === 'desktop' ? 'Desktop' : 'Mobile'}
            >
              <Icon name={item} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div
          className="mx-auto overflow-hidden rounded-[10px] border border-[var(--line)] bg-white shadow-sm transition-[width] duration-200"
          style={{ width: previewWidth, maxWidth: '100%' }}
        >
          <div className="border-b border-[#eeeeee] px-6 py-4">
            <div className="mx-auto flex max-w-[1040px] items-center justify-between gap-6">
              <div className="text-lg font-bold tracking-tight">Comercial França</div>
              {!isMobile && (
                <div className="flex items-center gap-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
                  <span>Produtos</span>
                  <span>Contato</span>
                  <span>Minha conta</span>
                </div>
              )}
            </div>
          </div>

          <div className="mx-auto max-w-[1040px] px-5 py-6">
            <div className={`grid gap-7 ${isMobile ? 'grid-cols-1' : 'grid-cols-[0.92fr_1fr]'}`}>
              <div>
                <div className="grid aspect-square place-items-center rounded-[6px] border border-[#eeeeee] bg-[#fafafa]">
                  {image ? (
                    <img src={image} alt="" className="h-full w-full rounded-[6px] object-contain" />
                  ) : (
                    <div className="text-center text-sm text-[#8a8d9a]">
                      <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-[#eeeeee]">
                        <Icon name="info" />
                      </div>
                      Sem imagem do produto
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8a8d9a]">Produto</p>
                <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold leading-tight text-[#111827]`}>{productName}</h1>
                {sku && <p className="mt-2 text-xs text-[#8a8d9a]">SKU: {sku}</p>}
                <div className="mt-5 text-3xl font-extrabold text-[#111827]">{price}</div>
                <div className="mt-5 flex gap-2">
                  <button type="button" className="h-11 w-16 rounded border border-[#dcdce3] bg-white text-sm font-bold">1</button>
                  <button type="button" className="h-11 flex-1 rounded bg-[#111827] px-5 text-sm font-bold text-white">Comprar</button>
                </div>
                <div className="mt-4 rounded-[6px] border border-[#e7e7e7] bg-[#fbfbfb] p-3 text-sm text-[#4b5563]">
                  Calcule o frete e prazo de entrega para este produto.
                </div>
                {description && (
                  <p className="mt-5 line-clamp-4 text-sm leading-6 text-[#4b5563]">{description}</p>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-[#eeeeee] pt-7">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-[#111827]">Informações do produto</h2>
                <span className="rounded-full bg-[var(--pink-50)] px-3 py-1 text-xs font-bold text-[var(--pink)]">Page Pro</span>
              </div>
              {visibleBlocks.length === 0 ? (
                <div className="grid min-h-[180px] place-items-center rounded-[8px] border border-dashed border-[#dcdce3] text-center text-sm text-[#8a8d9a]">
                  Adicione blocos para visualizar a página do produto.
                </div>
              ) : (
                <div className="space-y-5">
                  {visibleBlocks.map((block, index) => (
                    <BlockPreview key={`${block.type}-${index}`} block={block} isMobile={isMobile} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockPreview({ block, isMobile }: { block: BlockData; isMobile: boolean }) {
  const content = block.content;
  const title = block.title;
  const body = renderBlockBody(block, isMobile);

  if (!body) return null;

  if (block.effect === 'ACCORDION') {
    return (
      <details className="rounded-[8px] border border-[#e8e8e8] bg-white" open>
        <summary className="cursor-pointer px-4 py-3 text-sm font-bold">{title || 'Detalhes'}</summary>
        <div className="px-4 pb-4">{body}</div>
      </details>
    );
  }

  if (block.effect === 'COLLAPSE') {
    return (
      <section>
        {title && <h3 className="mb-3 text-base font-bold">{title}</h3>}
        <div className="max-h-[160px] overflow-hidden">{body}</div>
        <button type="button" className="mt-2 text-sm font-bold text-[#2563eb]">Ver mais</button>
      </section>
    );
  }

  return (
    <section>
      {title && <h3 className="mb-3 text-base font-bold">{title}</h3>}
      {body}
    </section>
  );
}

function renderBlockBody(block: BlockData, isMobile: boolean) {
  const c = block.content;

  switch (block.type) {
    case 'DESCRIPTION':
      return <div className="prose prose-sm max-w-none leading-7 text-[#374151]" dangerouslySetInnerHTML={{ __html: (c.html as string) || '' }} />;

    case 'FEATURES': {
      const cols = isMobile ? 1 : Number(c.columns ?? 1);
      const items = (c.items as { icon?: string; text?: string }[] | undefined) ?? [];
      return (
        <ul className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(cols, 3))}, minmax(0, 1fr))` }}>
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-[#374151]">
              <span className="text-[#2f80b8]"><Icon name={item.icon || 'check'} /></span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      );
    }

    case 'IMAGES': {
      const items = (c.items as { desktopUrl?: string; mobileUrl?: string; url?: string; alt?: string; caption?: string }[] | undefined) ?? [];
      return (
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-[repeat(auto-fit,minmax(160px,1fr))]'}`}>
          {items.map((item, index) => {
            const src = (isMobile && item.mobileUrl) ? item.mobileUrl : item.desktopUrl || item.url || item.mobileUrl;
            if (!src) return null;
            return (
              <figure key={index} className="m-0">
                <img src={src} alt={item.alt ?? ''} className="w-full rounded-[4px] border border-[#eeeeee]" />
                {item.caption && <figcaption className="mt-1 text-xs text-[#6b7280]">{item.caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      );
    }

    case 'BADGES': {
      const items = (c.items as { label?: string; icon?: string; color?: string; imageUrl?: string; imageDesktopUrl?: string; imageMobileUrl?: string }[] | undefined) ?? [];
      return (
        <div className={`flex flex-wrap gap-3 ${c.layout === 'grid' ? 'grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))]' : ''}`}>
          {items.map((item, index) => {
            const color = item.color || '#2f80b8';
            const src = (isMobile && item.imageMobileUrl) ? item.imageMobileUrl : item.imageDesktopUrl || item.imageUrl || item.imageMobileUrl;
            return (
              <span key={index} className="inline-flex items-center gap-2 rounded-[4px] border bg-white px-3 py-2 text-sm" style={{ color, borderColor: `${color}40` }}>
                {src ? <img src={src} alt="" className="h-8 w-8 object-contain" /> : <Icon name={item.icon || 'check'} />}
                <span>{item.label}</span>
              </span>
            );
          })}
        </div>
      );
    }

    case 'TABLE': {
      const rows = (c.rows as ({ label?: string; value?: string } | string[])[] | undefined) ?? [];
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {rows.map((row, index) => {
                const label = Array.isArray(row) ? row[0] : row.label;
                const value = Array.isArray(row) ? row[1] : row.value;
                return (
                  <tr key={index} className={index % 2 === 1 ? 'bg-[#fafafa]' : undefined}>
                    <th className="border-b border-[#eeeeee] px-3 py-2 text-left font-bold text-[#374151]">{label}</th>
                    <td className="border-b border-[#eeeeee] px-3 py-2 text-[#4b5563]">{value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    case 'INFO_BOX': {
      const styles: Record<string, string> = {
        info: 'bg-[#eef4ff] text-[#2a4db5]',
        success: 'bg-[#edfbf0] text-[#1a6e37]',
        warning: 'bg-[#fff8e1] text-[#8a6400]',
        tip: 'bg-[#f3f0ff] text-[#4a28b5]',
      };
      return <div className={`rounded-[8px] px-4 py-3 text-sm ${styles[String(c.style ?? 'info')] ?? styles.info}`}>{String(c.text ?? '')}</div>;
    }

    case 'SEO_TEXT':
      return <div className="text-sm leading-7 text-[#4b5563]">{String(c.text ?? '')}</div>;

    case 'FAQ': {
      const items = (c.items as { question?: string; answer?: string }[] | undefined) ?? [];
      return (
        <div className="divide-y divide-[#eeeeee] rounded-[8px] border border-[#eeeeee]">
          {items.map((item, index) => (
            <details key={index} className="px-4 py-3" open={index === 0}>
              <summary className="cursor-pointer text-sm font-bold">{item.question}</summary>
              <p className="mt-2 text-sm leading-6 text-[#4b5563]">{item.answer}</p>
            </details>
          ))}
        </div>
      );
    }

    case 'VIDEO':
      return <div className="grid aspect-video place-items-center rounded-[8px] bg-[#111827] text-sm font-bold text-white">Vídeo</div>;

    case 'CUSTOM_HTML':
      return <div dangerouslySetInnerHTML={{ __html: (c.html as string) || '' }} />;

    default:
      return null;
  }
}

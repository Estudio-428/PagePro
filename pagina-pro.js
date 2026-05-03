/**
 * pagina-pro.js — Script do storefront Nuvemshop
 *
 * Renderiza blocos do Página Pro e coleta eventos de analytics.
 * Instalado manualmente no tema via snippet no product.html/.tpl
 *
 * Snippet de instalação:
 * {% if product.metafields.pagina_pro.blocks %}
 *   <div id="pagina-pro-root" data-blocks="{{ product.metafields.pagina_pro.blocks | escape }}" data-product-id="{{ product.id }}"></div>
 *   <script src="{{ 'pagina-pro.js' | asset_url }}" defer></script>
 * {% endif %}
 */

(function () {
  'use strict';

  const ROOT_ID = 'pagina-pro-root';
  const API_BASE = 'https://SEU_APP_URL.vercel.app'; // substituir na build

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  function init() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    let blocks;
    try {
      blocks = JSON.parse(root.dataset.blocks || '[]');
    } catch (e) {
      console.warn('[PaginaPro] Falha ao parsear blocos:', e);
      return;
    }

    const productId = parseInt(root.dataset.productId || '0');

    renderBlocks(root, blocks);
    trackEvent('page_view', productId, {});
    setupScrollTracking(productId);
  }

  // ── Renderização de blocos ─────────────────────────────────────────────────

  function renderBlocks(container, blocks) {
    const sorted = [...blocks].sort((a, b) => a.order - b.order);
    const wrapper = document.createElement('div');
    wrapper.className = 'pagina-pro-blocks';
    wrapper.style.cssText = 'font-family: inherit; color: inherit;';

    sorted.forEach(block => {
      const el = renderBlock(block);
      if (el) wrapper.appendChild(el);
    });

    container.replaceWith(wrapper);
  }

  function renderBlock(block) {
    const c = block.config || {};
    switch (block.type) {
      case 'rich_text':   return renderRichText(c);
      case 'specs_table': return renderSpecsTable(c);
      case 'faq':         return renderFaq(block);
      case 'image':       return renderImage(c);
      case 'video':       return renderVideo(block);
      case 'badges':      return renderBadges(c);
      case 'seo_text':    return renderSeoText(c);
      default:            return null;
    }
  }

  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'style') e.style.cssText = v;
      else if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v);
    });
    (children || []).forEach(child => child && e.appendChild(child));
    return e;
  }

  function text(str) { return document.createTextNode(str); }

  function section(children, extraStyle) {
    return el('div', {
      style: `padding: 24px 0; border-bottom: 1px solid #f0f0f0; ${extraStyle || ''}`
    }, children);
  }

  function h3(content) {
    const t = el('h3', { style: 'margin: 0 0 16px; font-size: 20px; font-weight: 600;' });
    t.textContent = content;
    return t;
  }

  function renderRichText(c) {
    const inner = [];
    if (c.title) inner.push(h3(c.title));
    if (c.content) inner.push(el('div', { style: 'line-height: 1.7; color: #333;', html: c.content }));
    return section(inner);
  }

  function renderSpecsTable(c) {
    const rows = (c.rows || []).map((row, i) =>
      el('tr', { style: `background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}` }, [
        el('td', { style: 'padding:10px 16px;font-weight:500;width:40%;border-bottom:1px solid #eee' }, [text(row.label)]),
        el('td', { style: 'padding:10px 16px;color:#555;border-bottom:1px solid #eee' }, [text(row.value || '—')]),
      ])
    );
    const table = el('table', { style: 'width:100%;border-collapse:collapse;' }, [
      el('tbody', {}, rows),
    ]);
    const inner = [];
    if (c.title) inner.push(h3(c.title));
    inner.push(table);
    return section(inner);
  }

  function renderFaq(block) {
    const c = block.config || {};
    const productId = parseInt(document.getElementById(ROOT_ID)?.dataset?.productId || document.querySelector('[data-product-id]')?.dataset?.productId || '0');
    const items = (c.items || []).map((item, idx) => {
      const details = el('details', { style: 'margin-bottom:8px;border:1px solid #eee;border-radius:6px;' }, [
        el('summary', { style: 'padding:12px 16px;cursor:pointer;font-weight:500;' }, [text(item.question)]),
        el('p', { style: 'padding:0 16px 12px;margin:0;color:#555;line-height:1.6;' }, [text(item.answer)]),
      ]);
      details.addEventListener('toggle', () => {
        if (details.open) {
          trackEvent('block_interaction', productId, { blockType: 'faq', blockId: block.id, itemIndex: idx, question: item.question.slice(0, 50) });
        }
      });
      return details;
    });
    const inner = [];
    if (c.title) inner.push(h3(c.title));
    inner.push(...items);
    return section(inner);
  }

  function renderImage(c) {
    if (!c.url) return null;
    const isContained = c.width === 'contained';
    const img = el('img', {
      src: c.url,
      alt: c.alt || '',
      style: `width:100%;display:block;${isContained ? 'max-width:800px;border-radius:8px;' : ''}`,
    });
    const inner = [img];
    if (c.caption) inner.push(el('p', { style: 'text-align:center;font-size:13px;color:#888;margin:8px 0 0;' }, [text(c.caption)]));
    return section(inner, isContained ? 'padding: 24px 32px;' : 'padding: 0;');
  }

  function renderVideo(block) {
    const c = block.config || {};
    const productId = parseInt(document.querySelector('[data-product-id]')?.dataset?.productId || '0');
    if (!c.url) return null;
    const embedUrl = getEmbedUrl(c.url);
    if (!embedUrl) return null;

    const wrapper = el('div', { style: 'position:relative;padding-bottom:56.25%;height:0;' });
    const iframe = el('iframe', {
      src: embedUrl,
      frameborder: '0',
      allowfullscreen: 'true',
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      style: 'position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:8px;',
    });
    wrapper.appendChild(iframe);

    // Tracking de play via postMessage
    window.addEventListener('message', function handler(e) {
      if (e.data?.event === 'onStateChange' && e.data?.info === 1) {
        trackEvent('block_interaction', productId, { blockType: 'video', blockId: block.id });
        window.removeEventListener('message', handler);
      }
    });

    const inner = [];
    if (c.title) inner.push(h3(c.title));
    inner.push(wrapper);
    return section(inner);
  }

  function renderBadges(c) {
    const badges = (c.items || []).map(badge =>
      el('span', {
        style: `display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:500;background:${badge.color || '#00875A'}18;color:${badge.color || '#00875A'};border:1px solid ${badge.color || '#00875A'}40;`,
      }, [text(`${badge.icon || ''} ${badge.label}`.trim())])
    );
    const badgeRow = el('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;' }, badges);
    return section([badgeRow]);
  }

  function renderSeoText(c) {
    return el('div', {
      style: c.hidden !== false ? 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;' : '',
      html: c.content,
    });
  }

  function getEmbedUrl(url) {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?enablejsapi=1`;
    const vi = url.match(/vimeo\.com\/(\d+)/);
    if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
    return null;
  }

  // ── Scroll tracking ────────────────────────────────────────────────────────

  function setupScrollTracking(productId) {
    const thresholds = [25, 50, 75, 100];
    const fired = new Set();

    function check() {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const pct = Math.round((scrolled / total) * 100);

      thresholds.forEach(t => {
        if (pct >= t && !fired.has(t)) {
          fired.add(t);
          trackEvent('scroll_depth', productId, { depth: t });
        }
      });
    }

    window.addEventListener('scroll', throttle(check, 500), { passive: true });
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  function trackEvent(eventType, productId, metadata) {
    if (!productId) return;
    navigator.sendBeacon(
      `${API_BASE}/api/analytics`,
      JSON.stringify({ eventType, productId, metadata })
    );
  }

  function throttle(fn, ms) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn.apply(this, args); }
    };
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

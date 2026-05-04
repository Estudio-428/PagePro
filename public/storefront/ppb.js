/**
 * Page Pro — Storefront Script
 * Versão: 1.0.0
 * 
 * Como usar no tema (adicionar em theme.liquid antes de </body>):
 *   <script src="https://seuapp.com/storefront/ppb.js" defer></script>
 *
 * O script lê o metafield "page_pro.page_blocks" do produto
 * e injeta os blocos no container #ppb-container da página de produto.
 *
 * No tema, adicione onde quiser exibir os blocos:
 *   <div id="ppb-container" data-product-id="{{ product.id }}"></div>
 */
(function () {
  'use strict';

  const DEFAULT_APP_URL = 'https://nvapp428-production.up.railway.app';

  // Ícones SVG inline para features (subset básico)
  const ICONS = {
    check: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    star: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.9 3.8 4.2.6-3 2.9.7 4.2L8 10.4l-3.8 2 .7-4.2-3-2.9 4.2-.6z"/></svg>',
    shield: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L3 4v4c0 3 2.5 5.4 5 6 2.5-.6 5-3 5-6V4L8 2z" stroke="currentColor" stroke-width="1.5"/></svg>',
    truck: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M11 7h3l1 3v2h-4V7z" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="13" r="1.5" fill="currentColor"/><circle cx="12.5" cy="13" r="1.5" fill="currentColor"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v5M8 5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  };

  function getIcon(name) {
    return ICONS[name] || ICONS.check;
  }

  // ---- Renderers por tipo de bloco ----

  const renderers = {
    DESCRIPTION({ content }) {
      return `<div class="ppb-block-description">${content.html || ''}</div>`;
    },

    FEATURES({ content }) {
      const cols = content.columns || 1;
      const items = (content.items || [])
        .map(f => `<li class="ppb-feature-item">
          <span class="ppb-feature-icon">${getIcon(f.icon || 'check')}</span>
          <span class="ppb-feature-text">${escapeHtml(f.text)}</span>
        </li>`)
        .join('');
      return `<ul class="ppb-features ppb-features-cols-${cols}">${items}</ul>`;
    },

    IMAGES({ content }) {
      const layout = content.layout || 'grid';
      const items = (content.items || [])
        .map(img => {
          const image = responsiveImage(img, 'ppb-image', img.alt || '');
          if (!image) return '';
          return `<div class="ppb-image-item">
          ${image}
          ${img.caption ? `<p class="ppb-image-caption">${escapeHtml(img.caption)}</p>` : ''}
        </div>`;
        })
        .join('');
      return `<div class="ppb-images ppb-images-${layout}">${items}</div>`;
    },

    BADGES({ content }) {
      const layout = content.layout || 'row';
      const items = (content.items || [])
        .map(badge => {
          const image = responsiveImage({
            desktopUrl: badge.imageDesktopUrl || badge.imageUrl,
            mobileUrl: badge.imageMobileUrl,
            url: badge.imageUrl,
          }, 'ppb-badge-image', badge.label || '');
          const icon = !image && badge.icon ? `<span class="ppb-badge-icon">${getIcon(badge.icon)}</span>` : '';
          return `<div class="ppb-badge" ${badge.color ? `style="--ppb-badge-color:${escapeAttr(badge.color)}"` : ''}>
          ${image || icon}
          <span>${escapeHtml(badge.label)}</span>
        </div>`;
        })
        .join('');
      return `<div class="ppb-badges ppb-badges-${layout}">${items}</div>`;
    },

    TABLE({ content }) {
      const rows = content.rows || [];
      const headers = content.headers;
      const striped = content.striped ? 'ppb-table-striped' : '';

      let thead = '';
      if (headers && headers.length) {
        thead = `<thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
      }

      const tbody = rows.map(row => {
        if (Array.isArray(row)) {
          return `<tr>${row.map(cell => `<td>${escapeHtml(String(cell))}</td>`).join('')}</tr>`;
        }
        return `<tr><th scope="row">${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`;
      }).join('');

      return `<div class="ppb-table-wrapper"><table class="ppb-table ${striped}">${thead}<tbody>${tbody}</tbody></table></div>`;
    },

    INFO_BOX({ content }) {
      const style = content.style || 'info';
      const icon = content.icon ? `<span class="ppb-infobox-icon">${getIcon(content.icon)}</span>` : '';
      return `<div class="ppb-infobox ppb-infobox-${style}">${icon}<p>${escapeHtml(content.text || '')}</p></div>`;
    },

    SEO_TEXT({ content }) {
      const mode = content.displayMode || 'collapsed';
      if (mode === 'hidden') {
        // Visualmente oculto mas presente no DOM para indexação
        return `<div class="ppb-seo-text" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">${content.text || ''}</div>`;
      }
      // collapsed = usa o efeito COLLAPSE do bloco pai
      return `<div class="ppb-seo-text">${content.text || ''}</div>`;
    },

    VIDEO({ content }) {
      const url = content.url || '';
      const embedUrl = getVideoEmbedUrl(url);
      if (!embedUrl) return '';
      return `<div class="ppb-video-wrapper">
        <iframe src="${embedUrl}" frameborder="0" allowfullscreen loading="lazy" title="${escapeAttr(content.title || 'Vídeo')}"></iframe>
      </div>`;
    },

    FAQ({ content }) {
      const items = (content.items || []).map((item, i) => `
        <div class="ppb-faq-item">
          <button class="ppb-faq-question" aria-expanded="false" aria-controls="ppb-faq-ans-${i}">
            ${escapeHtml(item.question)}
            <span class="ppb-faq-chevron" aria-hidden="true"></span>
          </button>
          <div class="ppb-faq-answer" id="ppb-faq-ans-${i}" hidden>
            ${escapeHtml(item.answer)}
          </div>
        </div>`).join('');
      return `<div class="ppb-faq">${items}</div>`;
    },

    CUSTOM_HTML({ content }) {
      // HTML livre — conteúdo é de responsabilidade do lojista
      return `<div class="ppb-custom-html">${content.html || ''}</div>`;
    },
  };

  // ---- Aplicadores de efeito ----

  function wrapWithEffect(html, block) {
    const effect = block.effect;
    const title = block.title || '';
    const blockId = `ppb-block-${block.id}`;

    if (effect === 'ACCORDION') {
      return `<div class="ppb-accordion" id="${blockId}">
        <button class="ppb-accordion-trigger" aria-expanded="false" aria-controls="${blockId}-content">
          ${escapeHtml(title)}
          <span class="ppb-accordion-icon" aria-hidden="true"></span>
        </button>
        <div class="ppb-accordion-content" id="${blockId}-content" hidden>
          ${html}
        </div>
      </div>`;
    }

    if (effect === 'COLLAPSE') {
      return `<div class="ppb-collapse" id="${blockId}">
        ${title ? `<h3 class="ppb-block-title">${escapeHtml(title)}</h3>` : ''}
        <div class="ppb-collapse-inner">${html}</div>
        <button class="ppb-collapse-toggle" aria-controls="${blockId}-inner" aria-expanded="false">
          <span class="ppb-show-text">Ver mais</span>
          <span class="ppb-hide-text" hidden>Ver menos</span>
        </button>
      </div>`;
    }

    // NONE ou TABS (TABS é agrupado externamente)
    return `<div class="ppb-block" id="${blockId}">
      ${title ? `<h3 class="ppb-block-title">${escapeHtml(title)}</h3>` : ''}
      ${html}
    </div>`;
  }

  // ---- Render principal ----

  function renderBlocks(blocks, container) {
    // Separa blocos com TABS para agrupar
    const tabGroups = [];
    const normalBlocks = [];
    let currentTabGroup = null;

    for (const block of blocks) {
      if (block.effect === 'TABS') {
        if (!currentTabGroup) {
          currentTabGroup = [];
          tabGroups.push(currentTabGroup);
        }
        currentTabGroup.push(block);
      } else {
        currentTabGroup = null;
        normalBlocks.push({ block, isTab: false });
      }
    }

    // Insere grupos de tab na posição correta
    let html = '';
    let tabGroupIdx = 0;
    for (const block of blocks) {
      if (block.effect === 'TABS') {
        if (tabGroups[tabGroupIdx] && tabGroups[tabGroupIdx][0] === block) {
          html += renderTabGroup(tabGroups[tabGroupIdx]);
          tabGroupIdx++;
        }
        continue;
      }
      const renderer = renderers[block.type];
      if (!renderer) continue;
      const blockHtml = renderer(block);
      html += wrapWithEffect(blockHtml, block);
    }

    container.innerHTML = html;
    attachInteractions(container);
  }

  function renderTabGroup(blocks) {
    const tabs = blocks.map((b, i) => `<button class="ppb-tab${i === 0 ? ' ppb-tab-active' : ''}" data-tab="${i}" aria-selected="${i === 0}">${escapeHtml(b.title || `Aba ${i + 1}`)}</button>`).join('');
    const panels = blocks.map((b, i) => {
      const renderer = renderers[b.type];
      const content = renderer ? renderer(b) : '';
      return `<div class="ppb-tab-panel${i === 0 ? ' ppb-tab-panel-active' : ''}" data-panel="${i}" ${i !== 0 ? 'hidden' : ''}>${content}</div>`;
    }).join('');

    return `<div class="ppb-tabs">
      <div class="ppb-tab-list" role="tablist">${tabs}</div>
      <div class="ppb-tab-panels">${panels}</div>
    </div>`;
  }

  // ---- Interações ----

  function attachInteractions(container) {
    // Accordion
    container.querySelectorAll('.ppb-accordion-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const content = document.getElementById(btn.getAttribute('aria-controls'));
        btn.setAttribute('aria-expanded', String(!expanded));
        if (content) content.hidden = expanded;
        btn.classList.toggle('ppb-open', !expanded);
      });
    });

    // Collapse / ver mais
    container.querySelectorAll('.ppb-collapse').forEach(el => {
      const inner = el.querySelector('.ppb-collapse-inner');
      const toggle = el.querySelector('.ppb-collapse-toggle');
      if (!inner || !toggle) return;

      // Limita altura inicial
      inner.style.maxHeight = '120px';
      inner.style.overflow = 'hidden';

      toggle.addEventListener('click', () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        inner.style.maxHeight = isExpanded ? '120px' : 'none';
        toggle.setAttribute('aria-expanded', String(!isExpanded));
        toggle.querySelector('.ppb-show-text').hidden = !isExpanded;
        toggle.querySelector('.ppb-hide-text').hidden = isExpanded;
      });
    });

    // FAQ
    container.querySelectorAll('.ppb-faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const answer = document.getElementById(btn.getAttribute('aria-controls'));
        btn.setAttribute('aria-expanded', String(!expanded));
        if (answer) answer.hidden = expanded;
        btn.classList.toggle('ppb-open', !expanded);
      });
    });

    // Tabs
    container.querySelectorAll('.ppb-tabs').forEach(tabsEl => {
      tabsEl.querySelectorAll('.ppb-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const idx = tab.dataset.tab;
          tabsEl.querySelectorAll('.ppb-tab').forEach(t => {
            t.classList.toggle('ppb-tab-active', t.dataset.tab === idx);
            t.setAttribute('aria-selected', String(t.dataset.tab === idx));
          });
          tabsEl.querySelectorAll('.ppb-tab-panel').forEach(p => {
            const active = p.dataset.panel === idx;
            p.classList.toggle('ppb-tab-panel-active', active);
            p.hidden = !active;
          });
        });
      });
    });
  }

  // ---- Utils ----

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function responsiveImage(item, className, alt) {
    const desktopUrl = item.desktopUrl || item.url || item.imageDesktopUrl || item.imageUrl;
    const mobileUrl = item.mobileUrl || item.imageMobileUrl;
    if (!desktopUrl && !mobileUrl) return '';

    const fallback = desktopUrl || mobileUrl;
    const source = mobileUrl
      ? `<source media="(max-width: 640px)" srcset="${escapeAttr(mobileUrl)}">`
      : '';

    return `<picture class="${className}-picture">${source}<img class="${className}" src="${escapeAttr(fallback)}" alt="${escapeAttr(alt || '')}" loading="lazy"></picture>`;
  }

  function getVideoEmbedUrl(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube') || u.hostname.includes('youtu.be')) {
        const id = u.searchParams.get('v') || u.pathname.split('/').pop();
        return `https://www.youtube.com/embed/${id}`;
      }
      if (u.hostname.includes('vimeo')) {
        const id = u.pathname.split('/').pop();
        return `https://player.vimeo.com/video/${id}`;
      }
    } catch {}
    return null;
  }

  // ---- Analytics ----

  const CURRENT_SCRIPT = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1] || null;
  })();

  const APP_URL = (function () {
    if (CURRENT_SCRIPT && CURRENT_SCRIPT.src) {
      try {
        const origin = new URL(CURRENT_SCRIPT.src).origin;
        if (!origin.includes('apps-scripts.tiendanube.com')) return origin;
      } catch {}
    }
    return DEFAULT_APP_URL;
  })();

  function sendEvent(storeId, productId, eventType, metadata) {
    if (!APP_URL || !storeId) return;
    try {
      fetch(APP_URL + '/api/analytics/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ storeId, productId: Number(productId), eventType, metadata }),
      }).catch(function () {});
    } catch {}
  }

  // ---- Bootstrap ----

  function getStoreId(container) {
    if (container?.dataset.storeId) return container.dataset.storeId;

    if (CURRENT_SCRIPT?.src) {
      try {
        const url = new URL(CURRENT_SCRIPT.src);
        const store = url.searchParams.get('store') || url.searchParams.get('storeId');
        if (store) return store;
      } catch {}
    }

    return window.__ppb_store_id || window.LS?.store?.id || '';
  }

  function getProductId(container) {
    return container?.dataset.productId || window.LS?.product?.id || '';
  }

  function findInsertionPoint() {
    return document.querySelector('[data-store="product-description"]')
      || document.querySelector('.js-product-description')
      || document.querySelector('.product-description')
      || document.querySelector('#product-description')
      || document.querySelector('.js-product-detail')
      || document.querySelector('.product-detail')
      || document.querySelector('.product-single')
      || document.querySelector('.js-product-container')
      || document.querySelector('[data-component="product"]')
      || document.querySelector('main')
      || document.body;
  }

  function ensureContainer() {
    let container = document.getElementById('ppb-container');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'ppb-container';
    container.setAttribute('data-page-pro-auto', 'true');

    const target = findInsertionPoint();
    if (target && target !== document.body) {
      target.insertAdjacentElement('afterend', container);
    } else {
      document.body.appendChild(container);
    }

    return container;
  }

  function ensureStylesheet() {
    if (!APP_URL || document.querySelector('link[data-page-pro-css]')) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = APP_URL + '/storefront/ppb.css';
    link.setAttribute('data-page-pro-css', 'true');
    document.head.appendChild(link);
  }

  async function fetchBlocks(storeId, productId) {
    if (!APP_URL || !storeId || !productId) return null;

    const url = `${APP_URL}/api/storefront/blocks?storeId=${encodeURIComponent(storeId)}&productId=${encodeURIComponent(productId)}`;
    const response = await fetch(url, { credentials: 'omit', mode: 'cors' });
    if (!response.ok) return null;
    return response.json();
  }

  async function init() {
    const hasThemeContainer = Boolean(document.getElementById('ppb-container'));
    const productIdFromLs = window.LS?.product?.id;
    if (!hasThemeContainer && !productIdFromLs) return;

    const container = ensureContainer();
    const productId = container.dataset.productId;
    if (!productId && productIdFromLs) container.dataset.productId = String(productIdFromLs);

    const productIdResolved = getProductId(container);
    const storeId = getStoreId(container);
    if (!productIdResolved || !storeId) return;

    // Priority 1: data-blocks attribute (server-side rendered by the theme)
    let blocksData = container.dataset.blocks;

    // Priority 2: window.__ppb_blocks variable set by theme
    if (!blocksData) {
      blocksData = window.__ppb_blocks;
    }

    if (!blocksData) {
      blocksData = await fetchBlocks(storeId, productIdResolved);
    }

    try {
      const data = typeof blocksData === 'string' ? JSON.parse(blocksData) : blocksData;
      if (data?.blocks?.length > 0) {
        ensureStylesheet();
        renderBlocks(data.blocks, container);
        sendEvent(storeId, productIdResolved, 'page_view', { templateId: data.templateId ?? null });
      } else if (container.dataset.pageProAuto === 'true') {
        container.remove();
      }
    } catch (e) {
      console.error('[PPB] Erro ao parsear blocos:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

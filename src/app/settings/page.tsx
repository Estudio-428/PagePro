'use client';

import { AppShell } from '@/components/AppShell';

const SNIPPET_CODE = `{% if product.metafields.page_pro.page_blocks %}
  <div id="ppb-container"
       data-product-id="{{ product.id }}"
       data-store-id="{{ store.id }}"
       data-blocks="{{ product.metafields.page_pro.page_blocks | escape }}">
  </div>
  <link rel="stylesheet" href="{{ 'ppb.css' | asset_url }}">
  <script src="{{ 'ppb.js' | asset_url }}" defer></script>
{% endif %}`;

export default function SettingsPage() {
  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => alert('Copiado!'));
  }

  return (
    <AppShell
      title="Configurações"
      subtitle="Instalação do snippet, permissões e endpoints operacionais do aplicativo."
      contentClassName="max-w-4xl p-7"
    >
        {/* Snippet */}
        <div className="pp-card mb-6 p-6">
          <h2 className="font-display mb-2 text-xl font-bold">Snippet do tema</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Cole este código no arquivo <code className="rounded bg-[var(--surface-2)] px-1 text-xs">product.html</code> do seu tema
            antes do fechamento de <code className="rounded bg-[var(--surface-2)] px-1 text-xs">{'</article>'}</code>.
          </p>
          <div className="relative">
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-[10px] bg-[var(--sidebar)] p-4 text-xs text-[#b9fbcf]">
              {SNIPPET_CODE}
            </pre>
            <button
              onClick={() => copy(SNIPPET_CODE)}
              className="absolute right-3 top-3 rounded border border-[var(--line-strong)] bg-white px-2 py-1 text-xs font-bold text-[var(--foreground)] hover:border-[var(--foreground)]"
            >
              Copiar
            </button>
          </div>
          <p className="mt-3 text-xs text-[var(--muted-2)]">
            Os arquivos <code>ppb.js</code> e <code>ppb.css</code> devem ser enviados para os assets do tema via painel da Nuvemshop.
          </p>
        </div>

        {/* Escopos */}
        <div className="pp-card mb-6 p-6">
          <h2 className="font-display mb-2 text-xl font-bold">Escopos OAuth necessários</h2>
          <div className="flex flex-wrap gap-2">
            {['read_products', 'write_products', 'read_metafields', 'write_metafields'].map((s) => (
              <span key={s} className="rounded-full bg-[var(--pink-50)] px-2 py-1 font-mono text-xs font-bold text-[var(--pink-deep)]">{s}</span>
            ))}
          </div>
        </div>

        {/* LGPD endpoints */}
        <div className="pp-card p-6">
          <h2 className="font-display mb-2 text-xl font-bold">Endpoints LGPD</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">Configure estas URLs no Portal de Parceiros Nuvemshop:</p>
          <div className="space-y-2">
            {[
              ['Store redact',     '/api/webhooks/lgpd/store-redact'],
              ['Customer redact',  '/api/webhooks/lgpd/customer-redact'],
              ['Data request',     '/api/webhooks/lgpd/data-request'],
            ].map(([label, path]) => (
              <div key={path} className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] px-4 py-2.5">
                <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
                <code className="font-mono text-xs text-[var(--muted)]">{path}</code>
              </div>
            ))}
          </div>
        </div>
    </AppShell>
  );
}

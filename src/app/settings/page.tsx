'use client';

import Link from 'next/link';

function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
      <span className="font-semibold text-gray-900">Product Page Builder</span>
      <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Analytics</Link>
      <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900">Produtos</Link>
      <Link href="/import" className="text-sm text-gray-600 hover:text-gray-900">Importar</Link>
      <Link href="/settings" className="text-sm text-blue-600 font-medium">Configurações</Link>
    </nav>
  );
}

const SNIPPET_CODE = `{% if product.metafields.product_page_builder.page_blocks %}
  <div id="ppb-container"
       data-product-id="{{ product.id }}"
       data-blocks="{{ product.metafields.product_page_builder.page_blocks | escape }}">
  </div>
  <link rel="stylesheet" href="{{ 'ppb.css' | asset_url }}">
  <script src="{{ 'ppb.js' | asset_url }}" defer></script>
{% endif %}`;

export default function SettingsPage() {
  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => alert('Copiado!'));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Configurações</h1>

        {/* Snippet */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Snippet do tema</h2>
          <p className="text-sm text-gray-500 mb-4">
            Cole este código no arquivo <code className="text-xs bg-gray-100 px-1 rounded">product.html</code> do seu tema
            (Personalizar tema → Editar código), antes do fechamento de <code className="text-xs bg-gray-100 px-1 rounded">{'</article>'}</code>.
          </p>
          <div className="relative">
            <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
              {SNIPPET_CODE}
            </pre>
            <button
              onClick={() => copy(SNIPPET_CODE)}
              className="absolute top-3 right-3 text-xs bg-white text-gray-700 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
            >
              Copiar
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Os arquivos <code>ppb.js</code> e <code>ppb.css</code> devem ser enviados para os assets do tema via painel da Nuvemshop.
          </p>
        </div>

        {/* Escopos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Escopos OAuth necessários</h2>
          <div className="flex flex-wrap gap-2">
            {['read_products', 'write_products', 'read_metafields', 'write_metafields'].map((s) => (
              <span key={s} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-mono">{s}</span>
            ))}
          </div>
        </div>

        {/* LGPD endpoints */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Endpoints LGPD</h2>
          <p className="text-sm text-gray-500 mb-4">Configure estas URLs no Portal de Parceiros Nuvemshop:</p>
          <div className="space-y-2">
            {[
              ['Store redact',     '/api/webhooks/lgpd/store-redact'],
              ['Customer redact',  '/api/webhooks/lgpd/customer-redact'],
              ['Data request',     '/api/webhooks/lgpd/data-request'],
            ].map(([label, path]) => (
              <div key={path} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                <span className="text-sm text-gray-700">{label}</span>
                <code className="text-xs text-gray-500 font-mono">{path}</code>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

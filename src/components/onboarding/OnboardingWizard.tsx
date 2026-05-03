'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = [
  {
    label: 'Instalar snippet',
    title: 'Instale o snippet no seu tema',
    description: 'O snippet é um pequeno código que lê os blocos salvos e os renderiza na página do produto. Instalação feita uma única vez.',
  },
  {
    label: 'Criar template',
    title: 'Crie seu primeiro template',
    description: 'Templates são conjuntos de blocos reutilizáveis. Crie um com os blocos que quer exibir nas páginas de produto.',
  },
  {
    label: 'Aplicar',
    title: 'Aplique em um produto',
    description: 'Selecione um produto e aplique o template. O conteúdo é salvo como metafield e renderizado automaticamente.',
  },
];

const SNIPPET = `{% if product.metafields.page_pro.page_blocks %}
  <div id="ppb-container"
       data-product-id="{{ product.id }}"
       data-blocks="{{ product.metafields.page_pro.page_blocks | escape }}">
  </div>
  <link rel="stylesheet" href="{{ 'ppb.css' | asset_url }}">
  <script src="{{ 'ppb.js' | asset_url }}" defer></script>
{% endif %}`;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else router.push('/products');
  }

  const current = STEPS[step];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao Page Pro</h1>
        <p className="text-sm text-gray-500 mt-2">Siga os 3 passos abaixo para começar a melhorar a conversão das suas páginas de produto.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Passo {step + 1}: {current.title}</h2>
        <p className="text-sm text-gray-500 mb-4">{current.description}</p>

        {step === 0 && (
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
              Acesse o admin da Nuvemshop → Personalizar tema → Editar código → arquivo <strong>product.html</strong> e cole o snippet antes de <code>{'</article>'}</code>.
            </div>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">{SNIPPET}</pre>
              <button onClick={copy} className={`absolute top-2 right-2 text-xs px-2 py-1 rounded border ${copied ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            O editor tem preview em tempo real com blocos de descrição, especificações, FAQ, vídeo e muito mais.
          </div>
        )}

        {step === 2 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            Após aplicar, o conteúdo fica disponível na loja em segundos. Pode aplicar em 1 produto ou em centenas de uma vez.
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-400 hover:text-gray-600">Pular</button>
          <button onClick={next} className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700">
            {step < STEPS.length - 1 ? 'Próximo passo' : 'Ir para produtos'}
          </button>
        </div>
      </div>
    </div>
  );
}

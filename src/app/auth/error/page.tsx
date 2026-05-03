'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { NUVEMSHOP_APP_ID } from '@/lib/config/app';

const MESSAGES: Record<string, string> = {
  missing_params: 'Parâmetros de autorização ausentes.',
  oauth_failed: 'Falha na autenticação com a Nuvemshop. Tente novamente.',
};

function ErrorContent() {
  const params = useSearchParams();
  const reason = params.get('reason') ?? 'unknown';
  const message = MESSAGES[reason] ?? 'Erro desconhecido.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Erro de autenticação</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <a
          href={`https://www.tiendanube.com/apps/${NUVEMSHOP_APP_ID}/authorize`}
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Tentar novamente
        </a>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}

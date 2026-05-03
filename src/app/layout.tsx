import type { Metadata } from 'next';
import './globals.css';
import '@nimbus-ds/styles/dist/index.css';
import '@nimbus-ds/styles/dist/themes/next.css';
import { NexoSetup, NexoErrorBoundary } from '@/components/NexoProvider';

export const metadata: Metadata = {
  title: 'Page Pro',
  description: 'Customize as páginas de produto da sua loja Nuvemshop com blocos dinâmicos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="nimbus-next min-h-screen bg-gray-50 text-gray-900 antialiased">
        <NexoSetup />
        <NexoErrorBoundary>
          {children}
        </NexoErrorBoundary>
      </body>
    </html>
  );
}

'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { NexoClient } from '@tiendanube/nexo';

// Lazy singleton — only created in the browser
let _app: NexoClient | null = null;

function getApp(): NexoClient {
  if (!_app) {
    // Dynamic require avoids module-level window access during SSR
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { create } = require('@tiendanube/nexo') as typeof import('@tiendanube/nexo');
    _app = create({
      clientId: process.env.NEXT_PUBLIC_APP_ID ?? '',
      log: process.env.NODE_ENV === 'development',
    });
  }
  return _app;
}

export function NexoSetup() {
  useEffect(() => {
    const { connect, iAmReady } = require('@tiendanube/nexo') as typeof import('@tiendanube/nexo');
    const app = getApp();
    connect(app).then(() => iAmReady(app));
  }, []);

  return null;
}

export function NexoErrorBoundary({ children }: { children: ReactNode }) {
  const appRef = useRef<NexoClient | null>(null);

  // Defer ErrorBoundary creation to browser — render children directly on SSR
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  if (!appRef.current) {
    appRef.current = getApp();
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ErrorBoundary } = require('@tiendanube/nexo') as typeof import('@tiendanube/nexo');
  return <ErrorBoundary nexo={appRef.current}>{children}</ErrorBoundary>;
}

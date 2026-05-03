'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { NexoClient } from '@tiendanube/nexo';
import { connectNexo, getNexoApp } from '@/lib/nexo/client';

export function NexoSetup() {
  useEffect(() => {
    connectNexo().catch(() => {
      // Allow standalone OAuth/debug pages to render outside the embedded admin.
    });
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
    appRef.current = getNexoApp();
  }

  const { ErrorBoundary } = require('@tiendanube/nexo') as typeof import('@tiendanube/nexo');
  return <ErrorBoundary nexo={appRef.current}>{children}</ErrorBoundary>;
}

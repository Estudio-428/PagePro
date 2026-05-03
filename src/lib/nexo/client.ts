'use client';

import type { NexoClient } from '@tiendanube/nexo';
import { NUVEMSHOP_APP_ID } from '@/lib/config/app';

let nexoApp: NexoClient | null = null;
let connectPromise: Promise<void> | null = null;
const NEXO_CONNECT_TIMEOUT_MS = 1200;

function isEmbeddedContext(): boolean {
  return typeof window !== 'undefined' && window.parent !== window;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('NEXO_TIMEOUT'));
    }, timeoutMs);

    promise
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timeout));
  });
}

export function getNexoApp(): NexoClient {
  if (!nexoApp) {
    // Nexo touches window during create(), so keep this strictly client-side.
    const { create } = require('@tiendanube/nexo') as typeof import('@tiendanube/nexo');
    nexoApp = create({
      clientId: NUVEMSHOP_APP_ID,
      log: process.env.NODE_ENV === 'development',
    });
  }

  return nexoApp;
}

export function connectNexo(): Promise<void> {
  if (!isEmbeddedContext()) {
    return Promise.resolve();
  }

  if (!connectPromise) {
    const { connect, iAmReady } = require('@tiendanube/nexo') as typeof import('@tiendanube/nexo');
    const app = getNexoApp();
    connectPromise = connect(app)
      .then(() => {
        iAmReady(app);
      })
      .catch((error: unknown) => {
        connectPromise = null;
        throw error;
      });
  }

  return connectPromise;
}

export async function getNexoSessionToken(): Promise<string | null> {
  if (!isEmbeddedContext()) {
    return null;
  }

  try {
    await withTimeout(connectNexo(), NEXO_CONNECT_TIMEOUT_MS);
    const { getSessionToken } = require('@tiendanube/nexo') as typeof import('@tiendanube/nexo');
    return await withTimeout(getSessionToken(getNexoApp()), NEXO_CONNECT_TIMEOUT_MS);
  } catch {
    // Outside the embedded admin, OAuth cookie auth can still be used.
    return null;
  }
}

function isSameOriginApiRequest(input: RequestInfo | URL): boolean {
  if (typeof window === 'undefined') return false;

  const rawUrl =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

  const url = new URL(rawUrl, window.location.origin);
  return url.origin === window.location.origin && url.pathname.startsWith('/api/');
}

export async function fetchWithNexoAuth(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  if (!isSameOriginApiRequest(input)) {
    return fetch(input, init);
  }

  const headers = new Headers(
    init.headers ?? (input instanceof Request ? input.headers : undefined)
  );

  if (!headers.has('Authorization')) {
    const token = await getNexoSessionToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  });
}

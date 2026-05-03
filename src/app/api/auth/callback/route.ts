import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { getSession } from '@/lib/auth/session';
import { nuvemshopRequest } from '@/lib/nuvemshop/api-client';
import { DEFAULT_PUBLIC_APP_URL } from '@/lib/config/app';

export const dynamic = 'force-dynamic';

const WEBHOOKS_TO_REGISTER = [
  'app/uninstalled',
  'product/created',
  'product/updated',
  'product/deleted',
];

function getAppBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')) {
    return configured.replace(/\/$/, '');
  }

  const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    return `${proto}://${forwardedHost}`.replace(/\/$/, '');
  }

  return DEFAULT_PUBLIC_APP_URL;
}

async function registerWebhooks(storeId: number, appBaseUrl: string) {
  try {
    const webhookUrl = `${appBaseUrl}/api/webhooks/nuvemshop`;
    const existing = await nuvemshopRequest<{ event: string }[]>(storeId, '/webhooks');
    const existingKeys = new Set(existing.map((w) => `${w.event}:${(w as { url?: string }).url ?? ''}`));

    await Promise.allSettled(
      WEBHOOKS_TO_REGISTER
        .filter((event) => !existingKeys.has(`${event}:${webhookUrl}`))
        .map((event) =>
          nuvemshopRequest(storeId, '/webhooks', {
            method: 'POST',
            body: { event, url: webhookUrl },
          })
        )
    );
  } catch (err) {
    console.error('[OAuth] Webhook registration error:', err);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const storeId = searchParams.get('store_id');
  const appBaseUrl = getAppBaseUrl(request);

  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/error?reason=missing_params', appBaseUrl)
    );
  }

  try {
    const tokenRes = await fetch(
      'https://www.tiendanube.com/apps/authorize/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.NUVEMSHOP_APP_ID!,
          client_secret: process.env.NUVEMSHOP_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          code,
        }),
      }
    );

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }

    const { access_token, scope, user_id } = await tokenRes.json();
    const numericStoreId = Number(user_id);

    if (!Number.isInteger(numericStoreId)) {
      throw new Error('Invalid OAuth store id');
    }

    if (storeId) {
      const callbackStoreId = Number(storeId);
      if (!Number.isInteger(callbackStoreId) || numericStoreId !== callbackStoreId) {
        throw new Error('OAuth store mismatch');
      }
    }

    await prisma.store.upsert({
      where: { storeId: numericStoreId },
      update: {
        accessToken: encrypt(access_token),
        scopes: scope,
        uninstalledAt: null,
        redactedAt: null,
        updatedAt: new Date(),
      },
      create: {
        storeId: numericStoreId,
        accessToken: encrypt(access_token),
        scopes: scope,
      },
    });

    // Register webhooks after install. Do not block install if the platform rejects one event.
    await registerWebhooks(numericStoreId, appBaseUrl);

    const session = await getSession();
    session.storeId = numericStoreId;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.redirect(
      new URL('/dashboard', appBaseUrl)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/error?reason=oauth_failed', appBaseUrl)
    );
  }
}

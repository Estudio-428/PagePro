import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { getSession } from '@/lib/auth/session';
import { nuvemshopRequest } from '@/lib/nuvemshop/api-client';

export const dynamic = 'force-dynamic';

const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nuvemshop`;

const WEBHOOKS_TO_REGISTER = [
  'app/uninstalled',
  'product/created',
  'product/updated',
  'product/deleted',
];

async function registerWebhooks(storeId: number) {
  try {
    const existing = await nuvemshopRequest<{ event: string }[]>(storeId, '/webhooks');
    const existingEvents = new Set(existing.map((w) => w.event));

    await Promise.allSettled(
      WEBHOOKS_TO_REGISTER
        .filter((event) => !existingEvents.has(event))
        .map((event) =>
          nuvemshopRequest(storeId, '/webhooks', {
            method: 'POST',
            body: { event, url: WEBHOOK_URL },
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

  if (!code || !storeId) {
    return NextResponse.redirect(
      new URL('/auth/error?reason=missing_params', request.url)
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

    // Register webhooks after install (fire-and-forget — non-blocking)
    registerWebhooks(numericStoreId);

    const session = await getSession();
    session.storeId = numericStoreId;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.redirect(
      new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL!)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/error?reason=oauth_failed', request.url)
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { getSession } from '@/lib/auth/session';

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
    // Trocar code pelo access_token
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
      throw new Error(`Token exchange falhou: ${tokenRes.status}`);
    }

    const { access_token, scope, user_id } = await tokenRes.json();

    // user_id === store_id na Nuvemshop
    const numericStoreId = Number(user_id);

    // Persistir / atualizar no banco
    await prisma.store.upsert({
      where: { storeId: numericStoreId },
      update: {
        accessToken: encrypt(access_token),
        scopes: scope,
        uninstalledAt: null,
        updatedAt: new Date(),
      },
      create: {
        storeId: numericStoreId,
        accessToken: encrypt(access_token),
        scopes: scope,
      },
    });

    // Criar sessão
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

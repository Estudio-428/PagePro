import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NUVEMSHOP_APP_ID } from '@/lib/config/app';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: 'connected',
      config: {
        appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
        appUrlIsLocalhost: Boolean(process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')),
        publicAppId: Boolean(NUVEMSHOP_APP_ID),
        publicAppIdFromEnv: Boolean(process.env.NEXT_PUBLIC_APP_ID),
        redirectUri: Boolean(process.env.NUVEMSHOP_REDIRECT_URI),
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'db_unreachable' }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { nuvemshopRequest } from '@/lib/nuvemshop/api-client';

export const dynamic = 'force-dynamic';

type NuvemshopStore = {
  id: number;
  name?: Record<string, string> | string;
  original_domain?: string;
  domains?: string[];
  logo?: string | null;
  main_language?: string;
};

function pickLocalized(value: Record<string, string> | string | undefined, locale = 'pt') {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] ?? value.pt ?? value.es ?? Object.values(value)[0] ?? '';
}

function normalizeLogo(logo?: string | null) {
  if (!logo) return null;
  return logo.startsWith('//') ? `https:${logo}` : logo;
}

export async function GET(request: NextRequest) {
  try {
    const storeId = await requireAuth(request);
    const store = await nuvemshopRequest<NuvemshopStore>(storeId, '/store', {
      params: { fields: 'id,name,original_domain,domains,logo,main_language' },
    });

    return NextResponse.json({
      store: {
        id: store.id,
        name: pickLocalized(store.name, store.main_language),
        domain: store.original_domain ?? store.domains?.[0],
        logo: normalizeLogo(store.logo),
      },
    });
  } catch (error: unknown) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.error('GET /api/store error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

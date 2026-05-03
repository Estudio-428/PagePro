import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

const API_BASE = 'https://api.nuvemshop.com.br/2025-03';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  params?: Record<string, string | number>;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAccessToken(storeId: number): Promise<string> {
  const store = await prisma.store.findUnique({ where: { storeId } });
  if (!store?.accessToken) {
    throw new Error(`Token não encontrado para store ${storeId}`);
  }
  return decrypt(store.accessToken);
}

export async function nuvemshopRequest<T>(
  storeId: number,
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = await getAccessToken(storeId);
  const { method = 'GET', body, params } = options;

  let url = `${API_BASE}/${storeId}${endpoint}`;

  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    );
    url += `?${qs.toString()}`;
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      method,
      headers: {
        'Authentication': `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PagePro/1.0',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    // Rate limit — aguarda e tenta de novo
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitMs = retryAfter
        ? parseInt(retryAfter) * 1000
        : INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      await sleep(waitMs);
      continue;
    }

    // Erro de servidor — backoff exponencial
    if (response.status >= 500 && attempt < MAX_RETRIES) {
      await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Nuvemshop API ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  throw new Error(`Nuvemshop API: máximo de tentativas atingido para ${endpoint}`);
}

// ---- Helpers de produto ----

export interface NuvemshopProduct {
  id: number;
  name: Record<string, string>;
  handle: Record<string, string>;
  description: string | null;
  images: { id: number; src: string }[];
}

export async function getProduct(storeId: number, productId: number) {
  return nuvemshopRequest<NuvemshopProduct>(storeId, `/products/${productId}`);
}

export async function listProducts(
  storeId: number,
  page = 1,
  perPage = 50
) {
  return nuvemshopRequest<NuvemshopProduct[]>(storeId, '/products', {
    params: { page, per_page: perPage },
  });
}

// ---- Helpers de metafield ----

export interface NuvemshopMetafield {
  id: number;
  namespace: string;
  key: string;
  value: string;
  description?: string;
  owner_resource: string;
  owner_id: number;
}

export const METAFIELD_NAMESPACE = 'page_pro';
export const METAFIELD_KEY = 'page_blocks';

export async function getProductMetafield(
  storeId: number,
  productId: number
): Promise<NuvemshopMetafield | null> {
  try {
    const fields = await nuvemshopRequest<NuvemshopMetafield[]>(
      storeId,
      `/products/${productId}/metafields`,
      { params: { namespace: METAFIELD_NAMESPACE, key: METAFIELD_KEY } }
    );
    return fields?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function upsertProductMetafield(
  storeId: number,
  productId: number,
  value: string,
  existingMetafieldId?: number
): Promise<NuvemshopMetafield> {
  if (existingMetafieldId) {
    return nuvemshopRequest<NuvemshopMetafield>(
      storeId,
      `/products/${productId}/metafields/${existingMetafieldId}`,
      {
        method: 'PUT',
        body: { value },
      }
    );
  }

  return nuvemshopRequest<NuvemshopMetafield>(
    storeId,
    `/products/${productId}/metafields`,
    {
      method: 'POST',
      body: {
        namespace: METAFIELD_NAMESPACE,
        key: METAFIELD_KEY,
        value,
        description: 'Blocos de conteúdo - Page Pro',
        owner_resource: 'Product',
        owner_id: productId,
      },
    }
  );
}

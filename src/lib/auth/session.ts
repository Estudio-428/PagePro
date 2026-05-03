import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export interface SessionData {
  storeId?: number;
  isLoggedIn?: boolean;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'page_pro_session',
  cookieOptions: {
    // none+secure obrigatório para apps embarcados em iframe cross-origin
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

function getBearerToken(request?: Request): string | null {
  const header = request?.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

async function getStoreIdFromNexoToken(request?: Request): Promise<number | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.NUVEMSHOP_CLIENT_SECRET!) as JwtPayload & Record<string, unknown>;
    const candidate =
      decoded.store_id ??
      decoded.storeId ??
      decoded.user_id ??
      decoded.userId ??
      decoded.sub;

    const storeId = Number(candidate);
    if (!Number.isInteger(storeId) || storeId <= 0) return null;

    const store = await prisma.store.findUnique({
      where: { storeId },
      select: { accessToken: true },
    });

    return store?.accessToken ? storeId : null;
  } catch {
    return null;
  }
}

export async function requireAuth(request?: Request): Promise<number> {
  const nexoStoreId = await getStoreIdFromNexoToken(request);
  if (nexoStoreId) return nexoStoreId;

  const session = await getSession();
  if (!session.isLoggedIn || !session.storeId) {
    throw new Error('UNAUTHORIZED');
  }
  return session.storeId;
}

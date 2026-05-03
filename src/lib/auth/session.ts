import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

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

export async function requireAuth(): Promise<number> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.storeId) {
    throw new Error('UNAUTHORIZED');
  }
  return session.storeId;
}

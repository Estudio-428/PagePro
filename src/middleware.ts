import { NextRequest, NextResponse } from 'next/server';

const redirects: Record<string, string> = {
  '/': '/products',
  '/settings': '/products',
  '/dashboard/settings': '/products',
  '/dashboard/products': '/products',
  '/dashboard/import': '/import',
  '/dashboard/editor': '/editor',
};

export function middleware(request: NextRequest) {
  const destination = redirects[request.nextUrl.pathname];

  if (!destination) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = destination;

  return NextResponse.redirect(url, 307);
}

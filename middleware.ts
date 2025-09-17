import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // No tocar API ni nuestras rutas de publicación/preview
  if (pathname.startsWith('/api')) return NextResponse.next();
  if (pathname.startsWith('/s/')) return NextResponse.next();
  if (pathname.startsWith('/preview/')) return NextResponse.next();

  // Home → public/index.html
  if (pathname === '/' || pathname === '/index') {
    const url = req.nextUrl.clone();
    url.pathname = '/index.html';
    return NextResponse.rewrite(url);
  }

  // CRM → public/crm/index.html
  if (pathname === '/crm' || pathname === '/crm/') {
    const url = req.nextUrl.clone();
    url.pathname = '/crm/index.html';
    return NextResponse.rewrite(url);
  }

  // Dejar pasar todo lo demás (incluye /publish, /publish-tester, etc.)
  return NextResponse.next();
}

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const p = url.pathname;

  // Dejar pasar API y rutas de publicación/preview
  if (p.startsWith('/api')) return NextResponse.next();
  if (p.startsWith('/s/')) return NextResponse.next();
  if (p.startsWith('/preview/')) return NextResponse.next();

  // Alias limpios para los HTML estáticos
  if (p === '/index.html') { url.pathname = '/'; return NextResponse.redirect(url, 307); }
  if (p === '/crm/index.html') { url.pathname = '/crm'; return NextResponse.redirect(url, 307); }

  return NextResponse.next();
}

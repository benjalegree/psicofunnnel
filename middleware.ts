// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

// Dominios base que NO debemos tocar (home y www)
const APEX = new Set(['psicofunnel.online', 'www.psicofunnel.online']);

// Palabras reservadas para no confundir con slugs
const RESERVED = new Set(['www', 'api', 'crm', 'preview', 's', '_next']);

// Slug válido: minúsculas, números y guiones (1-63 chars, sin guión al inicio/fin)
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

export function middleware(req: NextRequest) {
  const { nextUrl, headers } = req;
  const host = headers.get('host') || '';
  const pathname = nextUrl.pathname;

  // 1) Ignorar deploy previews (*.vercel.app)
  if (host.endsWith('.vercel.app')) return NextResponse.next();

  // 2) No tocar apex ni www (la home y /crm se sirven estáticos)
  if (APEX.has(host)) return NextResponse.next();

  // 3) No interceptar rutas internas de la app
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/s/') ||
    pathname.startsWith('/preview/') ||
    pathname.startsWith('/crm') ||
    pathname === '/' ||
    pathname === '/index.html'
  ) {
    return NextResponse.next();
  }

  // 4) Si hay subdominio {slug}.psicofunnel.online → reescribir a /s/{slug}
  const parts = host.split('.');
  if (parts.length >= 3) {
    const base = parts.slice(-2).join('.');
    const sub = parts.slice(0, -2).join('-'); // soporte a sub.sub → sub-sub

    if (base === 'psicofunnel.online' && !RESERVED.has(sub) && SLUG.test(sub)) {
      const url = nextUrl.clone();
      url.pathname = `/s/${sub}`;
      return NextResponse.rewrite(url);
    }
  }

  // Si no aplica nada, seguir normal
  return NextResponse.next();
}

// MUY IMPORTANTE: no ejecutar el middleware en rutas con punto (archivos .html, .ico, etc.)
export const config = {
  matcher: ['/((?!.*\\.).*)'],
};

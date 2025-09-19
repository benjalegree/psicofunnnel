import { NextResponse, type NextRequest } from 'next/server';

const APEX = new Set(['psicofunnel.online', 'www.psicofunnel.online']);
const RESERVED = new Set(['www', 'api', 'crm', 'preview', 's', '_next']);
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

export function middleware(req: NextRequest) {
  const { nextUrl, headers } = req;
  const host = headers.get('host') || '';
  const pathname = nextUrl.pathname;

  // Ignorar previews *.vercel.app
  if (host.endsWith('.vercel.app')) return NextResponse.next();

  // No tocar apex ni www
  if (APEX.has(host)) return NextResponse.next();

  // No interceptar rutas internas
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/s/') ||
    pathname.startsWith('/preview/') ||
    pathname.startsWith('/crm') ||
    pathname === '/' ||
    pathname === '/index.html'
  ) return NextResponse.next();

  // Subdominio {slug}.psicofunnel.online → /s/{slug}
  const parts = host.split('.');
  if (parts.length >= 3) {
    const base = parts.slice(-2).join('.');
    const sub = parts.slice(0, -2).join('-');
    if (base === 'psicofunnel.online' && !RESERVED.has(sub) && SLUG.test(sub)) {
      const url = nextUrl.clone();
      url.pathname = `/s/${sub}`;
      return NextResponse.rewrite(url);
    }
  }
  return NextResponse.next();
}

// No correr en archivos con punto (.html, .ico, etc.)
export const config = { matcher: ['/((?!.*\.).*)'] };

import { NextResponse, type NextRequest } from 'next/server';

const APEX = new Set(['psicofunnel.online', 'www.psicofunnel.online']);
const RESERVED = new Set(['www', 'api', 'crm', 'preview', 's', '_next']);
const BRAND = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

export function middleware(req: NextRequest) {
  const { nextUrl, headers } = req;
  const host = headers.get('host') || '';
  const pathname = nextUrl.pathname; // '/', '/lp2', '/a/b'

  // Ignore *.vercel.app
  if (host.endsWith('.vercel.app')) return NextResponse.next();

  // Don't touch apex/www
  if (APEX.has(host)) return NextResponse.next();

  // Ignore internal project routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/s/') ||
    pathname.startsWith('/preview/') ||
    pathname.startsWith('/crm')
  ) return NextResponse.next();

  // Extract subdomain (brand)
  const parts = host.split('.');
  if (parts.length >= 3) {
    const base = parts.slice(-2).join('.');
    const sub = parts.slice(0, -2).join('-'); // sub.sub -> sub-sub
    if (base === 'psicofunnel.online' && !RESERVED.has(sub) && BRAND.test(sub)) {
      const url = nextUrl.clone();
      url.pathname = `/s/${sub}${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

// Do not run on files with a dot (.html, .ico, etc.)
export const config = { matcher: ['/((?!.*\.).*)'] };

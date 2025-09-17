// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const BASES = new Set(['psicofunnel.online']);
const RESERVED = new Set(['www','api','crm','preview','s']);
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get('host') || '';
  const p = url.pathname;

  // Ignorar deploy previews (dominios *.vercel.app)
  if (host.endsWith('.vercel.app')) return NextResponse.next();

  // **NUNCA** reescribir apex ni www
  if (host === 'psicofunnel.online' || host === 'www.psicofunnel.online') {
    return NextResponse.next();
  }

  // Dejar pasar rutas claves
  if (p.startsWith('/api')) return NextResponse.next();
  if (p.startsWith('/s/')) return NextResponse.next();
  if (p.startsWith('/preview/')) return NextResponse.next();
  if (p.startsWith('/crm')) return NextResponse.next();
  if (p === '/' || p === '/index.html') return NextResponse.next();

  // Sólo reescribir si es un subdominio real (marca.psicofunnel.online → /s/marca)
  const labels = host.split('.');
  if (labels.length >= 3) {
    const base = labels.slice(-2).join('.');
    const first = labels[0];
    if (BASES.has(base) && !RESERVED.has(first) && SLUG.test(first)) {
      const to = url.clone();
      to.pathname = `/s/${first}`;
      return NextResponse.rewrite(to);
    }
  }
  return NextResponse.next();
}

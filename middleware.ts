// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Dominios base donde querés subdominios
const BASES = new Set(['psicofunnel.online']);
// Slugs válidos: minúsculas, números y guiones (DNS-safe)
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get('host') || '';
  const p = url.pathname;

  // Deja pasar API y rutas canónicas
  if (p.startsWith('/api')) return NextResponse.next();
  if (p.startsWith('/s/')) return NextResponse.next();
  if (p.startsWith('/preview/')) return NextResponse.next();

  // No forzar en dominios de preview de Vercel
  if (host.endsWith('.vercel.app')) return NextResponse.next();

  // Reescritura de subdominio → /s/{slug}
  const labels = host.split('.');
  if (labels.length >= 3) {
    const base = labels.slice(-2).join('.'); // ej: psicofunnel.online
    if (BASES.has(base)) {
      let candidate = labels[0] === 'www' ? labels[1] : labels[0];
      if (SLUG.test(candidate) && !['www','api','crm','preview','s'].includes(candidate)) {
        const to = url.clone();
        to.pathname = `/s/${candidate}`;
        return NextResponse.rewrite(to);
      }
    }
  }

  return NextResponse.next();
}

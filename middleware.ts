// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// dominios donde querés subdominios
const BASES = new Set(['psicofunnel.online']);
const RESERVED = new Set(['www','api','crm','preview','s']);
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get('host') || '';
  const p = url.pathname;

  // Dejar pasar rutas claves
  if (p.startsWith('/api')) return NextResponse.next();
  if (p.startsWith('/s/')) return NextResponse.next();
  if (p.startsWith('/preview/')) return NextResponse.next();
  if (p.startsWith('/crm')) return NextResponse.next();

  // No tocar deployments *.vercel.app
  if (host.endsWith('.vercel.app')) return NextResponse.next();

  // Reescritura subdominio → /s/{slug}
  const labels = host.split('.');
  if (labels.length >= 3) {
    const base = labels.slice(-2).join('.'); // psicofunnel.online
    const first = labels[0];                 // primer label (puede ser 'www' o el slug real)
    if (BASES.has(base)) {
      // si empieza con www -> no reescribimos (tratamos como dominio principal)
      if (first !== 'www' && SLUG.test(first) && !RESERVED.has(first)) {
        const to = url.clone();
        to.pathname = `/s/${first}`;
        return NextResponse.rewrite(to);
      }
    }
  }

  return NextResponse.next();
}

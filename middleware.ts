import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Dominios donde usás subdominios por slug
const BASES = new Set(['psicofunnel.online']);
const RESERVED = new Set(['www','api','crm','preview','s']);
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get('host') || '';
  const p = url.pathname;

  // Nunca tocar los deployments *.vercel.app
  if (host.endsWith('.vercel.app')) return NextResponse.next();

  // Nunca reescribir apex ni www
  if (host === 'psicofunnel.online' || host === 'www.psicofunnel.online') {
    return NextResponse.next();
  }

  // Dejar pasar rutas claves (API/preview/servidor)
  if (p.startsWith('/api')) return NextResponse.next();
  if (p.startsWith('/s/')) return NextResponse.next();
  if (p.startsWith('/preview/')) return NextResponse.next();
  if (p.startsWith('/crm')) return NextResponse.next();

  // Si es un subdominio real del dominio base → reescribimos a /s/{slug}
  const labels = host.split('.');
  if (labels.length >= 3) {
    const base = labels.slice(-2).join('.'); // psicofunnel.online
    const first = labels[0];                 // posible slug
    if (BASES.has(base) && !RESERVED.has(first) && SLUG.test(first)) {
      const to = url.clone();
      to.pathname = `/s/${first}`;
      return NextResponse.rewrite(to);
    }
  }

  return NextResponse.next();
}

  return NextResponse.next();
}

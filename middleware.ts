// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// dominios base donde hay subdominios por slug
const BASES = new Set(['psicofunnel.online']);
// subdominios reservados que jamás se tratan como slug
const RESERVED = new Set(['www','api','crm','preview','s']);
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get('host') || '';
  const p = url.pathname;

  // 0) Ignorar deploy previews de Vercel
  if (host.endsWith('.vercel.app')) return NextResponse.next();

  // 1) **CORTA** para apex y www (NUNCA reescribir aquí)
  if (host === 'psicofunnel.online' || host === 'www.psicofunnel.online') {
    return NextResponse.next();
  }

  // 2) Dejar pasar rutas claves (por si el host no es apex pero tiene estas rutas)
  if (p.startsWith('/api')) return NextResponse.next();
  if (p.startsWith('/s/')) return NextResponse.next();
  if (p.startsWith('/preview/')) return NextResponse.next();
  if (p.startsWith('/crm')) return NextResponse.next();
  if (p === '/' || p === '/index.html') return NextResponse.next();

  // 3) Reescritura subdominio → /s/{slug} SOLO si es un subdominio real
  const labels = host.split('.');
  if (labels.length >= 3) {
    const base = labels.slice(-2).join('.'); // psicofunnel.online
    const first = labels[0];                 // primer label (posible slug)
    if (BASES.has(base) && !RESERVED.has(first) && SLUG.test(first)) {
      const to = url.clone();
      to.pathname = `/s/${first}`;
      return NextResponse.rewrite(to);
    }
  }

  return NextResponse.next();
}

// middleware.ts — ignorar *.vercel.app y solo reescribir subdominios reales
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';

  // 1) Nunca reescribir en los hosts de Vercel (previews y prod .vercel.app)
  if (host.endsWith('.vercel.app')) {
    return NextResponse.next();
  }

  // 2) Si es un subdominio de tu dominio (ej: demo.tudominio.com), reescribir a /_serve
  const parts = host.split('.');
  if (parts.length > 2) {
    const slug = parts[0];
    const url = req.nextUrl.clone();
    url.pathname = '/_serve';
    url.searchParams.set('slug', slug);
    return NextResponse.rewrite(url);
  }

  // 3) Para el dominio raíz (tudominio.com) y www, seguir normal
  return NextResponse.next();
}

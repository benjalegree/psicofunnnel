// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const ROOT_DOMAIN = 'psicofunnel.online';
const RESERVED = new Set(['', 'www', 'blog', 'api']); // agrega los que quieras reservar

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const parts = host.split('.');
  const isApex = host === ROOT_DOMAIN;

  // sub = "demo" si host es "demo.psicofunnel.online"
  const sub = (!isApex && parts.length >= 3) ? parts[0].toLowerCase() : '';

  // Si es subdominio "libre", reescribo a /s/[slug]
  if (sub && !RESERVED.has(sub)) {
    const url = req.nextUrl.clone();

    // Solo reescribo para la raíz (deja pasar assets/otras rutas)
    if (url.pathname === '/' || url.pathname === '/index.html') {
      url.pathname = `/s/${sub}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/:path*'],
};

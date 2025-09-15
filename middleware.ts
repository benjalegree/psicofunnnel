import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const parts = host.split('.');
  if (parts.length > 2) {
    const slug = parts[0];
    const url = req.nextUrl.clone();
    url.pathname = '/_serve';
    url.searchParams.set('slug', slug);
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

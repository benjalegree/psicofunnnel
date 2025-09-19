import { get } from '@vercel/blob';
import type { NextRequest } from 'next/server';

const BRAND = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

export async function GET(_req: NextRequest, { params }: { params: { brand: string; segments?: string[] } }) {
  const brand = params.brand;
  const segments = params.segments ?? [];
  if (!BRAND.test(brand)) return new Response('Invalid brand', { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return new Response('Missing BLOB token', { status: 500 });

  const subpath = segments.length ? `/${segments.join('/')}` : '';
  const key = `sites/${brand}${subpath}/index.html`;

  const { blob } = await get(key, { token }).catch(() => ({ blob: null as any }));
  if (!blob?.url) return new Response('Not found', { status: 404 });

  const res = await fetch(blob.url);
  const html = await res.text();
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

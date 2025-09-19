import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';

const BRAND = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;
const SEGMENT = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

function cleanPath(raw?: string): string {
  if (!raw || raw === '/') return '';
  const parts = raw.split('/').filter(Boolean);
  for (const p of parts) if (!SEGMENT.test(p)) throw new Error('Invalid path segment');
  return parts.join('/');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const brand = (body.brand || body.slug || '').trim();
    const html: string = body.html;
    const mode: 'draft' | 'publish' = body.mode === 'publish' ? 'publish' : 'draft';
    const keyIn = (body.key || '').trim();
    const path = cleanPath(body.path);

    if (!keyIn || keyIn !== process.env.PUBLISH_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    if (!brand || !BRAND.test(brand)) {
      return new Response(JSON.stringify({ error: 'Invalid brand' }), { status: 400 });
    }
    if (!html || typeof html !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing html' }), { status: 400 });
    }

    const folder = mode === 'publish' ? 'sites' : 'drafts';
    const base = `${folder}/${brand}`;
    const key = path ? `${base}/${path}/index.html` : `${base}/index.html`;

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return new Response(JSON.stringify({ error: 'Missing BLOB_READ_WRITE_TOKEN' }), { status: 500 });

    const { url } = await put(key, html, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'text/html; charset=utf-8',
      token
    });

    const p = path ? `/${path}` : '';
    const preview_url = `https://psicofunnel.online/preview/${brand}${p}`;
    const published_url = `https://${brand}.psicofunnel.online${p}`;

    return Response.json({
      ok: true, mode, brand, path: path || '/', preview_url, published_url, blob: url
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'Publish failed' }), { status: 500 });
  }
}

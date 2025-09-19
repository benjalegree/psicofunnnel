import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

export async function POST(req: NextRequest) {
  try {
    const { key, slug, html, mode } = await req.json();

    if (!key || key !== process.env.PUBLISH_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    if (!slug || !SLUG.test(slug)) {
      return new Response(JSON.stringify({ error: 'Invalid slug' }), { status: 400 });
    }
    if (!html || typeof html !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing html' }), { status: 400 });
    }
    const folder = mode === 'publish' ? 'sites' : 'drafts';
    const path = `${folder}/${slug}/index.html`;

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing BLOB_READ_WRITE_TOKEN' }), { status: 500 });
    }

    const { url } = await put(path, html, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'text/html; charset=utf-8',
      token
    });

    const preview_url = `https://psicofunnel.online/preview/${slug}`;
    const published_url = `https://psicofunnel.online/s/${slug}`;

    return Response.json({
      ok: true,
      mode: mode === 'publish' ? 'publish' : 'draft',
      slug,
      preview_url,
      published_url,
      blob: url
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'Publish failed' }), { status: 500 });
  }
}

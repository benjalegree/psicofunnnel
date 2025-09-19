import { get } from '@vercel/blob';
import type { NextRequest } from 'next/server';

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!SLUG.test(slug)) return new Response('Invalid slug', { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return new Response('Missing BLOB token', { status: 500 });

  const { blob } = await get(`drafts/${slug}/index.html`, { token }).catch(() => ({ blob: null as any }));
  if (!blob?.url) return new Response('Draft not found', { status: 404 });

  const res = await fetch(blob.url);
  const html = await res.text();

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

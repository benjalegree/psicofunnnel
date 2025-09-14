import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
export const runtime = 'edge';
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug')?.trim();
  if (!slug) return new NextResponse('Missing slug', { status:400 });
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try{ const { blobs } = await list({ prefix:`sites/${slug}/index.html`, token });
    if (!blobs.length) return new NextResponse('Not found', { status:404 });
    const html = await (await fetch(blobs[0].url)).text();
    return new NextResponse(html, { headers:{ 'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=60' } });
  }catch{ return new NextResponse('Not found', { status:404 }); }
}

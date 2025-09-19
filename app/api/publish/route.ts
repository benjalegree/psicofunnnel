// app/api/publish/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
export const runtime = 'nodejs';

type PublishBody = {
  key?: string;
  slug?: string;
  html?: string;
  mode?: 'publish' | 'draft';
};

function sha1(str: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  // @ts-ignore
  const buf = require('crypto').createHash('sha1').update(data).digest('hex');
  return buf.substring(0, 12);
}

export async function POST(req: Request) {
  try {
    const { key, slug, html, mode }: PublishBody = await req.json();

    const PUBLISH_KEY = process.env.PUBLISH_KEY;
    if (!PUBLISH_KEY || key !== PUBLISH_KEY) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const s = (slug || '').trim().toLowerCase();
    if (!s || !/^[a-z0-9-]+$/.test(s)) {
      return NextResponse.json({ ok: false, error: 'Invalid slug' }, { status: 400 });
    }
    if (!html || !html.toLowerCase().includes('<!doctype html')) {
      return NextResponse.json({ ok: false, error: 'Expecting full HTML document' }, { status: 400 });
    }

    const MODE = (mode === 'draft' ? 'draft' : 'publish') as 'publish' | 'draft';
    const now = new Date().toISOString().replace(/[:.]/g, '-');
    const hash = sha1(html + now);
    const filename = `index-${hash}.html`;

    // 1) Sube HTML
    const htmlPath = `sites/${s}/${filename}`;
    const htmlPut = await put(htmlPath, html, {
      access: 'public',
      contentType: 'text/html; charset=utf-8',
    });

    // 2) latest.json
    const latestPath = `sites/${s}/latest.json`;
    const latestBody = JSON.stringify({
      url: htmlPut.url,
      updatedAt: new Date().toISOString(),
      mode: MODE
    });
    const latestPut = await put(latestPath, latestBody, {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
    });

    const env = process.env.VERCEL_ENV || 'production'; // 'production' | 'preview' | 'development'
    const published_url = `https://${s}.psicofunnel.online`;

    return NextResponse.json({
      ok: true,
      status: 200,
      mode: MODE,
      env,
      published_url,
      blob: htmlPut.url,
      latest_url: latestPut.url
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: 'Publish failed' }, { status: 500 });
  }
}


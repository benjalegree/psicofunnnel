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

    // 1) Auth simple por clave
    const PUBLISH_KEY = process.env.PUBLISH_KEY;
    if (!PUBLISH_KEY || key !== PUBLISH_KEY) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2) Validaciones
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

    // 3) Subir la versión HTML (con sufijo aleatorio OK)
    const htmlPath = `sites/${s}/${filename}`;
    const htmlPut = await put(htmlPath, html, {
      access: 'public',
      contentType: 'text/html; charset=utf-8',
      // (dejamos el nombre tal cual; no hace falta forzar sin sufijo)
    });

    // 4) Actualizar puntero latest.json SIN sufijo
    const latestPath = `sites/${s}/latest.json`;
    const latestBody = JSON.stringify({
      url: htmlPut.url,
      updatedAt: new Date().toISOString(),
      mode: MODE,
    });

    await put(latestPath, latestBody, {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
      addRandomSuffix: false, // <<--- CLAVE: que quede exactamente latest.json
    });

    // 5) Respuesta
    const env = process.env.VERCEL_ENV || 'production';
    const published_url = `https://${s}.psicofunnel.online`;

    return NextResponse.json({
      ok: true,
      status: 200,
      mode: MODE,
      env,
      published_url,
      blob: htmlPut.url,
      latest_url: `${process.env.BLOB_PUBLIC_BASE}/sites/${s}/latest.json`,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Publish failed' }, { status: 500 });
  }
}

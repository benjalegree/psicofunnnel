// app/api/publish/route.ts
import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

// Opcional: cambia el prefijo si querés
const ROOT_PREFIX = 'sites';

export async function POST(req: Request) {
  try {
    const { slug, html, mode } = await req.json() as { slug?: string; html?: string; mode?: 'publish' | 'draft' };

    if (!slug || !/^[a-z0-9-]{2,}$/.test(slug)) {
      return NextResponse.json({ ok:false, error:'Bad slug' }, { status: 400 });
    }
    if (!html || !/^<!doctype html/i.test(html)) {
      return NextResponse.json({ ok:false, error:'HTML required (<!doctype html ...)' }, { status: 400 });
    }

    const safeSlug = slug.toLowerCase();
    const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

    // 1) Subir versión con nombre único
    const filePath = `${ROOT_PREFIX}/${safeSlug}/index-${stamp}.html`;
    const { url: blob } = await put(filePath, new Blob([html], { type: 'text/html;charset=utf-8' }), {
      access: 'public',
      addRandomSuffix: false
    });

    // 2) Actualizar puntero latest.json
    const latestPath = `${ROOT_PREFIX}/${safeSlug}/latest.json`;
    const latestPayload = JSON.stringify({ html: blob, ts: Date.now(), mode: mode || 'publish' });
    await put(latestPath, new Blob([latestPayload], { type: 'application/json' }), {
      access: 'public',
      addRandomSuffix: false
    });

    // 3) URL del subdominio (tu dominio en Vercel DNS)
    const published_url = `https://${safeSlug}.psicofunnel.online`;

    return NextResponse.json({
      ok: true,
      status: 200,
      mode: mode || 'publish',
      published_url,
      blob,
      latest_url: blob.replace(/index-[^/]+\.html$/, 'latest.json')
    });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: String(e?.message || e) }, { status: 500 });
  }
}

// app/s/[slug]/route.ts
// Lector robusto de "latest": soporta latest.json fijo o latest-*.json con sufijo.
import { list } from '@vercel/blob';

export const runtime = 'nodejs';

const BLOB_BASE = process.env.BLOB_PUBLIC_BASE;       // p.ej. https://XYZ.public.blob.vercel-storage.com
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN; // necesario para list()

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = (params.slug || '').trim().toLowerCase();
    if (!slug) return new Response('Missing slug', { status: 400 });

    if (!BLOB_BASE) return new Response('BLOB_PUBLIC_BASE not set', { status: 500 });
    if (!BLOB_TOKEN) return new Response('BLOB_READ_WRITE_TOKEN not set', { status: 500 });

    // 1) Intento directo a latest.json
    const fixedLatest = `${BLOB_BASE}/sites/${encodeURIComponent(slug)}/latest.json`;
    let metaUrl: string | null = null;

    const fixedRes = await fetch(fixedLatest, { cache: 'no-store' });
    if (fixedRes.ok) {
      metaUrl = fixedLatest;
    } else {
      // 2) Fallback: listar latest-*.json por prefijo y elegir el más reciente
      const prefix = `sites/${slug}/latest`;
      const listed = await list({ prefix, token: BLOB_TOKEN });

      if (!listed.blobs.length) return new Response('Site not found', { status: 404 });

      listed.blobs.sort((a, b) => {
        const ta = new Date(a.uploadedAt || a.lastModified || 0).getTime();
        const tb = new Date(b.uploadedAt || b.lastModified || 0).getTime();
        return tb - ta;
      });

      const latestBlob = listed.blobs.find(b => b.pathname.startsWith(`sites/${slug}/latest`));
      if (!latestBlob) return new Response('Site not found', { status: 404 });

      metaUrl = latestBlob.url;
    }

    // 3) Leer metadata { url }
    const metaRes = await fetch(metaUrl, { cache: 'no-store' });
    if (!metaRes.ok) return new Response('Site not found', { status: 404 });

    const { url } = await metaRes.json() as { url?: string };
    if (!url) return new Response('Invalid metadata', { status: 502 });

    // 4) Traer y servir el HTML
    const htmlRes = await fetch(url, { cache: 'no-store' });
    if (!htmlRes.ok) return new Response('Version not available', { status: 502 });

    const html = await htmlRes.text();
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch {
    return new Response('Internal error', { status: 500 });
  }
}


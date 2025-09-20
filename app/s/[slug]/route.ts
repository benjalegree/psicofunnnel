// app/s/[slug]/route.ts
// Robust: busca latest-*.json por prefix si no encuentra latest.json fijo.
import { list } from '@vercel/blob';

export const runtime = 'nodejs';

const BLOB_BASE = process.env.BLOB_PUBLIC_BASE;         // p.ej. https://m2skrbqmbxvdkbac.public.blob.vercel-storage.com
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;   // necesario para usar list() en el server

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = (params.slug || '').trim().toLowerCase();
    if (!slug) return new Response('Missing slug', { status: 400 });

    if (!BLOB_BASE) return new Response('BLOB_PUBLIC_BASE not set', { status: 500 });
    if (!BLOB_TOKEN) return new Response('BLOB_READ_WRITE_TOKEN not set', { status: 500 });

    // 1) Intento directo: latest.json exacto
    const fixedLatest = `${BLOB_BASE}/sites/${encodeURIComponent(slug)}/latest.json`;
    let metaUrl: string | null = null;

    const fixedRes = await fetch(fixedLatest, { cache: 'no-store' });
    if (fixedRes.ok) {
      metaUrl = fixedLatest;
    } else {
      // 2) Fallback: listar cualquier latest-*.json por prefix y elegir el más reciente
      const prefix = `sites/${slug}/latest`;
      const listed = await list({ prefix, token: BLOB_TOKEN });

      // Ordenar por fecha de subida (descending) y elegir el primero
      listed.blobs.sort((a, b) => {
        const ta = new Date(a.uploadedAt || a.lastModified || 0).getTime();
        const tb = new Date(b.uploadedAt || b.lastModified || 0).getTime();
        return tb - ta;
      });

      const latestBlob = listed.blobs.find(b => b.pathname.startsWith(`sites/${slug}/latest`));
      if (!latestBlob) {
        return new Response('Site not found', { status: 404 });
      }
      metaUrl = latestBlob.url;
    }

    // 3) Leer metadata { url }
    const metaRes = await fetch(metaUrl, { cache: 'no-store' });
    if (!metaRes.ok) return new Response('Site not found', { status: 404 });
    const { url } = await metaRes.json() as { url?: string };
    if (!url) return new Response('Invalid metadata', { status: 502 });

    // 4) Descargar el HTML final y servirlo
    const htmlRes = await fetch(url, { cache: 'no-store' });
    if (!htmlRes.ok) return new Response('Version not available', { status: 502 });
    const html = await htmlRes.text();

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (e) {
    return new Response('Internal error', { status: 500 });
  }
}

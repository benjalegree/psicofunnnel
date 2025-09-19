// app/s/[slug]/route.ts
export const runtime = 'nodejs'; // o 'edge' si lo prefieres (usa fetch igual)

const BLOB_BASE = process.env.BLOB_PUBLIC_BASE; // p.ej. https://m2skrbqmbxvdkbac.public.blob.vercel-storage.com

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    if (!BLOB_BASE) {
      return new Response('BLOB_PUBLIC_BASE is not configured', { status: 500 });
    }

    const slug = (params.slug || '').trim().toLowerCase();
    if (!slug) {
      return new Response('Missing slug', { status: 400 });
    }

    // 1) Lee el puntero "latest"
    const latestUrl = `${BLOB_BASE}/sites/${encodeURIComponent(slug)}/latest.json`;
    const metaRes = await fetch(latestUrl, { cache: 'no-store' });

    if (!metaRes.ok) {
      return new Response('Site not found', { status: 404 });
    }

    const { url } = await metaRes.json() as { url?: string };
    if (!url) {
      return new Response('Invalid metadata', { status: 502 });
    }

    // 2) Descarga el HTML actual
    const htmlRes = await fetch(url, { cache: 'no-store' });
    if (!htmlRes.ok) {
      return new Response('Version not available', { status: 502 });
    }
    const html = await htmlRes.text();

    // 3) Sirve HTML
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // cachea un poquito si quieres
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err) {
    return new Response('Internal error', { status: 500 });
  }
}

import { list } from '@vercel/blob';
export const runtime = 'edge';

function isSafeBlobURL(u: string) {
  try {
    const h = new URL(u).hostname;
    return h.endsWith('.public.blob.vercel-storage.com') || h.endsWith('.vercel-storage.com');
  } catch { return false; }
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const url = new URL(req.url);
  const direct = url.searchParams.get('u');

  // 1) si viene la URL directa del blob, servirla
  if (direct && isSafeBlobURL(direct)) {
    const html = await (await fetch(direct)).text();
    return new Response(html, {
      headers: {
        'Content-Type':'text/html; charset=utf-8',
        'X-Robots-Tag':'noindex, nofollow',
        'Cache-Control':'no-store'
      }
    });
  }

  // 2) fallback: buscar index*.html en drafts/{slug}
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const pickIndex = (blobs: any[]) =>
    blobs.find((b: any) => /\/index(\-[^\/]+)?\.html$/.test(b.pathname)) || blobs[0];

  try {
    let { blobs } = await list({ prefix: `drafts/${params.slug}/index`, token });
    if (!blobs.length) ({ blobs } = await list({ prefix: `drafts/${params.slug}/`, token }));
    if (!blobs.length) return new Response('Draft not found', { status: 404 });

    const file = pickIndex(blobs);
    const html = await (await fetch(file.url)).text();
    return new Response(html, {
      headers: {
        'Content-Type':'text/html; charset=utf-8',
        'X-Robots-Tag':'noindex, nofollow',
        'Cache-Control':'no-store'
      }
    });
  } catch {
    return new Response('Draft not found', { status: 404 });
  }
}

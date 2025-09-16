import { list } from '@vercel/blob';
export const runtime = 'edge';

// seguridad mínima: solo permitir blobs públicos de vercel
function isSafeBlobURL(u: string) {
  try {
    const h = new URL(u).hostname;
    return h.endsWith('.vercel-storage.com') || h.endsWith('.public.blob.vercel-storage.com');
  } catch { return false; }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const direct = url.searchParams.get('u'); // blob url directa (si viene del publish)
  if (direct && isSafeBlobURL(direct)) {
    const html = await (await fetch(direct)).text();
    return new Response(html, { headers: { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'public, max-age=60' } });
  }

  const slug = url.searchParams.get('slug')?.trim();
  if (!slug) return new Response('Missing slug', { status: 400 });

  // Fallback por prefix (por si no viene "u")
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const pickIndex = (blobs: any[]) =>
    blobs.find((b: any) => /\/index(\-[^\/]+)?\.html$/.test(b.pathname)) || blobs[0];

  try {
    let { blobs } = await list({ prefix: `sites/${slug}/index`, token });
    if (!blobs.length) ({ blobs } = await list({ prefix: `sites/${slug}/`, token }));
    if (!blobs.length) return new Response('Not found', { status: 404 });

    const file = pickIndex(blobs);
    const html = await (await fetch(file.url)).text();
    return new Response(html, { headers: { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'public, max-age=60' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

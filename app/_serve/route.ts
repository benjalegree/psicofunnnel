import { list } from '@vercel/blob';

export const runtime = 'edge';

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug')?.trim();
  if (!slug) return new Response('Missing slug', { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  // Helper para elegir el index*.html
  const pickIndex = (blobs: any[]) =>
    blobs.find((b: any) => /\/index(\-[^\/]+)?\.html$/.test(b.pathname)) || blobs[0];

  try {
    // 1) Primero probamos con prefijo "index"
    let { blobs } = await list({ prefix: `sites/${slug}/index`, token });

    // 2) Si no hay, listamos todo el folder y elegimos el index*.html
    if (!blobs.length) {
      ({ blobs } = await list({ prefix: `sites/${slug}/`, token }));
    }
    if (!blobs.length) return new Response('Not found', { status: 404 });

    const file = pickIndex(blobs);
    const html = await (await fetch(file.url)).text();

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

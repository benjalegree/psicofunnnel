import { list } from '@vercel/blob';

export const runtime = 'edge';

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug')?.trim();
  if (!slug) return new Response('Missing slug', { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  const pickIndex = (blobs: any[]) =>
    blobs.find((b: any) => /\/index(\-[^\/]+)?\.html$/.test(b.pathname)) || blobs[0];

  try {
    let { blobs } = await list({ prefix: `drafts/${slug}/index`, token });
    if (!blobs.length) {
      ({ blobs } = await list({ prefix: `drafts/${slug}/`, token }));
    }
    if (!blobs.length) return new Response('Draft not found', { status: 404 });

    const file = pickIndex(blobs);
    const html = await (await fetch(file.url)).text();

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store'
      }
    });
  } catch {
    return new Response('Draft not found', { status: 404 });
  }
}

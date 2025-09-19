// app/s/[slug]/route.ts
export const runtime = 'edge';

/**
 * Sirve una landing publicada.
 * Si viene ?u= (URL del Blob) lo usa directo.
 * Si no, intenta resolver la última URL publicada desde Apps Script (Projects).
 */
export async function GET(req: Request, ctx: { params: { slug: string } }) {
  const { slug } = ctx.params;
  const url = new URL(req.url);
  const u = url.searchParams.get('u');

  const cleaned = String(slug||'').trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/.test(cleaned)) {
    return new Response('Invalid slug', { status: 400 });
  }

  let blobUrl = u || '';

  // Resolver desde Apps Script si no vino ?u=
  if (!blobUrl) {
    const endpoint = process.env.APPS_SCRIPT_ENDPOINT;
    if (!endpoint) return new Response('Missing env', { status: 500 });
    const info = await fetch(`${endpoint}?action=projectInfo&slug=${encodeURIComponent(cleaned)}`);
    const txt = await info.text();
    let data:any; try{ data = JSON.parse(txt) }catch{}
    blobUrl = data?.last_published_url || data?.blob || '';
    if (!blobUrl) return new Response('Not found', { status: 404 });
  }

  try {
    const resp = await fetch(blobUrl, { cache: 'no-store' });
    const html = await resp.text();
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  } catch (e:any) {
    return new Response('Failed to load content', { status: 502 });
  }
}

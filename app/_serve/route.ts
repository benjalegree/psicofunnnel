export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') || '';
  const u = url.searchParams.get('u') || '';
  if (!slug) return new Response('Missing slug', { status: 400 });

  const to = new URL(req.url);
  to.pathname = `/s/${slug}`;
  to.search = '';
  to.searchParams.set('slug', slug);
  if (u) to.searchParams.set('u', u); // si venía el blob directo, lo pasamos
  return Response.redirect(to.toString(), 307);
}

// app/api/publish-client/route.ts
export const runtime = 'edge';

/**
 * Publica una landing usando el publicador interno, inyectando el PUBLISH_KEY
 * y validando que el slug pertenezca al usuario (id_token) contra Apps Script.
 * Body: { id_token: string, slug: string, html: string, mode: 'draft'|'publish' }
 */
export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const { id_token, slug, html, mode } = body || {};

  if (!id_token || !slug || !html || (mode!=='draft' && mode!=='publish')) {
    return new Response(JSON.stringify({ ok:false, error:'bad_request' }), { status:400 });
  }

  const key = process.env.PUBLISH_KEY;
  const endpoint = process.env.APPS_SCRIPT_ENDPOINT;
  if (!key || !endpoint) {
    return new Response(JSON.stringify({ ok:false, error:'missing_env' }), { status:500 });
  }

  const cleaned = String(slug).trim().toLowerCase();

  // 1) Verificar propiedad del slug para este usuario
  const who = await fetch(`${endpoint}?action=whoami&id_token=${encodeURIComponent(id_token)}`);
  const whoTxt = await who.text();
  let whoData:any; try{ whoData = JSON.parse(whoTxt) }catch{}
  if (!who.ok || !whoData?.ok) {
    return new Response(JSON.stringify({ ok:false, error:'auth_failed', data: whoData||whoTxt }), { status:401 });
  }

  // traé proyectos del usuario (asumiendo que 'list' con id_token devuelve slugs)
  const list = await fetch(`${endpoint}?action=list&id_token=${encodeURIComponent(id_token)}`);
  const listTxt = await list.text();
  let listData:any; try{ listData = JSON.parse(listTxt) }catch{}
  const owns = Array.isArray(listData?.items) && listData.items.some((p:any)=> (p.project_slug||p.slug) === cleaned);
  if (!owns) {
    return new Response(JSON.stringify({ ok:false, error:'forbidden_slug' }), { status:403 });
  }

  // 2) Reenviar al publicador real
  const url = new URL(req.url); url.pathname = '/api/publish';
  const upstream = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, slug: cleaned, html, mode })
  });

  const text = await upstream.text();
  let data:any; try{ data = JSON.parse(text) }catch{ data = { raw: text } };

  // 3) Persistir "última URL publicada" (para abrir subdominio sin ?u= más adelante)
  if (upstream.ok && data?.blob) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({
          action: 'updateProject',
          id_token,
          project_slug: cleaned,
          last_published_url: mode==='publish' ? data.blob : undefined,
          last_draft_url: mode==='draft' ? data.blob : undefined,
          status: mode
        })
      });
    } catch {}
  }

  return new Response(JSON.stringify({ status: upstream.status, ...(typeof data==='object'?data:{ raw:text }) }), { status: upstream.status });
}

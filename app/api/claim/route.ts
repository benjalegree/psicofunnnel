// app/api/claim/route.ts
export const runtime = 'edge';

/**
 * Reclama un slug para el usuario autenticado (id_token de Google).
 * Body JSON: { id_token: string, slug: string, project_name?: string }
 * Reenvía a Apps Script (registerProject). Responde 200 si ok, 409 si existe.
 */
export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const { id_token, slug, project_name } = body || {};

  if (!id_token || !slug) {
    return new Response(JSON.stringify({ ok:false, error:'bad_request' }), { status:400 });
  }

  const endpoint = process.env.APPS_SCRIPT_ENDPOINT;
  if (!endpoint) {
    return new Response(JSON.stringify({ ok:false, error:'missing_apps_script' }), { status:500 });
  }

  // Normalizá el slug
  const cleaned = String(slug).trim().toLowerCase();
  const valid = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/.test(cleaned);
  if (!valid) {
    return new Response(JSON.stringify({ ok:false, error:'invalid_slug' }), { status:422 });
  }

  // Reenvía al Apps Script para que registre al dueño de ese slug
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ action:'registerProject', id_token, project_slug: cleaned, project_name })
  });

  const txt = await res.text();
  let data:any; try{ data = JSON.parse(txt) }catch{ data = { raw: txt } }

  if (!res.ok) {
    // Convierte 409 si Apps Script responde que ya existe
    const code = /exists|duplicate|conflict/i.test(txt) ? 409 : res.status;
    return new Response(JSON.stringify({ ok:false, error:'register_failed', data }), { status: code });
  }

  return new Response(JSON.stringify({ ok:true, slug: cleaned, data }), { status:200 });
}

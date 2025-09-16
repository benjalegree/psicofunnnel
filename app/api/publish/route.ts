import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
export const runtime = 'edge';

export async function POST(req: Request) {
  let body:any={}; try{ body = await req.json(); }catch{}
  const { key, slug, html, mode } = body;

  if (key !== process.env.PUBLISH_KEY)
    return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 });

  if (!slug || !html || (mode!=='draft' && mode!=='publish'))
    return NextResponse.json({ ok:false, error:'bad_request' }, { status:400 });

  const path = mode==='publish' ? `sites/${slug}/index.html` : `drafts/${slug}/index.html`;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ ok:false, error:'missing_blob_token' }, { status:500 });

  try {
    // sube el HTML (pública)
    const result = await put(path, new Blob([html], { type:'text/html;charset=utf-8' }), {
      access:'public',
      token,
      // si tu token lo permite, podés forzar nombre fijo (opcional):
      // addRandomSuffix: false
    });

    // armamos la URL de lectura e incluimos el blob como parámetro "u"
    const url = new URL(req.url);
    url.pathname = mode==='publish' ? '/_serve' : '/preview';
    url.searchParams.set('slug', slug);
    url.searchParams.set('u', result.url);

    return NextResponse.json({
      ok:true,
      mode,
      [mode==='publish' ? 'published_url' : 'preview_url']: url.toString(),
      blob: result.url
    });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:'blob_put_failed', message:String(e) }, { status:500 });
  }
}

'use client';
import { useState } from 'react';
export default function PublishTester() {
  const [brand, setBrand] = useState('demo');
  const [path, setPath] = useState('');
  const [mode, setMode] = useState<'draft' | 'publish'>('draft');
  const [key, setKey] = useState('');
  const [html, setHtml] = useState('<!doctype html><html><body><h1>Hola</h1></body></html>');
  const [res, setRes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRes(null); setError(null);
    try {
      const r = await fetch('/api/publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, brand, path, html, mode })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Error publicando');
      setRes(data);
    } catch (err:any){ setError(err.message); }
  }
  const p = path ? `/${path}` : '';
  const fallback = `/s/${brand}${p}`;
  return (
    <main style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Publicar (brand + path)</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>PUBLISH_KEY<input value={key} onChange={e=>setKey(e.target.value)} style={{width:'100%'}}/></label>
        <label>Brand<input value={brand} onChange={e=>setBrand(e.target.value)} style={{width:'100%'}}/></label>
        <label>Path (opcional)<input value={path} onChange={e=>setPath(e.target.value)} placeholder="lp2 | a/b" style={{width:'100%'}}/></label>
        <label>Modo<select value={mode} onChange={e=>setMode(e.target.value as any)}><option value="draft">draft</option><option value="publish">publish</option></select></label>
        <label>HTML<textarea rows={10} value={html} onChange={e=>setHtml(e.target.value)} style={{width:'100%'}}/></label>
        <button type="submit">Publicar</button>
      </form>
      {error && <p style={{color:'crimson'}}>{error}</p>}
      {res && (<>
        <h2>Resultado</h2>
        <ul>
          <li>Publicado (subdominio): <a href={res.published_url} target="_blank" rel="noreferrer">{res.published_url}</a></li>
          <li>Publicado (fallback): <a href={fallback} target="_blank" rel="noreferrer">{fallback}</a></li>
          <li>Preview: <a href={res.preview_url} target="_blank" rel="noreferrer">{res.preview_url}</a></li>
          <li>Blob: <a href={res.blob} target="_blank" rel="noreferrer">{res.blob}</a></li>
        </ul>
        <pre style={{background:'#111',color:'#0f0',padding:12,overflow:'auto'}}>{JSON.stringify(res,null,2)}</pre>
      </>)}
    </main>);
}

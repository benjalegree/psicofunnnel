'use client';
import { useState } from 'react';

export default function PublishTester() {
  const [brand, setBrand] = useState('demo');
  const [path, setPath] = useState(''); // '' | 'lp2' | 'a/b'
  const [mode, setMode] = useState<'draft' | 'publish'>('draft');
  const [key, setKey] = useState('');
  const [html, setHtml] = useState('<!doctype html><html><body><h1>Hola</h1></body></html>');
  const [res, setRes] = useState<any>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRes(null);
    const r = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, brand, path, html, mode })
    });
    const data = await r.json();
    setRes(data);
  }

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Publicar (brand + path)</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label> PUBLISH_KEY
          <input value={key} onChange={e => setKey(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label> Brand (subdominio)
          <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="mi-marca" style={{ width: '100%' }} />
        </label>
        <label> Path (opcional)
          <input value={path} onChange={e => setPath(e.target.value)} placeholder="lp2 | a/b" style={{ width: '100%' }} />
        </label>
        <label> Modo
          <select value={mode} onChange={e => setMode(e.target.value as any)}>
            <option value="draft">draft</option>
            <option value="publish">publish</option>
          </select>
        </label>
        <label> HTML
          <textarea rows={10} value={html} onChange={e => setHtml(e.target.value)} style={{ width: '100%' }} />
        </label>
        <button type="submit">Publicar</button>
      </form>

      {res && (
        <pre style={{ background: '#111', color: '#0f0', padding: 12, marginTop: 16, overflow: 'auto' }}>
{JSON.stringify(res, null, 2)}
        </pre>
      )}
      <p style={{ marginTop: 16 }}>
        Preview: <code>/preview/&lt;brand&gt;/[path]</code> — Publicado: <code>https://&lt;brand&gt;.psicofunnel.online/[path]</code>
      </p>
    </main>
  );
}

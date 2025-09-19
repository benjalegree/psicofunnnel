'use client';

import { useState } from 'react';

export default function PublishTester() {
  const [slug, setSlug] = useState('demo');
  const [mode, setMode] = useState<'draft' | 'publish'>('draft');
  const [html, setHtml] = useState('<!doctype html><html><body><h1>Hola</h1></body></html>');
  const [res, setRes] = useState<any>(null);
  const [key, setKey] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRes(null);
    const r = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, slug, html, mode })
    });
    const data = await r.json();
    setRes(data);
  }

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Publicar (tester)</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          PUBLISH_KEY
          <input value={key} onChange={e => setKey(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label>
          Slug
          <input value={slug} onChange={e => setSlug(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label>
          Modo
          <select value={mode} onChange={e => setMode(e.target.value as any)}>
            <option value="draft">draft</option>
            <option value="publish">publish</option>
          </select>
        </label>
        <label>
          HTML
          <textarea rows={10} value={html} onChange={e => setHtml(e.target.value)} style={{ width: '100%' }} />
        </label>
        <button type="submit">Enviar</button>
      </form>

      {res && (
        <pre style={{ background: '#111', color: '#0f0', padding: 12, marginTop: 16, overflow: 'auto' }}>
{JSON.stringify(res, null, 2)}
        </pre>
      )}
      <p style={{ marginTop: 16 }}>
        Luego abrí: <code>/preview/&lt;slug&gt;</code> o <code>/s/&lt;slug&gt;</code> — y también <code>https://&lt;slug&gt;.psicofunnel.online</code>.
      </p>
    </main>
  );
}

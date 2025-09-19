'use client';
import { useState } from 'react';

export default function PublishTester() {
  const [slug, setSlug] = useState('demo');
  const [mode, setMode] = useState<'draft' | 'publish'>('draft');
  const [key, setKey] = useState('');
  const [html, setHtml] = useState('<!doctype html><html><body><h1>Hola</h1></body></html>');
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOut(null);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, slug, html, mode })
      });
      const txt = await res.text();
      let data: any = null;
      try { data = JSON.parse(txt); } catch { data = { raw: txt }; }
      setOut({ status: res.status, ...data });
    } catch (err: any) {
      setError(err?.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 860, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui' }}>
      <h1>Tester de Publicacion</h1>
      <form onSubmit={send} style={{ display: 'grid', gap: 12 }}>
        <label>Slug
          <input value={slug} onChange={e => setSlug(e.target.value)} required style={{ width: '100%', padding: 10 }} />
        </label>
        <label style={{ display: 'flex', gap: 12 }}>
          <span><input type='radio' checked={mode === 'draft'} onChange={() => setMode('draft')} /> Draft</span>
          <span><input type='radio' checked={mode === 'publish'} onChange={() => setMode('publish')} /> Publish</span>
        </label>
        <label>PUBLISH_KEY
          <input value={key} onChange={e => setKey(e.target.value)} required style={{ width: '100%', padding: 10 }} placeholder='psico_pub_galo_millonario' />
        </label>
        <label>HTML
          <textarea value={html} onChange={e => setHtml(e.target.value)} rows={10} style={{ width: '100%', padding: 10 }} />
        </label>
        <button disabled={loading} style={{ padding: '10px 14px' }}>
          {loading ? 'Enviando...' : (mode === 'draft' ? 'Guardar DRAFT' : 'PUBLICAR')}
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>⚠ {error}</p>}
      {out && <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(out, null, 2)}</pre>}
    </main>
  );
}

'use client';

import React, { useEffect, useMemo, useState } from 'react';

type PublishResp = {
  ok?: boolean;
  status?: number;
  error?: string;
  env?: string;
  mode?: 'publish' | 'draft';
  published_url?: string;
  blob?: string;
  latest_url?: string;
  patch?: string;
};

export default function PublishTesterPage() {
  const [keyVal, setKeyVal] = useState('');
  const [slug, setSlug] = useState('');
  const [mode, setMode] = useState<'publish' | 'draft'>('publish');
  const [html, setHtml] = useState('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8"/>\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Mi sitio</title>\n<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:40px;margin:0;background:#f7f7f9;color:#111}</style>\n</head>\n<body>\n<h1>Hola PsicoFunnel 👋</h1>\n<p>Este es un HTML de prueba publicado vía <strong>/api/publish</strong>.</p>\n</body>\n</html>');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<PublishResp | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ---------- Persistencia ----------
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pf_publish_tester') || '{}');
      if (saved.keyVal) setKeyVal(saved.keyVal);
      if (saved.slug) setSlug(saved.slug);
      if (saved.mode) setMode(saved.mode);
      if (saved.html) setHtml(saved.html);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    const payload = JSON.stringify({ keyVal, slug, mode, html });
    localStorage.setItem('pf_publish_tester', payload);
  }, [keyVal, slug, mode, html]);

  // ---------- Helpers ----------
  const slugSanitized = useMemo(() => {
    const s = (slug || '').toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
    return s || '';
  }, [slug]);

  const canSubmit = useMemo(() => {
    return !loading && !!keyVal && !!slugSanitized && html.toLowerCase().includes('<!doctype html');
  }, [keyVal, slugSanitized, html, loading]);

  function copy(text: string, msg = 'Copiado') {
    navigator.clipboard.writeText(text).then(() => {
      setToast(msg);
      setTimeout(() => setToast(null), 1400);
    });
  }

  // ---------- Submit ----------
  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setResp(null);
    setToast(null);
    try {
      const r = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: keyVal,
          slug: slugSanitized,
          html,
          mode
        }),
      });
      const j: PublishResp = await r.json().catch(() => ({ ok: false, error: 'Invalid JSON response' }));
      setResp(j);
      if (j?.ok) {
        setToast('Publicado ✔');
        setTimeout(() => setToast(null), 1600);
      } else {
        setToast('Error al publicar');
        setTimeout(() => setToast(null), 2200);
      }
    } catch (err) {
      setResp({ ok: false, error: 'Network error' });
      setToast('Network error');
      setTimeout(() => setToast(null), 2200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="grid">
        <section className="card formCard">
          <header className="cardHeader">
            <div className="title">
              <span className="dot" />
              <h1>Publish Tester</h1>
            </div>
            <p className="subtitle">Genera y publica HTML en <strong>*.psicofunnel.online</strong> con un clic.</p>
          </header>

          <form onSubmit={handlePublish} className="form">
            <div className="row">
              <label>Publish Key</label>
              <input
                type="password"
                placeholder="PUBLISH_KEY"
                value={keyVal}
                onChange={(e) => setKeyVal(e.target.value)}
                autoComplete="current-password"
              />
              <small>La clave se valida en <code>/api/publish</code>.</small>
            </div>

            <div className="row">
              <label>Slug</label>
              <div className="slugRow">
                <input
                  type="text"
                  placeholder="mi-sitio"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <div className="slugHint">
                  <span className="muted">Se publicará en&nbsp;</span>
                  <code>{slugSanitized || 'mi-sitio'}.psicofunnel.online</code>
                </div>
              </div>
              <small>Solo minúsculas, números y guiones. Se limpia automáticamente.</small>
            </div>

            <div className="row">
              <label>Modo</label>
              <div className="segmented">
                <button
                  type="button"
                  className={mode === 'publish' ? 'seg on' : 'seg'}
                  onClick={() => setMode('publish')}
                >
                  Publish
                </button>
                <button
                  type="button"
                  className={mode === 'draft' ? 'seg on' : 'seg'}
                  onClick={() => setMode('draft')}
                >
                  Draft
                </button>
              </div>
            </div>

            <div className="row">
              <label>HTML</label>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                spellCheck={false}
                rows={14}
              />
              <small>Debe ser un documento **completo** con <code>&lt;!doctype html&gt;</code>.</small>
            </div>

            <div className="actions">
              <button className="primary" type="submit" disabled={!canSubmit}>
                {loading ? 'Publicando…' : 'Publicar'}
              </button>
              <button
                className="ghost"
                type="button"
                onClick={() => {
                  setHtml((h) =>
                    h.replace(/<\/body>\s*<\/html>\s*$/i, `\n<!-- ${new Date().toISOString()} -->\n</body>\n</html>`)
                  );
                  setToast('Marca de tiempo añadida');
                  setTimeout(() => setToast(null), 1200);
                }}
              >
                Añadir marca de tiempo
              </button>
              <button
                className="ghost"
                type="button"
                onClick={() => {
                  setKeyVal('');
                  setSlug('');
                  setMode('publish');
                  setHtml('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8"/>\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Mi sitio</title>\n<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:40px;margin:0;background:#f7f7f9;color:#111}</style>\n</head>\n<body>\n<h1>Hola PsicoFunnel 👋</h1>\n<p>Este es un HTML de prueba publicado vía <strong>/api/publish</strong>.</p>\n</body>\n</html>');
                  setToast('Formulario reseteado');
                  setTimeout(() => setToast(null), 1200);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="card resultCard">
          <header className="cardHeader">
            <h2>Resultado</h2>
            <p className="subtitle">Links y respuesta del servidor tras publicar.</p>
          </header>

          {!resp && <div className="placeholder">Publica para ver el resultado aquí.</div>}

          {!!resp && (
            <>
              <div className={`status ${resp.ok ? 'ok' : 'err'}`}>
                {resp.ok ? 'Publicado correctamente' : `Error: ${resp.error || 'desconocido'}`}
              </div>

              <div className="resultRow">
                <span className="label">Subdominio</span>
                <div className="value">
                  {resp.published_url ? (
                    <>
                      <a href={resp.published_url} target="_blank" rel="noreferrer">{resp.published_url}</a>
                      <button className="mini" onClick={() => window.open(resp.published_url!, '_blank')}>Abrir</button>
                      <button className="mini" onClick={() => copy(resp.published_url!)}>Copiar</button>
                    </>
                  ) : (
                    <em className="muted">—</em>
                  )}
                </div>
              </div>

              <div className="resultRow">
                <span className="label">Blob (HTML)</span>
                <div className="value">
                  {resp.blob ? (
                    <>
                      <a href={resp.blob} target="_blank" rel="noreferrer">{resp.blob}</a>
                      <button className="mini" onClick={() => window.open(resp.blob!, '_blank')}>Abrir</button>
                      <button className="mini" onClick={() => copy(resp.blob!)}>Copiar</button>
                    </>
                  ) : (
                    <em className="muted">—</em>
                  )}
                </div>
              </div>

              <div className="resultRow">
                <span className="label">latest.json</span>
                <div className="value">
                  {resp.latest_url ? (
                    <>
                      <a href={resp.latest_url} target="_blank" rel="noreferrer">{resp.latest_url}</a>
                      <button className="mini" onClick={() => window.open(resp.latest_url!, '_blank')}>Abrir</button>
                      <button className="mini" onClick={() => copy(resp.latest_url!)}>Copiar</button>
                    </>
                  ) : (
                    <em className="muted">—</em>
                  )}
                </div>
              </div>

              <div className="resultRow">
                <span className="label">JSON</span>
                <div className="value mono">
                  <pre>{JSON.stringify(resp, null, 2)}</pre>
                  <button className="mini" onClick={() => copy(JSON.stringify(resp, null, 2), 'JSON copiado')}>Copiar JSON</button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      <style jsx>{`
        :root {
          --bg: radial-gradient(1200px 800px at 10% 0%, #e8f1ff 0%, transparent 60%),
                radial-gradient(1100px 900px at 90% 20%, #ffe8fb 0%, transparent 60%),
                radial-gradient(900px 600px at 50% 100%, #e7fff4 0%, transparent 60%),
                #0c0f14;
          --glass: rgba(255,255,255,0.14);
          --glass-strong: rgba(255,255,255,0.22);
          --stroke: rgba(255,255,255,0.28);
          --text: #f3f6fb;
          --muted: #c8d1e0;
          --accent: #3ea0ff;
          --ok: #28d07f;
          --err: #ff6374;
        }
        * { box-sizing: border-box; }
        html, body, .wrap { height: 100%; }
        body { margin: 0; }
        .wrap {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, "Apple Color Emoji","Segoe UI Emoji";
          padding: clamp(16px, 3vw, 40px);
        }
        .grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: clamp(16px, 2.4vw, 28px);
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (max-width: 980px) {
          .grid { grid-template-columns: 1fr; }
        }
        .card {
          backdrop-filter: blur(16px) saturate(140%);
          background: linear-gradient(180deg, var(--glass), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 22px;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.35),
            0 10px 30px rgba(6,14,32,0.25);
          padding: clamp(16px, 2vw, 22px);
        }
        .cardHeader { margin-bottom: 10px; }
        .title { display:flex; align-items:center; gap:10px; }
        .title h1 {
          font-size: clamp(20px, 3.2vw, 28px);
          margin: 0;
          font-weight: 700;
          letter-spacing: 0.2px;
        }
        .dot {
          width: 12px; height: 12px; border-radius: 6px;
          background: radial-gradient(circle at 30% 30%, #fff, #73c1ff);
          box-shadow: 0 0 16px #73c1ff;
        }
        .subtitle {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 14px;
        }
        .form .row { margin: 14px 0 18px; }
        label {
          display:block;
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }
        input[type="text"], input[type="password"], textarea {
          width: 100%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.16);
          color: var(--text);
          border-radius: 12px;
          padding: 12px 13px;
          outline: none;
          font-size: 14px;
          transition: border .15s ease, background .15s ease, box-shadow .15s ease;
        }
        input:focus, textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(62,160,255,0.20);
          background: rgba(255,255,255,0.10);
        }
        textarea {
          resize: vertical;
          min-height: 220px;
          line-height: 1.35;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        }
        small {
          color: var(--muted);
          display:block;
          margin-top: 8px;
          font-size: 12px;
        }
        .slugRow { display:flex; flex-direction: column; gap: 8px; }
        .slugHint code {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.16);
          color: var(--text);
          border-radius: 10px;
          padding: 4px 8px;
          font-size: 12px;
        }
        .muted { color: var(--muted); }

        .segmented { display:flex; gap: 8px; }
        .seg {
          flex: 1;
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.08);
          color: var(--text);
          cursor: pointer;
          transition: transform .08s ease, background .15s ease, border .15s ease;
        }
        .seg:hover { transform: translateY(-1px); }
        .seg.on {
          background: linear-gradient(180deg, rgba(62,160,255,0.25), rgba(255,255,255,0.06));
          border-color: rgba(62,160,255,0.55);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 14px rgba(62,160,255,0.35);
        }

        .actions { display:flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
        .primary, .ghost, .mini {
          border-radius: 12px;
          padding: 10px 14px;
          font-weight: 600;
          letter-spacing: 0.2px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform .08s ease, box-shadow .15s ease, background .15s ease, border .15s ease;
        }
        .primary {
          background: linear-gradient(180deg, rgba(62,160,255,0.85), rgba(62,160,255,0.60));
          border-color: rgba(255,255,255,0.18);
          color: #0c1220;
          text-shadow: 0 1px 0 rgba(255,255,255,0.45);
          box-shadow: 0 8px 22px rgba(62,160,255,0.35);
        }
        .primary:disabled {
          opacity: .6; cursor: not-allowed; box-shadow: none;
        }
        .ghost {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.16);
          color: var(--text);
        }
        .ghost:hover { transform: translateY(-1px); }
        .mini {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.18);
          color: var(--text);
          padding: 6px 10px;
          font-size: 12px;
        }
        .mini:hover { transform: translateY(-1px); }

        .resultCard .placeholder {
          padding: 18px;
          background: rgba(255,255,255,0.06);
          border: 1px dashed rgba(255,255,255,0.18);
          border-radius: 14px;
          color: var(--muted);
          text-align: center;
        }
        .resultRow {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 10px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .resultRow:last-child { border-bottom: none; }
        .label { color: var(--muted); font-size: 13px; }
        .value a {
          color: var(--accent);
          text-decoration: none;
          border-bottom: 1px dashed rgba(62,160,255,0.4);
          padding-bottom: 1px;
        }
        .value { display:flex; align-items:center; gap: 8px; flex-wrap: wrap; }
        .mono pre {
          max-height: 260px;
          overflow: auto;
          margin: 0;
          background: rgba(0,0,0,0.25);
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          width: 100%;
        }
        .status {
          margin: 8px 0 14px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.16);
          font-weight: 600;
          letter-spacing: .2px;
        }
        .status.ok { border-color: rgba(40,208,127,0.5); box-shadow: inset 0 0 0 1px rgba(40,208,127,0.3); }
        .status.err { border-color: rgba(255,99,116,0.55); box-shadow: inset 0 0 0 1px rgba(255,99,116,0.35); }

        .toast {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 14px;
          background: rgba(18,22,33,0.9);
          color: #fff;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 10px 26px rgba(0,0,0,0.35);
          z-index: 50;
          font-size: 14px;
          backdrop-filter: blur(6px);
        }
      `}</style>
    </div>
  );
}

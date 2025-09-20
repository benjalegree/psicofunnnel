'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Landing = {
  id: string;
  title: string;
  html?: string;       // opcional: si la home guarda el HTML completo
  code?: string;       // opcional: si la home guarda un "código" que luego resuelves a HTML
};

type PublishResp = {
  ok?: boolean;
  status?: number;
  error?: string;
  env?: string;
  mode?: 'publish' | 'draft';
  published_url?: string;
  blob?: string;
  latest_url?: string;
};

type Brand = { name: string; slug: string };

export default function PublishTesterPage() {
  // --------- Estado base ----------
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brandNameInput, setBrandNameInput] = useState('');
  const [brandSlugPreview, setBrandSlugPreview] = useState('');

  const [landings, setLandings] = useState<Landing[]>([]);
  const [selectedLandingId, setSelectedLandingId] = useState<string>('');
  const [manualCode, setManualCode] = useState(''); // pegar código/ID si no aparece en la lista

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<PublishResp | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // --------- Carga inicial desde localStorage ----------
  useEffect(() => {
    try {
      const brandRaw = localStorage.getItem('pf_brand');
      if (brandRaw) {
        const b = JSON.parse(brandRaw) as Brand;
        if (b?.name && b?.slug) setBrand(b);
      }
    } catch {}

    try {
      const ls = JSON.parse(localStorage.getItem('pf_landings') || '[]') as Landing[];
      if (Array.isArray(ls)) setLandings(ls);
    } catch {}
  }, []);

  // --------- Derivados ----------
  useEffect(() => {
    const s = slugify(brandNameInput);
    setBrandSlugPreview(s);
  }, [brandNameInput]);

  const canSetBrand = useMemo(() => {
    return !brand && brandNameInput.trim().length >= 2 && brandSlugPreview.length >= 2;
  }, [brand, brandNameInput, brandSlugPreview]);

  const selectedLanding = useMemo(
    () => landings.find(l => l.id === selectedLandingId) || null,
    [landings, selectedLandingId]
  );

  const canPublish = useMemo(() => {
    if (!brand) return false;
    // Debe haber seleccionado una landing o pegar un código
    return !!selectedLanding || !!manualCode.trim();
  }, [brand, selectedLanding, manualCode]);

  // --------- Acciones ----------
  function setToastMsg(msg: string, ms = 1400) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  function onSaveBrand() {
    if (!canSetBrand) return;
    const data: Brand = { name: brandNameInput.trim(), slug: brandSlugPreview };
    localStorage.setItem('pf_brand', JSON.stringify(data));
    setBrand(data);
    setToastMsg('Marca guardada ✔');
  }

  function onResetBrand() {
    // solo para debug manual; en producción, podrías ocultar esto
    localStorage.removeItem('pf_brand');
    setBrand(null);
    setBrandNameInput('');
    setBrandSlugPreview('');
    setToastMsg('Marca reiniciada');
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!canPublish || !brand) return;
    setLoading(true);
    setResp(null);

    try {
      // 1) Obtener HTML: desde la landing seleccionada o desde el "código" pegado
      const html = await resolveHtmlFromSelection(selectedLanding, manualCode);
      if (!html || !html.toLowerCase().includes('<!doctype html')) {
        setToastMsg('La landing debe ser un HTML completo');
        setLoading(false);
        return;
      }

      // 2) Publicar SIEMPRE en el subdominio de la marca del usuario
      const body = { slug: brand.slug, mode: 'publish', html };
      const r = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ya no se envía key
        body: JSON.stringify(body),
      });
      const j = (await r.json()) as PublishResp;
      setResp(j);
      if (j?.ok) setToastMsg('Publicado ✔', 1600);
      else setToastMsg('Error al publicar', 2200);
    } catch {
      setResp({ ok: false, error: 'Network error' });
      setToastMsg('Network error', 2200);
    } finally {
      setLoading(false);
    }
  }

  // --------- Render ----------
  return (
    <div className="wrap">
      <div className="grid">
        <section className="card formCard">
          <header className="cardHeader">
            <div className="title">
              <span className="dot" />
              <h1>Publicar tu sitio</h1>
            </div>
            <p className="subtitle">Define tu marca y elige qué landing será tu página principal.</p>
          </header>

          {!brand && (
            <div className="brandBox">
              <h3 className="h3">Primero, contame tu marca</h3>
              <div className="row">
                <label>Nombre de tu marca</label>
                <input
                  type="text"
                  placeholder="Ej: Café Aurora"
                  value={brandNameInput}
                  onChange={(e) => setBrandNameInput(e.target.value)}
                />
                <small>
                  Se publicará en&nbsp;
                  <code>{(brandSlugPreview || 'tu-marca')}.psicofunnel.online</code>
                </small>
              </div>
              <div className="actions">
                <button className="primary sm" disabled={!canSetBrand} onClick={onSaveBrand}>
                  Guardar marca
                </button>
              </div>
              <small className="note">Solo podés tener **una** marca por cuenta. Luego podés actualizar el contenido, no el subdominio.</small>
            </div>
          )}

          {brand && (
            <form onSubmit={handlePublish} className="form">
              <div className="brandHeader">
                <div>
                  <div className="brandLabel">Tu marca</div>
                  <div className="brandName">{brand.name}</div>
                  <div className="brandSub">
                    Se muestra como <code>{brand.slug}.psicofunnel.online</code>
                  </div>
                </div>
                {/* botón opcional de reset; quítalo si no lo querés visible */}
                <button type="button" className="mini danger" onClick={onResetBrand} title="Reiniciar (debug)">
                  Reiniciar marca
                </button>
              </div>

              <div className="row">
                <label>Tus landings</label>
                {landings.length === 0 ? (
                  <div className="placeholder small">
                    Aún no vemos landings guardadas. Crealas en la Home con la IA y volverán a aparecer aquí.
                  </div>
                ) : (
                  <div className="list">
                    {landings.map(l => (
                      <label key={l.id} className={`item ${selectedLandingId === l.id ? 'on' : ''}`}>
                        <input
                          type="radio"
                          name="landing"
                          checked={selectedLandingId === l.id}
                          onChange={() => setSelectedLandingId(l.id)}
                        />
                        <div className="itemBody">
                          <div className="itemTitle">{l.title || l.id}</div>
                          <div className="itemSub">{l.html ? 'HTML listo' : (l.code ? `Código: ${l.code}` : 'Pendiente')}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <small>Elegí una para publicar como principal. También podés pegar un código si hace falta.</small>
              </div>

              <div className="row compact">
                <label>Pegar código de landing (opcional)</label>
                <input
                  type="text"
                  placeholder="Pega el código de tu landing"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
                <small>Se usará solo si no seleccionás una de la lista.</small>
              </div>

              <div className="actions">
                <button className="primary" type="submit" disabled={!canPublish || loading}>
                  {loading ? 'Publicando…' : 'Publicar como principal'}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="card resultCard">
          <header className="cardHeader">
            <h2>Resultado</h2>
            <p className="subtitle">Tu página principal queda en tu subdominio.</p>
          </header>

          {!resp && (
            <div className="placeholder small">
              Publicá para ver el resultado aquí.
            </div>
          )}

          {!!resp && (
            <>
              <div className={`status ${resp.ok ? 'ok' : 'err'}`}>
                {resp.ok ? '¡Listo! Ya está publicada' : `Error: ${resp.error || 'desconocido'}`}
              </div>

              <div className="resultRow">
                <span className="label">Tu sitio</span>
                <div className="value">
                  {resp.published_url ? (
                    <>
                      <a href={resp.published_url} target="_blank" rel="noreferrer">{resp.published_url}</a>
                      <button className="mini" onClick={() => window.open(resp.published_url!, '_blank')}>Abrir</button>
                    </>
                  ) : (
                    <em className="muted">—</em>
                  )}
                </div>
              </div>

              <div className="resultRow">
                <span className="label">Versión</span>
                <div className="value">
                  {resp.blob ? (
                    <>
                      <a href={resp.blob} target="_blank" rel="noreferrer">Ver HTML</a>
                      <button className="mini" onClick={() => window.open(resp.blob!, '_blank')}>Abrir</button>
                    </>
                  ) : (
                    <em className="muted">—</em>
                  )}
                </div>
              </div>

              <div className="resultRow">
                <span className="label">Puntero</span>
                <div className="value">
                  {resp.latest_url ? (
                    <>
                      <a href={resp.latest_url} target="_blank" rel="noreferrer">latest.json</a>
                      <button className="mini" onClick={() => window.open(resp.latest_url!, '_blank')}>Abrir</button>
                    </>
                  ) : (
                    <em className="muted">—</em>
                  )}
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
          --bg: radial-gradient(900px 600px at 10% 0%, #eaf2ff 0%, transparent 60%),
                radial-gradient(800px 600px at 90% 20%, #ffeaf7 0%, transparent 60%),
                radial-gradient(700px 500px at 50% 100%, #e9fff3 0%, transparent 60%),
                #0d1117;
          --glass: rgba(255,255,255,0.12);
          --text: #eef3fb;
          --muted: #c8d1e0;
          --accent: #3ea0ff;
          --ok: #28d07f;
          --err: #ff6b7a;
        }
        * { box-sizing: border-box; }
        html, body, .wrap { height: 100%; }
        body { margin: 0; }
        .wrap {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans;
          padding: clamp(12px, 2vw, 20px);
        }
        .grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: clamp(12px, 2vw, 20px);
          max-width: 1100px;
          margin: 0 auto;
        }
        @media (max-width: 980px) {
          .grid { grid-template-columns: 1fr; }
        }
        .card {
          backdrop-filter: blur(14px) saturate(140%);
          background: linear-gradient(180deg, var(--glass), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 18px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 24px rgba(6,14,32,0.22);
          padding: clamp(12px, 1.6vw, 18px);
        }
        .cardHeader { margin-bottom: 8px; }
        .title { display:flex; align-items:center; gap:8px; }
        .title h1 {
          font-size: clamp(16px, 2.4vw, 22px);
          margin: 0;
          font-weight: 700;
          letter-spacing: 0.2px;
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #fff, #73c1ff); box-shadow: 0 0 12px #73c1ff; }
        .subtitle { margin: 4px 0 0; color: var(--muted); font-size: 12px; }

        .brandBox { margin-top: 6px; }
        .h3 { margin: 0 0 8px; font-size: 14px; }
        .brandHeader {
          display:flex; justify-content: space-between; align-items: flex-start;
          gap: 8px; padding: 8px; border: 1px solid rgba(255,255,255,0.10); border-radius: 12px;
          background: rgba(255,255,255,0.06);
        }
        .brandLabel { font-size: 11px; color: var(--muted); }
        .brandName { font-weight: 700; font-size: 14px; }
        .brandSub { font-size: 12px; color: var(--muted); margin-top: 2px; }

        .form .row { margin: 10px 0 12px; }
        .row.compact { margin-top: 6px; }
        label { display:block; font-size: 12px; color: var(--muted); margin-bottom: 6px; }

        input[type="text"], textarea {
          width: 100%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.14);
          color: var(--text);
          border-radius: 10px;
          padding: 9px 10px;
          outline: none;
          font-size: 13px;
          transition: border .15s ease, background .15s ease, box-shadow .15s ease;
        }
        input:focus, textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(62,160,255,0.18);
          background: rgba(255,255,255,0.09);
        }
        textarea {
          resize: vertical;
          min-height: 160px;
          line-height: 1.34;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        small { color: var(--muted); display:block; margin-top: 6px; font-size: 11px; }

        .list { display: grid; gap: 6px; }
        .item {
          display:flex; gap: 10px; align-items: center;
          padding: 8px; border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          cursor: pointer;
        }
        .item.on { border-color: rgba(62,160,255,0.45); box-shadow: inset 0 0 0 1px rgba(62,160,255,0.30); }
        .item input { margin: 0; }
        .itemBody { display:flex; flex-direction: column; }
        .itemTitle { font-size: 13px; font-weight: 600; }
        .itemSub { font-size: 11px; color: var(--muted); }

        .actions { display:flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
        .primary, .mini, .danger {
          border-radius: 10px; padding: 8px 12px; font-weight: 600; letter-spacing: 0.2px; border: 1px solid transparent; cursor: pointer; transition: transform .08s, box-shadow .15s, background .15s, border .15s;
          font-size: 13px;
        }
        .primary {
          background: linear-gradient(180deg, rgba(62,160,255,0.8), rgba(62,160,255,0.58));
          border-color: rgba(255,255,255,0.16);
          color: #07111d;
          text-shadow: 0 1px 0 rgba(255,255,255,0.45);
          box-shadow: 0 6px 18px rgba(62,160,255,0.34);
        }
        .primary.sm { padding: 7px 11px; font-size: 12px; }
        .primary:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }
        .mini {
          background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.16); color: var(--text); padding: 6px 9px; font-size: 11px;
        }
        .mini.danger, .danger {
          background: rgba(255,99,122,0.12); border-color: rgba(255,99,122,0.36); color: #ffd5db;
        }

        .resultCard .placeholder {
          padding: 14px; background: rgba(255,255,255,0.06); border: 1px dashed rgba(255,255,255,0.16); border-radius: 12px; color: var(--muted); text-align: center; font-size: 12px;
        }
        .resultRow {
          display: grid; grid-template-columns: 110px 1fr; gap: 8px; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);
          font-size: 13px;
        }
        .resultRow:last-child { border-bottom: none; }
        .label { color: var(--muted); font-size: 12px; }
        .value { display:flex; align-items:center; gap: 8px; flex-wrap: wrap; }
        .value a { color: var(--accent); text-decoration: none; border-bottom: 1px dashed rgba(62,160,255,0.4); padding-bottom: 1px; }

        .toast {
          position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
          padding: 8px 12px; background: rgba(18,22,33,0.9); color: #fff; border-radius: 10px; border: 1px solid rgba(255,255,255,0.18); box-shadow: 0 10px 24px rgba(0,0,0,0.32);
          z-index: 50; font-size: 12px; backdrop-filter: blur(5px);
        }
      `}</style>
    </div>
  );
}

/** Util: slugify simple */
function slugify(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resuelve HTML a publicar según selección.
 * - Si la landing trae html, se usa.
 * - Si trae code, podrías transformarlo aquí a HTML (placeholder).
 * - Si no hay selection, intenta desde manualCode.
 */
async function resolveHtmlFromSelection(landing: Landing | null, manualCode: string): Promise<string> {
  // 1) Landing con HTML
  if (landing?.html && landing.html.toLowerCase().includes('<!doctype html')) {
    return landing.html;
  }
  // 2) Landing con code → aquí puedes resolver contra tu backend si hace falta
  if (landing?.code) {
    // TODO: reemplazar por tu fetch real, si ese "code" representa un ID que devuelve HTML completo.
    // De momento, si "code" es HTML completo, úsalo; si no, lo ignoramos.
    if (landing.code.toLowerCase().includes('<!doctype html')) return landing.code;
  }
  // 3) Manual code pegado
  if (manualCode && manualCode.toLowerCase().includes('<!doctype html')) {
    return manualCode;
  }
  return '';
}


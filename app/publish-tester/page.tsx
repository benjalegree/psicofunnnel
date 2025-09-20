'use client';

import React, { useEffect, useMemo, useState } from 'react';

/** Tipos */
type Brand = { name: string; slug: string };
type Landing = { id: string; title: string; html?: string; code?: string };
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

/** Helpers */
const slugify = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleString(undefined, { hour12: false });

/** Storage keys alineados con la Home */
const LS_BRAND = 'pf_brand';
const LS_BRIEF = 'pf_brief_v1';
const LS_LANDINGS = 'pf_landings';

export default function PublishTesterPage() {
  /** Navbar / sesión (simple) */
  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    const email = localStorage.getItem('psico_email');
    if (email) setUserEmail(email);
  }, []);

  /** Marca + landings */
  const [brand, setBrand] = useState<Brand | null>(null);
  const [landings, setLandings] = useState<Landing[]>([]);

  /** Elección + HTML manual */
  const [selectedLandingId, setSelectedLandingId] = useState('');
  const [manualHtml, setManualHtml] = useState('');

  /** Publicación */
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<PublishResp | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /** Carga inicial */
  useEffect(() => {
    try {
      const b = JSON.parse(localStorage.getItem(LS_BRAND) || 'null') as Brand | null;
      if (b?.slug) setBrand(b);
    } catch {}
    try {
      const ls = JSON.parse(localStorage.getItem(LS_LANDINGS) || '[]') as Landing[];
      if (Array.isArray(ls)) setLandings(ls);
    } catch {}
  }, []);

  const selectedLanding = useMemo(
    () => landings.find(l => l.id === selectedLandingId) || null,
    [landings, selectedLandingId]
  );

  const canPublish = useMemo(() => {
    if (!brand) return false;
    const hasSelection = !!selectedLanding;
    const hasManual = manualHtml.trim().toLowerCase().includes('<!doctype html');
    return hasSelection || hasManual;
  }, [brand, selectedLanding, manualHtml]);

  function toastMsg(msg: string, ms = 1400) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  /** Resolver HTML según selección o manual */
  async function resolveHtml(): Promise<string> {
    if (selectedLanding?.html && selectedLanding.html.toLowerCase().includes('<!doctype html')) {
      return selectedLanding.html;
    }
    if (manualHtml.trim().toLowerCase().includes('<!doctype html')) {
      return manualHtml.trim();
    }
    return '';
  }

  /** Sincronizar a pf_landings si hace falta (para que aparezca también en la Home) */
  function ensureLandingInLocalList(titleHint: string, html: string) {
    let updated = [...landings];
    let exists = false;

    // Si el seleccionado existe, actualizamos su HTML
    if (selectedLanding) {
      updated = updated.map(l => (l.id === selectedLanding.id ? { ...l, html } : l));
      exists = true;
    }

    if (!exists) {
      const id = `landing-${Date.now()}`;
      const title = titleHint || `Landing ${fmtDate(Date.now())}`;
      updated.unshift({ id, title, html });
    }

    setLandings(updated);
    localStorage.setItem(LS_LANDINGS, JSON.stringify(updated));
  }

  /** Publicar como principal (siempre al subdominio de la marca) */
  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!brand) { toastMsg('Primero definí tu marca en la Home'); return; }
    const html = await resolveHtml();
    if (!html || !html.toLowerCase().includes('<!doctype html')) {
      toastMsg('Pegá un HTML completo o elegí una landing'); return;
    }

    setLoading(true);
    setResp(null);
    try {
      const r = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // sin key (no pedimos contraseña)
        body: JSON.stringify({
          slug: brand.slug,       // SIEMPRE tu subdominio de marca
          mode: 'publish',
          html
        })
      });
      const j = (await r.json()) as PublishResp;
      setResp(j);

      if (j?.ok) {
        toastMsg('Publicado ✔', 1600);
        // Sincronizamos a pf_landings para que también aparezca en la Home
        const titleHint = selectedLanding?.title || `${brand.name} — principal`;
        ensureLandingInLocalList(titleHint, html);
      } else {
        toastMsg(j?.error || 'Error al publicar', 2200);
      }
    } catch {
      setResp({ ok: false, error: 'Network error' });
      toastMsg('Network error', 2200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {/* NAVBAR (igual estética a Home) */}
      <div className="nav glass">
        <div className="inner container">
          <div className="brand">
            <div className="logo" aria-hidden="true" />
            <div>PsicoFunnel</div>
            <span className="badge" title="Sección actual">Dominio</span>
          </div>
          <div className="tabs" role="tablist" aria-label="Secciones">
            <a className="tab" role="tab" href="/">Creador</a>
            <a className="tab" role="tab" href="/crm" id="navLeads">Leads</a>
            <a className="tab" role="tab" href="/secuencias" id="navSeq">Secuencias</a>
            <a className="tab" role="tab" href="/analytics" id="navAnalytics">Analytics</a>
            <a className="tab active" role="tab" aria-selected="true" href="/publish-tester" id="navDominio">Dominio</a>
          </div>
          <div className="login">
            <span className="hint" id="loginStatus">
              {userEmail ? `Conectado: ${userEmail}` : 'No has iniciado sesión'}
            </span>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="container contentGrid">
        <section className="card formCard">
          <header className="cardHeader">
            <div className="title">
              <span className="dot" />
              <h1>Publicar como principal</h1>
            </div>
            <p className="subtitle">
              Tu sitio queda en <strong>{brand?.slug || 'tu-marca'}.psicofunnel.online</strong>
            </p>
          </header>

          {!brand && (
            <div className="placeholder small">
              Primero definí tu marca en la Home. <a href="/">Ir al Creador</a>
            </div>
          )}

          {brand && (
            <form onSubmit={handlePublish} className="form">
              <div className="brandHeader">
                <div>
                  <div className="brandLabel">Tu marca</div>
                  <div className="brandName">{brand.name}</div>
                  <div className="brandSub">
                    Subdominio: <code>{brand.slug}.psicofunnel.online</code>
                  </div>
                </div>
              </div>

              <div className="row">
                <label>Tus landings</label>
                {landings.length === 0 ? (
                  <div className="placeholder small">
                    Aún no vemos landings guardadas. Crealas en la Home con la IA.
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
                        <div className="itemMeta">{/* espacio para fecha u otras cosas */}</div>
                      </label>
                    ))}
                  </div>
                )}
                <small>Elegí una para publicar como principal. O pegá un HTML abajo.</small>
              </div>

              <div className="row compact">
                <label>Pegar HTML (opcional)</label>
                <textarea
                  rows={10}
                  placeholder="Pega aquí un documento HTML completo (<!doctype html> …)"
                  value={manualHtml}
                  onChange={(e) => setManualHtml(e.target.value)}
                  spellCheck={false}
                />
                <small>Si pegás HTML, se usará ese. Si no, se publicará la landing seleccionada.</small>
              </div>

              <div className="actions">
                <button className="primary" type="submit" disabled={!canPublish || loading}>
                  {loading ? 'Publicando…' : 'Publicar como principal'}
                </button>
                <a className="ghost" href="/">Volver al Creador</a>
              </div>
            </form>
          )}
        </section>

        <section className="card resultCard">
          <header className="cardHeader">
            <h2>Resultado</h2>
            <p className="subtitle">Tu subdominio apunta siempre a la última versión publicada.</p>
          </header>

          {!resp && (
            <div className="placeholder small">Publicá para ver el resultado aquí.</div>
          )}

          {resp && (
            <>
              <div className={`status ${resp.ok ? 'ok' : 'err'}`}>
                {resp.ok ? '¡Listo! Ya está publicada' : `Error: ${resp.error || 'desconocido'}`}
              </div>

              <div className="resultRow">
                <span className="label">Tu sitio</span>
                <div className="value">
                  {resp.published_url ? (
                    <a href={resp.published_url} target="_blank" rel="noreferrer">{resp.published_url}</a>
                  ) : <em className="muted">—</em>}
                </div>
              </div>

              <div className="resultRow">
                <span className="label">Versión</span>
                <div className="value">
                  {resp.blob ? (
                    <a href={resp.blob} target="_blank" rel="noreferrer">Ver HTML</a>
                  ) : <em className="muted">—</em>}
                </div>
              </div>

              <div className="resultRow">
                <span className="label">Puntero</span>
                <div className="value">
                  {resp.latest_url ? (
                    <a href={resp.latest_url} target="_blank" rel="noreferrer">latest</a>
                  ) : <em className="muted">—</em>}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}

      {/* ESTILOS */}
      <style jsx>{`
        :root{
          --bg:#f7f9fc;
          --bg-grad: radial-gradient(1100px 700px at 18% -10%, #eaf2ff 0%, rgba(234,242,255,0) 60%),
                     radial-gradient(900px 650px at 90% 0%, #f0fbff 0%, rgba(240,251,255,0) 60%);
          --card: rgba(255,255,255,.68);
          --border: rgba(11,95,255,.18);
          --text:#0b1220;
          --muted:#6b7280;
          --accent:#0b5fff;
          --primary:#0ea5e9;
          --ok:#10b981;
          --err:#ef4444;
          --radius-2xl: 20px;
          --radius-xl: 16px;
          --glass-blur: 16px;
        }
        *{box-sizing:border-box}
        html,body,.page{height:100%}
        body{margin:0; background:var(--bg); background-image:var(--bg-grad); font-family: Inter, system-ui, Segoe UI, Roboto, Arial; color:var(--text)}
        .container{max-width:1120px; margin:0 auto; padding:0 16px}

        .glass{
          background:var(--card);
          border:1px solid var(--border);
          backdrop-filter:saturate(1.28) blur(var(--glass-blur));
          -webkit-backdrop-filter:saturate(1.28) blur(var(--glass-blur));
          border-radius:var(--radius-2xl);
          box-shadow: 0 14px 40px rgba(2,6,23,.10);
        }
        .nav{
          position:sticky; top:0; z-index:50; height:64px; display:flex; align-items:center;
          backdrop-filter:saturate(1.2) blur(12px);
          -webkit-backdrop-filter:saturate(1.2) blur(12px);
          border-bottom:1px solid rgba(11,95,255,.10);
        }
        .nav .inner{display:flex; align-items:center; justify-content:space-between}
        .brand{ display:flex; align-items:center; gap:10px; font-weight:900; letter-spacing:.2px; }
        .brand .logo{
          width:30px; height:30px; border-radius:12px;
          background:linear-gradient(135deg,#0b5fff 0%, #0ea5e9 100%);
          box-shadow:0 10px 26px rgba(11,95,255,.22), inset 0 0 18px rgba(255,255,255,.35);
          position:relative; overflow:hidden;
        }
        .badge{
          margin-left:6px; padding:6px 10px; border-radius:999px; font-weight:700; font-size:11px;
          background:rgba(14,165,233,.12); color:#0b3aa6; border:1px solid rgba(11,95,255,.22);
        }
        .tabs{display:flex; gap:8px; align-items:center}
        .tab{
          padding:7px 10px; border-radius:999px; font-weight:700; font-size:12px;
          background:rgba(255,255,255,.7); border:1px solid rgba(11,95,255,.14);
          text-decoration:none; color:inherit;
        }
        .tab.active{background:linear-gradient(135deg,rgba(11,95,255,.16), rgba(14,165,233,.16)); color:#0b3aa6}
        .login .hint{ font-size:12px; color:#475569 }

        .contentGrid{
          display:grid; grid-template-columns: 1.1fr 0.9fr; gap:12px; margin:12px auto 16px;
        }
        @media (max-width: 960px){ .contentGrid{ grid-template-columns:1fr; } }

        .card{
          border-radius: var(--radius-xl);
          background: rgba(255,255,255,.82);
          border: 1px solid rgba(11,95,255,.12);
          box-shadow: 0 10px 26px rgba(2,6,23,.08);
          padding: 12px;
          font-size: 13px;
        }
        .cardHeader { margin-bottom: 6px; }
        .title{ display:flex; align-items:center; gap:8px; }
        .title h1{ margin:0; font-size:18px; }
        .dot{ width:8px; height:8px; border-radius:50%; background: radial-gradient(circle at 30% 30%, #fff, #73c1ff); box-shadow: 0 0 10px #73c1ff; }
        .subtitle{ margin: 3px 0 0; color:#64748b; font-size:12px }

        .brandHeader{
          display:flex; justify-content:space-between; align-items:flex-start; gap:8px;
          padding:8px; border:1px solid rgba(11,95,255,.12); border-radius:12px; background: rgba(255,255,255,.6);
        }
        .brandLabel{ font-size:11px; color:#64748b; }
        .brandName{ font-size:14px; font-weight:700; }
        .brandSub{ font-size:12px; color:#64748b; margin-top:2px; }

        .form .row{ margin: 10px 0 12px; }
        .row.compact{ margin-top: 6px; }
        label{ display:block; font-size:12px; color:#64748b; margin-bottom:6px; }
        input[type="text"], textarea{
          width:100%; background: rgba(255,255,255,.75); border:1px solid rgba(11,95,255,.16);
          color:#0b1220; border-radius:10px; padding:8px 10px; outline:none; font-size:13px;
        }
        textarea{ resize: vertical; line-height:1.34; min-height:140px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
        small{ color:#64748b; display:block; margin-top:6px; font-size:11px; }
        .list{ display: grid; gap:6px; }
        .item{ display:flex; gap:10px; align-items:center; padding:8px; border-radius:10px; background: rgba(255,255,255,.7); border:1px solid rgba(11,95,255,.14); cursor:pointer; }
        .item.on{ border-color: rgba(62,160,255,.45); box-shadow: inset 0 0 0 1px rgba(62,160,255,.28); }
        .item input{ margin:0 }
        .itemBody{ display:flex; flex-direction:column; }
        .itemTitle{ font-size:13px; font-weight:700; }
        .itemSub{ font-size:11px; color:#64748b; }
        .itemMeta{ margin-left:auto; font-size:11px; color:#64748b; }

        .actions{ display:flex; gap:8px; flex-wrap:wrap; margin-top: 6px; }
        .primary, .ghost{
          border-radius: 10px; padding: 8px 12px; font-weight: 700; letter-spacing: 0.2px; border: 1px solid transparent; cursor: pointer;
          transition: transform .08s ease, background .15s ease, border .15s ease, box-shadow .15s ease; font-size: 12.5px;
        }
        .primary{
          background: linear-gradient(180deg, rgba(62,160,255,.82), rgba(62,160,255,.62));
          border-color: rgba(255,255,255,.16);
          color:#07111d;
          box-shadow: 0 6px 18px rgba(62,160,255,.32);
        }
        .primary:disabled{ opacity:.6; cursor:not-allowed; box-shadow:none; }
        .ghost{
          background: rgba(255,255,255,.7); border-color: rgba(11,95,255,.16); color:#0b3aa6;
        }

        .resultCard .placeholder{
          padding: 12px; background: rgba(255,255,255,.7); border: 1px dashed rgba(11,95,255,.18); border-radius: 12px; color:#64748b; text-align:center; font-size:12px;
        }
        .resultRow{
          display:grid; grid-template-columns: 110px 1fr; gap:8px; align-items:center; padding:8px 0; border-bottom:1px solid rgba(11,95,255,.10);
        }
        .resultRow:last-child{ border-bottom:none }
        .label{ color:#64748b; font-size:12px }
        .value a{ color:#0b5fff; text-decoration:none; border-bottom:1px dashed rgba(11,95,255,.35); padding-bottom:1px }

        .placeholder.small{
          padding: 12px; text-align:center; color:#64748b;
          border:1px dashed rgba(11,95,255,.18); border-radius:12px; background: rgba(255,255,255,.6); font-size:12px;
        }

        .toast{
          position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%);
          padding: 8px 12px; background: rgba(18,22,33,.9); color: #fff; border-radius: 10px; border: 1px solid rgba(255,255,255,.18);
          box-shadow: 0 10px 24px rgba(0,0,0,.32); z-index: 60; font-size: 12px; backdrop-filter: blur(5px);
        }
      `}</style>
    </div>
  );
}


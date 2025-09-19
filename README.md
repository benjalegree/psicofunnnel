# PsicoFunnel (Next 14 + Vercel Blob) — Multi-page por marca

## Qué hace
- Publica HTML en Vercel Blob como **draft** o **publish** (por **marca** y **subruta**).
- Sirve páginas publicadas en `https://{marca}.psicofunnel.online[/path]`.
- Sirve previews en `https://psicofunnel.online/preview/{marca}[/path]`.
- Home y CRM se sirven como archivos estáticos desde `/public` (los pones vos).

## Variables de entorno (Vercel)
- `PUBLISH_KEY` (para POST /api/publish)
- `BLOB_READ_WRITE_TOKEN` (token de Vercel Blob con permisos RW)
- `APPS_SCRIPT_ENDPOINT` (opcional, si lo usa tu CRM embebido)

## Publicación (API)
`POST /api/publish`
```json
{
  "key": "PUBLISH_KEY",
  "brand": "mi-marca",
  "path": "lp2", // opcional: '' | 'lp2' | 'a/b'
  "html": "<!doctype html>...",
  "mode": "draft" // o "publish"
}
```
- Guarda en Blob:
  - Drafts: `drafts/{brand}/[path]/index.html`
  - Sites: `sites/{brand}/[path]/index.html`

## Rutas de serving
- Publicados: `/s/{brand}[[...segments]]` → `sites/{brand}/[segments]/index.html`
- Previews: `/preview/{brand}[[...segments]]` → `drafts/{brand}/[segments]/index.html`
- Subdominios: `{brand}.psicofunnel.online/[segments]` → middleware → `/s/{brand}/[segments]`

## Archivos estáticos (los subís vos)
- `/public/index.html`
- `/public/crm/index.html`

## Domains
- `psicofunnel.online` → Attach/Serve este proyecto.
- `www.psicofunnel.online` → Attach; el `vercel.json` ya hace www → apex.
- `*.psicofunnel.online` → Attach; sin redirect.

## Tester
`/publish-tester` — UI simple para publicar brand+path (usa tu PUBLISH_KEY).

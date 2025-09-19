# PsicoFunnel (Next 14 + Vercel Blob)

## Qué hace
- Publica HTML en Vercel Blob como **draft** o **publish**.
- Sirve borradores en `/preview/[slug]` y publicados en `/s/[slug]`.
- Redirige subdominios `{slug}.psicofunnel.online` → `/s/{slug}` (middleware).
- Home y CRM se sirven como archivos estáticos desde `/public`.

## Variables de entorno (Vercel)
- `PUBLISH_KEY` (para POST /api/publish)
- `BLOB_READ_WRITE_TOKEN` (token de Vercel Blob con permisos RW)
- `APPS_SCRIPT_ENDPOINT` (opcional, si lo usa tu CRM embebido)

## Rutas
- `POST /api/publish` — body: `{ key, slug, html, mode: "draft"|"publish" }`
- `GET /preview/[slug]` — lee `drafts/{slug}/index.html`
- `GET /s/[slug]` — lee `sites/{slug}/index.html`
- `GET /publish-tester` — UI simple para probar publicación

## Archivos estáticos (los ponés vos)
- `/public/index.html`
- `/public/crm/index.html`

## Dominio
- En Vercel → Domains:
  - `psicofunnel.online` **attach/serve** este proyecto.
  - `www.psicofunnel.online` **attach** a este proyecto (el `vercel.json` hace www→apex).
  - `*.psicofunnel.online` **attach** a este proyecto (sin redirect).

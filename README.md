# Proyecto listo (dominio nuevo)
1) Sube el contenido a la raíz del repo.
2) Vercel → Import Project → Deploy.
3) Vercel → Settings → Environment Variables:
   - PUBLISH_KEY = psico_pub_galo_millonario
   - BLOB_READ_WRITE_TOKEN = vercel_blob_rw_xxx  (sin comillas)
4) Vercel → Storage → Blob → Create (si no existe).
5) Conecta tu dominio (Vercel DNS con ns1/ns2.vercel-dns.com, o A/CNAME en tu registrador).
6) Prueba `/publish-tester` → DRAFT → PUBLISH → `/_serve?slug=demo` y `https://demo.tudominio.com`.

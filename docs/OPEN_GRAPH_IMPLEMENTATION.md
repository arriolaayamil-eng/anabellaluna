# Open Graph Dinámico para Anabella Luna

Este documento describe la implementación de meta tags Open Graph dinámicos para las páginas de propiedades, con generación automática de imágenes optimizadas 1200×630 para WhatsApp, Facebook, Telegram y LinkedIn.

---

## Resumen del Problema

**Estado anterior:**
- Frontend público es una SPA pura (Vite + React) sin SSR.
- WhatsApp recibía el `index.html` estático sin meta tags dinámicos.
- Al compartir una propiedad, los crawlers mostraban el favicon en lugar de la foto de portada.
- Los previews aparecían pequeños (thumbnail) porque no había dimensiones explícitas en `og:image`.

**Objetivo:**
- Servir HTML con meta tags OG dinámicos específicos por propiedad.
- Generar imágenes 1200×630 optimizadas (large card) para todas las plataformas sociales.
- Mantener la arquitectura SPA sin migrar a SSR.

---

## Arquitectura de la Solución

### 1. Renderizado de HTML con Meta Tags

**Archivo:** `backend/openGraph.js`

Express router intercepta las rutas `/buy/:slug` y `/rent/:slug` **antes** de servir el SPA estático:

```javascript
// server.js — montado antes de todas las rutas
app.use(buildPropertyOGRouter());
```

**Flujo:**
1. Recibe slug desde `req.params.slug`
2. Busca propiedad en MongoDB (mismo lógica que `/public/properties/:slug`)
3. Construye:
   - `og:title`: título comercial (tipo + operación + ubicación)
   - `og:description`: descripción truncada a 200 caracteres
   - `og:image`: URL absoluta HTTPS a `/public/og/<propertyId>.jpg`
   - `og:url`: URL canónica de la propiedad
4. Lee `frontend/dist/index.html` desde disco
5. Inyecta meta tags después de `<meta charset="UTF-8" />`
6. Reemplaza `<title>` con el título de la propiedad
7. Devuelve HTML modificado con `Cache-Control: public, max-age=300`

**Fallback:**
- Si la propiedad no existe o falla cualquier paso → devuelve `index.html` original sin cambios (SPA sigue funcionando normal).

---

### 2. Generación de Imagen OG 1200×630

**Archivo:** `backend/services/ogImage.js`

Endpoint: `GET /public/og/:propertyId.jpg` (registrado en `routes/public.js`)

**Procesamiento con Sharp:**

```javascript
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_QUALITY = 82;
```

**Estrategia por orientación:**

| Orientación original | Procesamiento Sharp |
|---|---|
| **Landscape** (`w ≥ h`) | `resize(1200, 630, { fit: 'cover', position: 'centre' })` |
| **Portrait** (`h > w`) | 1. `resize(1200, 630, { fit: 'cover' })` → blur+darken (fondo)<br>2. `resize(null, 630, { fit: 'inside' })` → overlay nítido<br>3. Composite overlay centrado sobre fondo |

Sin distorsión en ningún caso.

**Cache en MinIO:**
- Clave: `og-images/<propertyId>.jpg`
- Bucket: `MINIO_BUCKET_WEB` (o fallback a `MINIO_BUCKET_ERP`)
- Content-Type: `image/jpeg`
- TTL: 24 horas (`Cache-Control: public, max-age=86400`)

**Flujo de caché:**
1. Primer request: genera con Sharp → guarda en MinIO → responde buffer
2. Segundo request: lee desde MinIO (sin Sharp) → respuesta inmediata

**Fallback:**
- Si Sharp falla → stream original de MinIO (foto cruda)
- Si no hay imágenes → 404

---

### 3. Meta Tags Inyectados

**En `openGraph.js` — `buildMetaTagsHtml()`:**

```html
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Anabella Luna" />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://anabellaluna.com.ar/public/og/ID.jpg" />
<meta property="og:image:secure_url" content="https://anabellaluna.com.ar/public/og/ID.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:url" content="https://anabellaluna.com.ar/buy/SLUG" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://anabellaluna.com.ar/public/og/ID.jpg" />
```

**Meta tags clave para large card:**
- `og:image:width=1200` + `og:image:height=630` → dimensiones explícitas
- `twitter:card=summary_large_image` → Twitter/X
- `og:image:type=image/jpeg` → tipo MIME explícito

---

## Configuración Nginx

**Archivo:** `nginx-og.conf` (ejemplo de configuración completa)

El bloque crítico para rutas OG:

```nginx
location ~ ^/(buy|rent)/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_read_timeout 30s;
    add_header Cache-Control "public, max-age=300";
}
```

**Importante:** Este bloque debe ir **antes** de la regla `try_files` del SPA estático.

---

## Variables de Entorno

**Archivo:** `backend/.env`

```bash
SITE_ORIGIN=https://anabellaluna.com.ar
```

Usado por `openGraph.js` para construir URLs absolutas HTTPS.

---

## Archivos Modificados

| Archivo | Cambio |
|---|---|
| `backend/openGraph.js` | Router `/buy/:slug` + `/rent/:slug` → inyecta meta tags dinámicos |
| `backend/services/ogImage.js` | Nuevo servicio Sharp → genera 1200×630 JPEG + cache MinIO |
| `backend/routes/public.js` | Endpoint `/public/og/:propertyId.jpg` |
| `backend/server.js` | `app.use(buildPropertyOGRouter())` antes de rutas existentes |
| `backend/.env` | Variable `SITE_ORIGIN` |
| `nginx-og.conf` | Configuración Nginx de referencia |

---

## Verificación y Testing

### 1. Verificar meta tags en HTML

```bash
curl -s https://anabellaluna.com.ar/buy/SLUG_REAL | grep -E "og:|twitter:"
```

Debe mostrar:
```html
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/jpeg" />
```

### 2. Verificar endpoint de imagen

```bash
curl -I https://anabellaluna.com.ar/public/og/PROPERTY_ID.jpg
```

Debe mostrar:
```
HTTP/1.1 200 OK
Content-Type: image/jpeg
Cache-Control: public, max-age=86400
```

### 3. Facebook Sharing Debugger

- URL: https://developers.facebook.com/tools/debug/
- Ingresar URL de propiedad
- Click "Scrape Again" para forzar revalidación
- Verificar que muestra imagen 1200×630

### 4. LinkedIn Post Inspector

- URL: https://www.linkedin.com/post-inspector/
- Ingresar URL de propiedad
- Verificar preview grande

### 5. WhatsApp

- Enviar enlace a un chat
- Debe mostrar preview grande con foto de portada
- Si muestra thumbnail pequeño → verificar dimensiones en meta tags

---

## Despliegue en Servidor

### 1. Pull de cambios

```bash
cd /var/www/anabella
git pull origin main
```

### 2. Reiniciar backend

```bash
pm2 restart backend
```

### 3. Configurar Nginx

```bash
# Copiar bloque location ~ ^/(buy|rent)/ al server{} activo
sudo nano /etc/nginx/sites-available/anabellaluna

# Validar
sudo nginx -t

# Recargar
sudo nginx -s reload
```

### 4. Verificar SITE_ORIGIN

```bash
echo $SITE_ORIGIN  # debe ser https://anabellaluna.com.ar
# Si no está, agregar al .env del backend:
echo "SITE_ORIGIN=https://anabellaluna.com.ar" >> /var/www/anabella/backend/.env
pm2 restart backend
```

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Backend down → SPA rota | Fallback a `index.html` en catch, siempre responde |
| Propiedad no existe | Devuelve `index.html` sin error 404 |
| Sharp falla (imagen corrupta) | Endpoint `/public/og/:id.jpg` cae a stream original |
| MinIO no disponible | Endpoint `/public/og/:id.jpg` responde 503 con mensaje claro |
| Cache muy agresivo → imagen no actualiza | `max-age=86400` (24h) + `invalidateOGCache()` disponible |
| `index.html` no existe | Loguea error claro: *"Frontend not built. Run npm run build first."* |
| Primera generación lenta (~500ms) | Solo afecta primer request; siguientes son cache hit |
| URL imagen relativa → WhatsApp rechaza | `buildOGImageUrl()` siempre devuelve URL absoluta HTTPS |

---

## Invalidación de Caché

Si cambia la foto de portada de una propiedad, invalidar la caché OG:

```javascript
const { invalidateOGCache } = require('./services/ogImage');

await invalidateOGCache(propertyId);
```

Esto elimina `og-images/<propertyId>.jpg` de MinIO, forzando regeneración en el próximo request.

---

## Rendimiento

| Operación | Tiempo típico |
|---|---|
| **Cache HIT (MinIO)** | ~10-20ms |
| **Cache MISS + Sharp** | ~200-800ms (depende tamaño original) |
| **HTML render (sin Sharp)** | ~50-100ms (query MongoDB + string replace) |

El overhead de Sharp es aceptable porque:
- Solo ocurre una vez por propiedad (primera visita)
- Cache MinIO persiste 24h
- Fallback a stream original si falla

---

## Referencias

- [Open Graph Protocol](https://ogp.me/)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters/images/)
- [Twitter Card Types](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

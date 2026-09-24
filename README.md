# Uvita Concierge Experience — Sitio web

Sitio web del negocio de concierge, tours y atención a villas **Uvita Concierge Experience**
(Uvita / Costa Ballena, Puntarenas, Costa Rica).

> **Para quien continúe este proyecto:** este documento explica qué hay hecho, cómo
> funciona, cómo editarlo y qué falta. Si tomas el proyecto sin contexto previo,
> **empieza leyendo esto completo.** Está pensado para que nadie tenga que adivinar nada.

---

## 1. Qué es (y qué NO es)

- Es un **sitio web estático**: solo HTML, CSS y JavaScript puro. **No usa frameworks**
  (React/Vue/etc.), **no requiere compilación** ni `npm run build`, y **no tiene backend
  ni base de datos** todavía.
- El contenido editable (textos, imágenes, servicios, experiencias) vive en un único
  archivo: **`data.json`**. El objetivo de diseño es poder cambiar el contenido sin tocar
  el código HTML.
- Las imágenes **no están incrustadas** en el HTML: se cambian sustituyendo archivos en
  `assets/` y actualizando la ruta en `data.json`.

**Stack:** HTML5 semántico · CSS (variables de marca) · JavaScript vanilla · JSON.

---

## 2. Estructura de archivos

```
Uvita_Concierge_Experience/
├── index.html              Página principal (home)
├── admin.html              Panel de administración (edición vía localStorage)
├── admin.css / admin.js    Estilos y lógica del panel
├── styles.css              Estilos de todo el sitio público
├── script.js               Lógica: carga data.json, WhatsApp, redes, menú, render
├── data.json               ⭐ CONTENIDO EDITABLE (textos, imágenes, servicios, etc.)
├── robots.txt              SEO: permite indexación, apunta al sitemap
├── sitemap.xml             SEO: lista de páginas para Google
├── _headers                Netlify: cache-control (evita ver versiones viejas)
├── .gitignore              Ignora fotos originales y temporales
├── assets/i18n/            Diccionarios de idiomas: es/en/de/fr/it .json
├── pages/
│   ├── experiencias.html
│   ├── whale-watching.html
│   ├── corcovado.html
│   ├── propietarios.html
│   ├── privacidad.html     Política de Privacidad (base, revisar con abogado)
│   └── terminos.html        Términos y Condiciones (base, revisar con abogado)
└── assets/
    ├── logo.webp (logo real, transparente), logo.png (original), cusinga.svg, favicon.svg
    ├── hero.svg, whale.svg, waterfall.svg, ballena.svg, corcovado.svg,
    │   villa.svg, about.svg   (placeholders SVG; se reemplazan por fotos reales)
    ├── icons/               Iconos de servicios (6 SVG blancos para los círculos verdes)
    ├── servicios/           Fotos de las 6 tarjetas de servicios (WebP)
    └── img/
        ├── ballena-kayaks-1..14.webp   Fotos reales (tour de kayak), optimizadas
        └── originales/      Fotos .jpg sin optimizar (IGNORADAS por git, backup local)
```

---

## 3. Cómo correr el sitio localmente

El sitio usa `fetch('data.json')`, que el navegador **bloquea si abres el HTML con
doble clic** (`file://`). Hay que servirlo con un servidor local:

```powershell
# Dentro de la carpeta del proyecto:
python -m http.server 8090
```

Luego abrir en el navegador:
- Sitio: <http://localhost:8090/index.html>
- Panel admin: <http://localhost:8090/admin.html>

(Alternativa con Node: `npx serve` — o la extensión "Live Server" de VS Code.)

---

## 4. Cómo editar el contenido

### Textos y datos
Editar **`data.json`**. Ahí están: datos del negocio (email, WhatsApp, redes),
textos del hero, servicios, experiencias, sección de propietarios, "sobre nosotros", etc.
`script.js` inyecta estos valores en el HTML mediante atributos `data-key`.

### Imágenes
1. Colocar la foto en `assets/img/` con nombre **en minúsculas, sin espacios ni acentos**
   (ej. `catarata-uvita.webp`, no `Catarata Uvita.JPG`).
2. Optimizarla a **WebP** (ver sección 6).
3. Apuntar la ruta en `data.json` (campo `image`).

### Panel de administración (`admin.html`)
Permite editar visualmente. ⚠️ **Importante:** hoy guarda los cambios en
**`localStorage`**, que es la memoria del navegador de quien edita. Es decir:
- Los cambios **solo se ven en ESE navegador y ESE equipo**. No es un editor "en vivo"
  para el público todavía.
- Sirve para maquetar/probar. Para que los cambios se publiquen de verdad para todos,
  hay que migrar a una base de datos (ver Roadmap, etapa 4).

---

## 5. SEO (ya implementado)

- **Dominio en producción:** `https://uvitaconciergeexperience.com` (sin www; www redirige
  con 301). Todas las URLs internas de SEO (canonical, OG, hreflang, sitemap, robots)
  apuntan al dominio **sin www** para que Google indexe una sola versión.
- `<title>`, `meta description`, `meta keywords`, `canonical` en todas las páginas.
- **Open Graph** y **Twitter Card** (imagen social = `assets/img/ballena-kayaks-6.webp`).
- **hreflang** para los 5 idiomas (`?lang=xx`) + `x-default`.
- **Schema.org**: `TravelAgency` en el home (teléfono, email, dirección, `logo`, `geo`
  con coordenadas de Uvita, `inLanguage`, `sameAs` a Facebook) y `BreadcrumbList` en las
  páginas internas.
- `sitemap.xml` (7 URLs) y `robots.txt` (bloquea `admin.html`, apunta al sitemap).
- HTML semántico, `alt` en imágenes, WebP + lazy loading, navegación por teclado, contraste.
- `_headers` (Netlify): `Cache-Control: must-revalidate` para que los cambios se vean al
  instante y no queden versiones viejas en caché.

**Pendiente SEO (tareas del negocio, fuera del código):** ver la sección 12 "Acciones de
posicionamiento". Mejora opcional de código: imagen OG dedicada en JPG 1200×630 (hoy es WebP).

---

## 5b. Idiomas (i18n)

- Los textos traducibles del home viven en **`assets/i18n/<código>.json`** (`es`, `en`,
  `de`, `fr`, `it`). Mismos campos en todos los archivos.
- En el HTML, los elementos traducibles llevan `data-i18n="ruta.a.la.clave"` (texto),
  `data-i18n-html="..."` (permite `<em>`/`<br>`) o `data-i18n-aria="..."` (aria-label).
- Las tarjetas de servicios y experiencias se traducen por `id` desde
  `services.items.<id>` y `experiences.items.<id>` en cada diccionario.
- `script.js` elige el idioma así: parámetro `?lang=xx` → `localStorage` → idioma del
  navegador → `es` por defecto. El selector con banderas está definido en el arreglo
  `LANGS` dentro de `script.js`.

**Para agregar un idioma nuevo:** (1) crear `assets/i18n/<código>.json` copiando la
estructura de `es.json` y traduciendo; (2) añadir una entrada `{ code, name, flag }` en
`LANGS` (script.js); (3) agregar su `<link rel="alternate" hreflang>` en `index.html`.

> Nota SEO: las traducciones se aplican del lado del cliente (JavaScript). Es un buen
> comienzo, pero para un posicionamiento multilingüe óptimo lo ideal a futuro es generar
> páginas pre-renderizadas por idioma (URLs separadas). Ver roadmap.

## 6. Optimización de imágenes (proceso usado)

Las fotos se sirven en **WebP** (mucho más livianas que JPG, mejor para velocidad y SEO).
Proceso usado con la librería `sharp` (Node):
- Lado más largo máximo **1600 px**, calidad **76**, respetando orientación EXIF.
- Resultado en las 14 fotos: **11.7 MB → 4.1 MB**.
- Los `.jpg` originales se guardan en `assets/img/originales/` (ignorado por git) por si
  hay que reprocesar.

Cuando lleguen fotos nuevas: renombrar (kebab-case), convertir a WebP con esos parámetros,
mover el original a `originales/`, y actualizar la ruta en `data.json`.

---

## 7. ✅ Lo que ya está hecho

- [x] Estructura completa del sitio según la especificación de marca.
- [x] Home con: header + menú móvil, hero, barra de confianza, servicios, experiencias,
      propietarios, sobre nosotros, contacto, footer, botón flotante de WhatsApp.
- [x] Páginas internas: experiencias, whale-watching, corcovado, propietarios.
- [x] Páginas legales: privacidad y términos (versión base) + enlaces en todos los footers.
- [x] Paleta e identidad de marca (verdes, dorado, terracota, crema; tipografías
      Cormorant Garamond / Montserrat / Parisienne).
- [x] Responsive (desktop, tablet, móvil).
- [x] SEO completo (ver sección 5).
- [x] WhatsApp integrado: **+506 8353 9389** → `wa.me/50683539389` en todos los botones.
- [x] Facebook integrado (enlace en contacto + `sameAs` en Schema.org).
- [x] Fotos reales del tour de kayak, optimizadas a WebP (hero + Parque Marino Ballena).
- [x] Panel `admin.html` (versión con localStorage).
- [x] **Galería** de fotos (home, sección `#galeria`) con lightbox (clic para ampliar).
- [x] **Sección de servicios** rediseñada al estilo del flyer de marca: 6 servicios
      (tours y actividades, transporte privado, servicios especiales, recomendaciones
      locales, reservas y coordinación, atención durante tu estadía) con íconos circulares
      verdes, más una **banda de eslogan** — todo en los 5 idiomas.
- [x] **Sitio multilingüe** (ES/EN/DE/FR/IT): home + páginas internas (experiencias,
      whale-watching, corcovado, propietarios) traducidas. Selector con banderas,
      detección automática del idioma del navegador, persistencia y `hreflang`. Los cuerpos
      de las páginas legales quedan en español (pendiente de revisión legal).
- [x] **Logo real** (`assets/logo.webp`, transparente) y **favicon** de palmera de marca.
- [x] **Fotos reales en las 6 tarjetas de servicios** (`assets/servicios/*.webp`).
- [x] **Iconos** en la sección de contacto (email, WhatsApp, ubicación), icono de WhatsApp
      en el botón del menú, y el logo en la banda de eslogan.
- [x] **Dominio en producción** con HTTPS: `https://uvitaconciergeexperience.com`.
- [x] **Despliegue automático** (GitHub → Netlify): cada `git push` publica solo.
- [x] `_headers` de caché para que los cambios se vean al instante.

---

## 8. 🔜 Lo que se va a hacer (roadmap por etapas)

| Etapa | Objetivo | Detalle |
|-------|----------|---------|
| **1. Publicar (frontend)** ✅ | Sitio en línea | **HECHO.** Netlify conectado a GitHub → auto-deploy en cada `git push`. Subdominio de Netlify: `monumental-entremet-5a0e64.netlify.app`. |
| **2. Dominio** ✅ | Dirección profesional | **HECHO.** `uvitaconciergeexperience.com` apuntado a Netlify (registros A `75.2.60.5` + CNAME `www`, editados en el DNS de Squarespace). El correo sigue en Google Workspace (MX intactos). Pendiente opcional: bajar el plan de Squarespace / transferir el dominio para ahorrar. |
| **3. Pulir + SEO** 🔄 | Posicionar en Google | Base técnica ya lista (ver sección 12). Faltan: fotos reales de experiencias, más contenido, y las **acciones de posicionamiento** (Search Console, Google Business Profile). |
| **4. Backend** | Funciones dinámicas | Base de datos para reservas y para que el panel admin edite **en vivo** para todos. Opciones: Supabase / Firebase / **Railway** ($5/mes cuando se justifique). |

### Decisión de arquitectura (importante para el futuro)
Se eligió el patrón **JAMstack**: el **frontend** (este sitio estático) vive en un **CDN
gratis** (Cloudflare/Netlify), y el **backend** (cuando exista) irá aparte en Railway u
otro. **No se sirve todo desde un solo servidor** porque el CDN es más rápido (reparte el
sitio por todo el mundo), gratis y no se cae si el backend falla. El frontend y el backend
**conviven**; el backend se **suma** en la etapa 4, no reemplaza al hosting del sitio.

---

## 9. ⏳ Pendientes / datos que faltan (NO inventar)

- [ ] **Instagram**: falta la URL oficial (el enlace se muestra solo cuando exista en `data.json`).
- [ ] **Fotos reales** para las tarjetas de **experiencias**: whale watching (con ballena),
      Corcovado, y "sobre nosotros". Hoy usan placeholders SVG. (Catarata y Marino Ballena
      ya tienen foto real; las 6 tarjetas de **servicios** ya tienen foto.)
- [ ] **Traducir los cuerpos de las páginas legales** (privacidad, términos): siguen en
      español a propósito, pendientes de la revisión legal final (ver más abajo). Su
      navegación y pie de página sí cambian de idioma. El resto de páginas internas
      (experiencias, whale-watching, corcovado, propietarios) ya están traducidas a los 5
      idiomas.
- [ ] **Páginas legales**: son una base. Falta revisión con asesoría legal en Costa Rica y
      completar: razón social / cédula jurídica, política de cancelación y reembolsos,
      medios de pago. (Hay comentarios `PENDIENTE` marcados dentro de esos HTML.)
---

## 10. Notas y advertencias técnicas (gotchas)

- **Codificación UTF-8 en Windows PowerShell 5.1:** NO editar archivos con acentos usando
  `Get-Content -Raw ... | Set-Content`. PowerShell 5.1 lee como ANSI y **corrompe los
  acentos** (`é` → `Ã©`). Editar con un editor UTF-8 (VS Code) o herramientas que respeten
  UTF-8. (Ya pasó una vez y se reparó.)
- **Las imágenes no se incrustan** en HTML: se cambian sustituyendo archivos.
- **`admin.html` usa localStorage**, no una base de datos compartida (ver sección 4).

---

## 11. Datos de marca

- **Negocio:** Uvita Concierge Experience
- **Ubicación:** Uvita, Bahía Ballena, Puntarenas, Costa Rica
- **Email:** info@uvitaconciergeexperience.com
- **WhatsApp:** +506 8353 9389
- **Facebook:** https://www.facebook.com/share/1Dk52Ytk7w/?mibextid=wwXIfr
- **Frase:** «Más que un viaje, una experiencia hecha para ti.»
- **Concepto:** Experiencias auténticas. Atención personalizada. Pura vida.

---

## 12. Acciones de posicionamiento (SEO / marketing)

La **base técnica de SEO ya está** (sección 5). Lo que más mueve la aguja ahora son
tareas **fuera del código** que hace el dueño del negocio, en orden de impacto:

1. **Google Search Console** (imprescindible): verificar `uvitaconciergeexperience.com`,
   **enviar el sitemap** (`/sitemap.xml`) y pedir indexación. Sin esto, Google tarda más
   en encontrar el sitio. → search.google.com/search-console
2. **Google Business Profile** (el #1 para turismo local): crear la ficha del negocio en
   Uvita. Es lo que hace aparecer en **Google Maps** y en el "paquete local" cuando alguien
   busca *"concierge Uvita"*, *"tours Uvita"*. Gratis. → business.google.com
3. **Reseñas**: pedir reseñas a clientes en Google y Facebook (peso enorme en local).
4. **Listados y backlinks**: TripAdvisor, directorios de turismo de Costa Rica, y que otros
   sitios locales enlacen al dominio.
5. **Redes activas**: publicar en Facebook (ya vinculado) y agregar el **Instagram** oficial
   cuando exista (se conecta solo al poner la URL en `data.json`).
6. **Contenido**: más texto útil y fotos reales → cuanto más contenido auténtico, mejor.

**Mejoras opcionales de código (menor impacto):**
- Imagen Open Graph dedicada en **JPG 1200×630** (hoy es WebP; funciona, pero JPG es más
  universal al compartir).
- `favicon.ico`/PNG de respaldo para navegadores antiguos (hoy es SVG, suficiente para los
  modernos).
- A futuro: páginas pre-renderizadas por idioma (URLs separadas) para SEO multilingüe óptimo.

---

_Última actualización de este documento: septiembre de 2026._

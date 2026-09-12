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
├── .gitignore              Ignora fotos originales y temporales
├── pages/
│   ├── experiencias.html
│   ├── whale-watching.html
│   ├── corcovado.html
│   ├── propietarios.html
│   ├── privacidad.html     Política de Privacidad (base, revisar con abogado)
│   └── terminos.html        Términos y Condiciones (base, revisar con abogado)
└── assets/
    ├── logo.svg, cusinga.svg, favicon.svg
    ├── hero.svg, whale.svg, waterfall.svg, ballena.svg, corcovado.svg,
    │   villa.svg, about.svg   (placeholders SVG; se reemplazan por fotos reales)
    ├── icons/               Iconos de servicios (concierge, transporte, etc.)
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

- `<title>`, `meta description`, `meta keywords`, `canonical` en todas las páginas.
- **Open Graph** y **Twitter Card** (imagen social = `assets/img/ballena-kayaks-6.webp`).
- **Schema.org**: `TravelAgency` en el home (con teléfono, email, dirección, `sameAs`
  a Facebook) y `BreadcrumbList` en las páginas internas.
- `sitemap.xml` y `robots.txt`.
- HTML semántico, `alt` en imágenes, navegación por teclado, buen contraste.

**Pendiente SEO:** favicon en más formatos, imagen OG dedicada 1200×630, Google Search
Console, Google Business Profile.

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
- [x] **Sitio multilingüe** (ES/EN/DE/FR/IT): home + páginas internas (experiencias,
      whale-watching, corcovado, propietarios) traducidas. Selector con banderas,
      detección automática del idioma del navegador, persistencia y `hreflang`. Los cuerpos
      de las páginas legales quedan en español (pendiente de revisión legal).

---

## 8. 🔜 Lo que se va a hacer (roadmap por etapas)

| Etapa | Objetivo | Detalle |
|-------|----------|---------|
| **1. Publicar (frontend)** ✅ | Sitio en línea gratis | **HECHO.** Desplegado en Netlify (arrastrando el `.zip` del sitio): <https://monumental-entremet-5a0e64.netlify.app/> — link temporal de pruebas. Para actualizar: arrastrar un nuevo `.zip` en la pestaña *Deploys*. |
| **2. Dominio** | Dirección profesional | Apuntar el dominio (hoy en **Squarespace**) al sitio. Se evalúa transferirlo a un registrador más barato y bajar el plan de Squarespace. |
| **3. Pulir + SEO** | Posicionar en Google | Fotos reales por sección, versión en **inglés** (hoy el botón ES/EN solo muestra "próximamente"), galería, más contenido, Search Console. |
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
- [ ] **Fotos reales** para: whale watching (con ballena), catarata Uvita, Corcovado,
      villa y "sobre nosotros". Hoy usan placeholders SVG. Se irán agregando poco a poco.
- [ ] **Traducir los cuerpos de las páginas legales** (privacidad, términos): siguen en
      español a propósito, pendientes de la revisión legal final (ver más abajo). Su
      navegación y pie de página sí cambian de idioma. El resto de páginas internas
      (experiencias, whale-watching, corcovado, propietarios) ya están traducidas a los 5
      idiomas.
- [ ] **Páginas legales**: son una base. Falta revisión con asesoría legal en Costa Rica y
      completar: razón social / cédula jurídica, política de cancelación y reembolsos,
      medios de pago. (Hay comentarios `PENDIENTE` marcados dentro de esos HTML.)
- [ ] **Dominio y hosting definitivos** (etapas 1–2 del roadmap).

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
- **Ubicación:** Uvita, Costa Ballena, Puntarenas, Costa Rica
- **Email:** info@uvitaconciergeexperience.com
- **WhatsApp:** +506 8353 9389
- **Facebook:** https://www.facebook.com/share/1Dk52Ytk7w/?mibextid=wwXIfr
- **Frase:** «Más que un viaje, una experiencia hecha para ti.»
- **Concepto:** Experiencias auténticas. Atención personalizada. Pura vida.

---

_Última actualización de este documento: septiembre de 2026._

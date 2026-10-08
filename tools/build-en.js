/* =========================================================
   Genera la versión en inglés PRE-RENDERIZADA del sitio (/en/...)
   a partir de las páginas en español, para que Google vea HTML
   real en inglés (título, textos, fotos, datos estructurados).

   Uso (desde la carpeta del proyecto):   node tools/build-en.js

   Ejecutarlo de nuevo después de cambiar cualquier página en español,
   assets/i18n/en.json o tools/en-extra.json. Los archivos en /en/
   se sobrescriben: NO editarlos a mano.

   Además:
   - Pone las etiquetas hreflang (es / en / x-default) en las páginas en español.
   - Agrega las URLs en inglés a sitemap.xml.
   - Avisa si falta alguna traducción (en-extra.json o en.json).
   ========================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const posix = path.posix;

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://uvitaconciergeexperience.com';
const OUT_DIR = 'en';

// Páginas con versión en inglés. Las legales (privacidad, términos, cancelación)
// quedan fuera hasta su revisión legal: las páginas en inglés enlazan a la versión en español.
const PAGES = [
  'index.html',
  'pages/experiencias.html',
  'pages/galeria.html',
  'pages/whale-watching.html',
  'pages/kayak.html',
  'pages/corcovado.html',
  'pages/tour-nocturno.html',
  'pages/spa.html',
  'pages/propietarios.html',
  'pages/blog.html',
  'pages/blog-que-hacer-uvita.html',
  'pages/blog-ballenas-uvita.html',
  'pages/blog-como-llegar-uvita.html'
];

const dict = readJson('assets/i18n/en.json');
const extra = readJson('tools/en-extra.json');
const missing = new Set();

PAGES.forEach(function (file) {
  const src = read(file);

  // 1) Español: hreflang hacia la versión en inglés
  const es = setHreflang(src, file);
  if (es !== src) { write(file, es); log('actualizado  ' + file + ' (hreflang)'); }

  // 2) Inglés
  write(posix.join(OUT_DIR, file), buildEnglish(es, file));
  log('generado     ' + posix.join(OUT_DIR, file));
});

updateSitemap();

if (missing.size) {
  console.log('\n⚠  Faltan ' + missing.size + ' traducciones (quedaron en español):');
  missing.forEach(function (m) { console.log('   - ' + m); });
  console.log('   Agrégalas en tools/en-extra.json (o en assets/i18n/en.json) y vuelve a ejecutar.');
  process.exitCode = 1;
} else {
  console.log('\n✓ Listo: ' + PAGES.length + ' páginas en inglés, sin traducciones pendientes.');
}

/* ---------------------------------------------------------
   Construcción de una página en inglés
   --------------------------------------------------------- */
function buildEnglish(html, file) {
  const masks = [];
  const mask = function (content) { masks.push(content); return '\u0000' + (masks.length - 1) + '\u0000'; };

  html = translateJsonLd(html, file);
  html = translateI18nElements(html, mask);
  html = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, function (m) { return mask(m); });

  // Cuerpo: atributos (alt, aria-label) y textos fijos sin data-i18n
  const bodyStart = html.search(/<body\b/i);
  let head = html.slice(0, bodyStart);
  let body = html.slice(bodyStart);
  body = body.replace(/<[a-zA-Z][^>]*>/g, translateTagAttributes);
  body = body.replace(/>([^<>\u0000]+)</g, function (m, text) {
    return '>' + translateText(text) + '<';
  });
  html = head + body;

  while (/\u0000\d+\u0000/.test(html)) {
    html = html.replace(/\u0000(\d+)\u0000/g, function (m, i) { return masks[+i]; });
  }

  html = translateHead(html, file);
  html = rewriteLinks(html, file);
  html = translateWhatsappLinks(html);
  return html;
}

// data-i18n (texto) y data-i18n-html (HTML) → contenido de assets/i18n/en.json
function translateI18nElements(html, mask) {
  const re = /<([a-zA-Z][\w-]*)\b[^>]*?\sdata-i18n(-html)?="([^"]+)"[^>]*>/g;
  let out = '', last = 0, m;
  while ((m = re.exec(html))) {
    const tag = m[1], isHtml = !!m[2], key = m[3];
    const openEnd = m.index + m[0].length;
    const close = findClosingTag(html, tag, openEnd);
    const value = getByPath(dict, key);
    let inner = html.slice(openEnd, close);
    if (typeof value === 'string') inner = isHtml ? value : escapeText(value);
    else missing.add('en.json → ' + key);
    out += html.slice(last, openEnd) + mask(inner);
    last = close;
    re.lastIndex = close;
  }
  return out + html.slice(last);
}

function findClosingTag(html, tag, from) {
  const re = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'gi');
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    if (m[1]) { if (--depth === 0) return m.index; }
    else if (!/\/>$/.test(m[0])) depth++;
  }
  throw new Error('No se encontró el cierre de <' + tag + '>');
}

function translateTagAttributes(tag) {
  const i18nAria = /\sdata-i18n-aria="([^"]+)"/.exec(tag);
  if (i18nAria) {
    const v = getByPath(dict, i18nAria[1]);
    if (typeof v === 'string') tag = setAttr(tag, 'aria-label', v);
    else missing.add('en.json → ' + i18nAria[1]);
  } else {
    tag = tag.replace(/(\saria-label=")([^"]*)(")/, function (m, a, v, b) { return a + escapeAttr(phrase(decode(v))) + b; });
  }
  return tag.replace(/(\salt=")([^"]+)(")/, function (m, a, v, b) { return a + escapeAttr(phrase(decode(v))) + b; });
}

function translateText(text) {
  const t = decode(text).replace(/\s+/g, ' ').trim();
  if (!t || !/\p{L}/u.test(t)) return text;
  const lead = text.match(/^\s*/)[0], trail = text.match(/\s*$/)[0];
  return lead + escapeText(phrase(t)) + trail;
}

function phrase(s) {
  if (Object.prototype.hasOwnProperty.call(extra.phrases, s)) return extra.phrases[s];
  missing.add('en-extra.json → phrases → "' + s + '"');
  return s;
}

// <head>: idioma, título, descripción, canonical, hreflang, Open Graph
function translateHead(html, file) {
  const enUrl = urlFor(file, 'en');
  const depth = file.split('/').length; // index.html → 1, pages/x.html → 2
  const rootPrefix = '../'.repeat(depth);

  html = html.replace(/<!doctype html>\s*/i, '<!doctype html>\n<!-- Generado por tools/build-en.js a partir de ' + file + '. No editar a mano: editar la página en español y volver a generar. -->\n');
  html = html.replace(/<html\b[^>]*>/i, '<html lang="en" data-static-lang="en" data-root="' + rootPrefix + '">');

  if (file === 'index.html') {
    html = html.replace(/(<title\b[^>]*>)[\s\S]*?(<\/title>)/i, function (m, a, b) { return a + escapeText(dict.meta.title) + b; });
  }
  const title = decode(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)[1].trim());

  const slug = /^pages\/blog-(.+)\.html$/.exec(file);
  const desc = extra.descriptions[file] ||
    (slug && getByPath(dict, 'blog.articles.' + slug[1] + '.metaDesc'));
  if (!desc) missing.add('en-extra.json → descriptions → "' + file + '"');

  if (desc) {
    html = setMeta(html, 'name', 'description', desc);
    html = setMeta(html, 'property', 'og:description', desc);
    html = setMeta(html, 'name', 'twitter:description', desc);
  }
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'property', 'og:url', enUrl);
  html = setMeta(html, 'property', 'og:locale', 'en_US');
  html = html.replace(/^[ \t]*<meta property="og:locale:alternate"[^>]*>\r?\n/gm, '');
  html = html.replace(/(^[ \t]*)(<meta property="og:locale"[^>]*>)/m, '$1$2\n$1<meta property="og:locale:alternate" content="es_CR">');
  // Las palabras clave (meta keywords) están en español y Google no las usa
  html = html.replace(/^[ \t]*<meta name="keywords"[^>]*>\r?\n/m, '');
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, '$1' + enUrl + '$2');
  return html;
}

// Datos estructurados (JSON-LD): textos y URLs en inglés
function translateJsonLd(html, file) {
  return html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, function (m, open, json, close) {
    const visit = function (node) {
      Object.keys(node).forEach(function (k) {
        const v = node[k];
        if (v && typeof v === 'object') visit(v);
        else if (typeof v !== 'string') return;
        else if (/^(name|description|headline)$/.test(k)) node[k] = phrase(v);
        else if (k === 'inLanguage' && v === 'es') node[k] = 'en';
        else if (v.indexOf(SITE + '/') === 0) node[k] = englishUrl(v);
      });
    };
    const data = JSON.parse(json);
    visit(data);
    const body = JSON.stringify(data, null, 2).replace(/^/gm, '  ');
    return open + '\n' + body + '\n  ' + close;
  });
}

// Enlaces relativos: a la versión en inglés si existe; si no, a la original (CSS, fotos, páginas legales)
function rewriteLinks(html, file) {
  const fromDir = posix.dirname(file);
  const toDir = posix.dirname(posix.join(OUT_DIR, file));
  return html.replace(/(\s(?:href|src)=")([^"]*)(")/g, function (m, a, value, b) {
    if (!value || /^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(value)) return m;
    const parts = /^([^?#]*)(.*)$/.exec(value);
    const target = posix.normalize(posix.join(fromDir, parts[1]));
    const dest = PAGES.indexOf(target) !== -1 ? posix.join(OUT_DIR, target) : target;
    let rel = posix.relative(toDir, dest);
    if (!rel) rel = posix.basename(dest);
    return a + rel + parts[2] + b;
  });
}

// Tarjetas de experiencias sin página propia: mensaje de WhatsApp en inglés
function translateWhatsappLinks(html) {
  return html.replace(/<article class="experience-card" id="([^"]+)">[\s\S]*?<\/article>/g, function (card, id) {
    const name = getByPath(dict, 'experiences.items.' + id + '.name');
    if (!name) return card;
    return card.replace(/(https:\/\/wa\.me\/\d+)\?text=[^"]*/, function (m, base) {
      return base + '?text=' + encodeURIComponent("Hi, I'm interested in this experience: " + name);
    });
  });
}

/* ---------------------------------------------------------
   hreflang (páginas en español e inglés) y sitemap
   --------------------------------------------------------- */
function setHreflang(html, file) {
  const block = [
    '<link rel="alternate" hreflang="es" href="' + urlFor(file, 'es') + '">',
    '<link rel="alternate" hreflang="en" href="' + urlFor(file, 'en') + '">',
    '<link rel="alternate" hreflang="x-default" href="' + urlFor(file, 'es') + '">'
  ];
  html = html.replace(/^[ \t]*<!-- Idiomas alternativos[^>]*-->\r?\n/m, '');
  html = html.replace(/^[ \t]*<link rel="alternate" hreflang="[^"]*"[^>]*>\r?\n/gm, '');
  return html.replace(/^([ \t]*)(<link rel="canonical"[^>]*>)\r?\n/m, function (m, indent, canonical) {
    return indent + canonical + '\n' + block.map(function (l) { return indent + l + '\n'; }).join('');
  });
}

function updateSitemap() {
  const file = 'sitemap.xml';
  let xml = read(file);
  // Quita las entradas en inglés anteriores y las vuelve a crear a partir de las en español
  xml = xml.replace(/[ \t]*<url>\s*<loc>[^<]*\/en\/[^<]*<\/loc>[\s\S]*?<\/url>\r?\n/g, '');
  const entries = [];
  PAGES.forEach(function (page) {
    const re = new RegExp('([ \\t]*<url>\\s*<loc>)' + escapeRegExp(urlFor(page, 'es')) + '(</loc>[\\s\\S]*?</url>\\r?\\n)');
    const m = re.exec(xml);
    if (m) entries.push(m[1] + urlFor(page, 'en') + m[2]);
    else console.log('⚠  ' + page + ' no está en sitemap.xml (no se agregó su versión en inglés)');
  });
  const updated = xml.replace(/<\/urlset>/, entries.join('') + '</urlset>');
  if (updated !== read(file)) { write(file, updated); log('actualizado  ' + file + ' (' + entries.length + ' URLs en inglés)'); }
}

/* ---------------------------------------------------------
   Utilidades
   --------------------------------------------------------- */
function urlFor(file, lang) {
  const p = file === 'index.html' ? '' : file;
  return SITE + '/' + (lang === 'en' ? OUT_DIR + '/' : '') + p;
}

function englishUrl(abs) {
  const parts = /^([^?#]*)(.*)$/.exec(abs.slice(SITE.length + 1));
  const file = parts[1] === '' ? 'index.html' : parts[1];
  return PAGES.indexOf(file) !== -1 ? urlFor(file, 'en') + parts[2] : abs;
}

function setMeta(html, attr, name, content) {
  const re = new RegExp('(<meta ' + attr + '="' + escapeRegExp(name) + '" content=")[^"]*(")');
  return html.replace(re, function (m, a, b) { return a + escapeAttr(content) + b; });
}

function setAttr(tag, name, value) {
  const re = new RegExp('(\\s' + name + '=")[^"]*(")');
  return re.test(tag)
    ? tag.replace(re, function (m, a, b) { return a + escapeAttr(value) + b; })
    : tag.replace(/(\/?>)$/, ' ' + name + '="' + escapeAttr(value) + '"$1');
}

function getByPath(obj, p) {
  return p.split('.').reduce(function (acc, part) {
    return acc && typeof acc === 'object' ? acc[part] : undefined;
  }, obj);
}

function decode(s) {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
function escapeText(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeAttr(s) { return escapeText(s).replace(/"/g, '&quot;'); }
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
function readJson(file) { return JSON.parse(read(file)); }
function write(file, content) {
  const full = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}
function log(msg) { console.log('  ' + msg); }

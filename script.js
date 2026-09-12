(function () {
  'use strict';

  /* =========================================================
     Configuración de idiomas — para agregar un idioma nuevo:
     1) crear assets/i18n/<code>.json
     2) añadir una entrada aquí con su bandera (SVG)
     ========================================================= */
  var LANGS = [
    { code: 'es', name: 'Español',  flag: '<svg viewBox="0 0 24 16" class="flag" aria-hidden="true"><rect width="24" height="16" fill="#002B7F"/><rect y="3" width="24" height="10" fill="#fff"/><rect y="5.5" width="24" height="5" fill="#CE1126"/></svg>' },
    { code: 'en', name: 'English',  flag: '<svg viewBox="0 0 24 16" class="flag" aria-hidden="true"><rect width="24" height="16" fill="#fff"/><rect x="10" width="4" height="16" fill="#CE1126"/><rect y="6" width="24" height="4" fill="#CE1126"/></svg>' },
    { code: 'de', name: 'Deutsch',  flag: '<svg viewBox="0 0 24 16" class="flag" aria-hidden="true"><rect width="24" height="16" fill="#000"/><rect y="5.33" width="24" height="5.34" fill="#D00"/><rect y="10.67" width="24" height="5.33" fill="#FFCE00"/></svg>' },
    { code: 'fr', name: 'Français', flag: '<svg viewBox="0 0 24 16" class="flag" aria-hidden="true"><rect width="24" height="16" fill="#fff"/><rect width="8" height="16" fill="#0055A4"/><rect x="16" width="8" height="16" fill="#EF4135"/></svg>' },
    { code: 'it', name: 'Italiano', flag: '<svg viewBox="0 0 24 16" class="flag" aria-hidden="true"><rect width="24" height="16" fill="#fff"/><rect width="8" height="16" fill="#009246"/><rect x="16" width="8" height="16" fill="#CE2B37"/></svg>' }
  ];
  var DEFAULT_LANG = 'es';
  var LANG_KEY = 'uceLang';

  var LANG = detectLang();
  var DATA = {};
  var DICT = {};

  /* ---------- Menu movil ---------- */
  var navToggle = document.getElementById('navToggle');
  var primaryNav = document.getElementById('primaryNav');

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = primaryNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    primaryNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        primaryNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Arranque: cargar datos + idioma ---------- */
  buildLangSwitcher();

  fetch(getRelativePath('data.json'))
    .then(function (res) { return res.ok ? res.json() : {}; })
    .catch(function () { return {}; })
    .then(function (defaults) {
      DATA = mergeDeep(defaults, readLocalOverride());
      applyData(DATA);
      setupWhatsapp(DATA);
      setupEmailLinks(DATA);
      setupSocial(DATA);
      return applyLanguage(LANG);
    });

  /* ---------- i18n: detección e idioma ---------- */
  function detectLang() {
    var codes = LANGS.map(function (l) { return l.code; });
    try {
      var qs = new URLSearchParams(window.location.search).get('lang');
      if (qs && codes.indexOf(qs) !== -1) return qs;
    } catch (e) {}
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved && codes.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    var nav = (navigator.language || '').slice(0, 2).toLowerCase();
    if (codes.indexOf(nav) !== -1) return nav;
    return DEFAULT_LANG;
  }

  function applyLanguage(code) {
    LANG = code;
    try { localStorage.setItem(LANG_KEY, code); } catch (e) {}
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('lang', code);
      history.replaceState(null, '', url);
    } catch (e) {}

    return fetch(getRelativePath('assets/i18n/' + code + '.json'))
      .then(function (res) { return res.ok ? res.json() : {}; })
      .catch(function () { return {}; })
      .then(function (dict) {
        DICT = dict;
        applyI18n(dict);
        renderServices(DATA, dict);
        renderExperiences(DATA, dict);
        updateLangSwitcher();
      });
  }

  function applyI18n(dict) {
    document.documentElement.setAttribute('lang', LANG);

    // El título/descripción traducidos solo aplican al home; las páginas internas
    // (bajo /pages/) conservan su propio <title> para no dañar su SEO.
    var isHome = !/\/pages\//.test(window.location.pathname);
    if (isHome) {
      var title = getByPath(dict, 'meta.title');
      if (title) document.title = title;
      var desc = getByPath(dict, 'meta.description');
      if (desc) {
        var m = document.querySelector('meta[name="description"]');
        if (m) m.setAttribute('content', desc);
      }
    }

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = getByPath(dict, el.getAttribute('data-i18n'));
      if (typeof v === 'string') el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = getByPath(dict, el.getAttribute('data-i18n-html'));
      if (typeof v === 'string') el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var v = getByPath(dict, el.getAttribute('data-i18n-aria'));
      if (typeof v === 'string') el.setAttribute('aria-label', v);
    });
  }

  /* ---------- Selector de idioma (banderas) ---------- */
  function buildLangSwitcher() {
    var slot = document.getElementById('langToggle');
    if (!slot) return;

    var wrap = document.createElement('div');
    wrap.className = 'lang-switch';

    var current = document.createElement('button');
    current.type = 'button';
    current.className = 'lang-current';
    current.id = 'langCurrent';
    current.setAttribute('aria-haspopup', 'true');
    current.setAttribute('aria-expanded', 'false');
    current.setAttribute('aria-label', 'Idioma / Language');

    var menu = document.createElement('ul');
    menu.className = 'lang-menu';
    menu.id = 'langMenu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;

    LANGS.forEach(function (l) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'menuitem');
      btn.setAttribute('data-lang', l.code);
      btn.innerHTML = l.flag + '<span>' + l.name + '</span>';
      btn.addEventListener('click', function () {
        applyLanguage(l.code);
        closeMenu();
      });
      li.appendChild(btn);
      menu.appendChild(li);
    });

    current.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      current.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', function () { closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

    function closeMenu() {
      menu.hidden = true;
      current.setAttribute('aria-expanded', 'false');
    }

    wrap.appendChild(current);
    wrap.appendChild(menu);
    slot.parentNode.replaceChild(wrap, slot);
    updateLangSwitcher();
  }

  function updateLangSwitcher() {
    var current = document.getElementById('langCurrent');
    if (!current) return;
    var active = LANGS.filter(function (l) { return l.code === LANG; })[0] || LANGS[0];
    current.innerHTML = active.flag + '<span>' + active.code.toUpperCase() + '</span>' +
      '<svg class="lang-caret" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
    document.querySelectorAll('#langMenu [data-lang]').forEach(function (b) {
      b.setAttribute('aria-current', b.getAttribute('data-lang') === LANG ? 'true' : 'false');
    });
  }

  /* ---------- Galería: lightbox ---------- */
  var galleryGrid = document.getElementById('galleryGrid');
  if (galleryGrid) {
    galleryGrid.addEventListener('click', function (e) {
      var img = e.target.closest('img');
      if (img) openLightbox(img.getAttribute('src'), img.getAttribute('alt') || '');
    });
  }

  function openLightbox(src, alt) {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<button class="lightbox-close" aria-label="Cerrar">&times;</button>' +
      '<img src="' + src + '" alt="' + alt.replace(/"/g, '') + '">';
    box.addEventListener('click', function () { document.body.removeChild(box); });
    document.addEventListener('keydown', function esc(ev) {
      if (ev.key === 'Escape' && box.parentNode) { document.body.removeChild(box); document.removeEventListener('keydown', esc); }
    });
    document.body.appendChild(box);
  }

  /* ---------- Datos (data.json + overrides de admin.html) ---------- */
  function readLocalOverride() {
    try {
      var raw = localStorage.getItem('uceData');
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function mergeDeep(base, override) {
    if (typeof override !== 'object' || override === null) return base;
    var result = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(override).forEach(function (key) {
      var value = override[key];
      if (value && typeof value === 'object' && !Array.isArray(value) && base && typeof base[key] === 'object') {
        result[key] = mergeDeep(base[key], value);
      } else {
        result[key] = value;
      }
    });
    return result;
  }

  function getByPath(obj, path) {
    if (!path) return undefined;
    return path.split('.').reduce(function (acc, part) {
      return acc && typeof acc === 'object' ? acc[part] : undefined;
    }, obj);
  }

  function applyData(data) {
    document.querySelectorAll('[data-key]').forEach(function (el) {
      var value = getByPath(data, el.getAttribute('data-key'));
      if (value === undefined || value === null || value === '') return;
      var attr = el.getAttribute('data-key-attr');
      if (attr) { el.setAttribute(attr, value); }
      else { el.textContent = value; }
    });
  }

  /* ---------- Enlaces de WhatsApp ---------- */
  function setupWhatsapp(data) {
    var digits = (data.whatsapp || '').replace(/[^\d]/g, '');
    var email = data.email || 'info@uvitaconciergeexperience.com';
    var href = digits ? 'https://wa.me/' + digits : 'mailto:' + email;

    document.querySelectorAll('[data-whatsapp-cta]').forEach(function (el) {
      el.setAttribute('href', href);
      if (digits) { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener'); }
      else { el.removeAttribute('target'); el.removeAttribute('rel'); }
    });

    document.querySelectorAll('[data-whatsapp-label]').forEach(function (el) {
      if (digits) el.textContent = data.whatsapp_display || data.whatsapp;
    });
  }

  /* ---------- Redes sociales (solo se muestran las que tienen URL) ---------- */
  function setupSocial(data) {
    var map = { facebook: data.facebook, instagram: data.instagram };
    Object.keys(map).forEach(function (network) {
      var url = (map[network] || '').trim();
      document.querySelectorAll('[data-social="' + network + '"]').forEach(function (el) {
        if (url) {
          el.setAttribute('href', url);
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener');
          el.hidden = false;
        } else { el.hidden = true; }
      });
    });
  }

  /* ---------- Enlaces de email ---------- */
  function setupEmailLinks(data) {
    var email = data.email;
    if (!email) return;
    document.querySelectorAll('[data-email-cta]').forEach(function (el) {
      el.setAttribute('href', 'mailto:' + email);
    });
  }

  /* ---------- Renderizado dinámico (con traducción por id) ---------- */
  function renderServices(data, dict) {
    var grid = document.getElementById('servicesGrid');
    if (!grid || !Array.isArray(data.services) || !data.services.length) return;
    var tr = getByPath(dict, 'services.items') || {};

    grid.innerHTML = '';
    data.services.filter(function (s) { return s.active !== false; }).forEach(function (service) {
      var t = tr[service.id] || {};
      var card = document.createElement('article');
      card.className = 'service-card';
      if (service.icon) {
        var badge = document.createElement('div');
        badge.className = 'service-icon';
        var img = document.createElement('img');
        img.src = getRelativePath(service.icon);
        img.alt = ''; img.width = 46; img.height = 46; img.loading = 'lazy';
        badge.appendChild(img);
        card.appendChild(badge);
      }
      var h3 = document.createElement('h3');
      h3.textContent = t.name || service.name || '';
      var p = document.createElement('p');
      p.textContent = t.desc || service.description || '';
      card.appendChild(h3); card.appendChild(p);

      if (service.image) {
        var photo = document.createElement('img');
        photo.className = 'service-photo';
        photo.src = getRelativePath(service.image);
        photo.alt = '';
        photo.loading = 'lazy';
        card.appendChild(photo);
      }
      grid.appendChild(card);
    });
  }

  function renderExperiences(data, dict) {
    var grid = document.getElementById('experiencesGrid');
    if (!grid || !Array.isArray(data.experiences) || !data.experiences.length) return;
    var tr = getByPath(dict, 'experiences.items') || {};

    grid.innerHTML = '';
    data.experiences.filter(function (e) { return e.active !== false; }).forEach(function (exp) {
      var t = tr[exp.id] || {};
      var card = document.createElement('article');
      card.className = 'experience-card';
      var link = document.createElement('a');
      link.href = getRelativePath(exp.link || ('pages/experiencias.html#' + exp.id));
      if (exp.image) {
        var img = document.createElement('img');
        img.src = getRelativePath(exp.image);
        img.alt = t.alt || exp.name || '';
        img.width = 1600; img.height = 900; img.loading = 'lazy';
        link.appendChild(img);
      }
      var body = document.createElement('div');
      body.className = 'experience-body';
      var cat = t.cat || exp.category;
      if (cat) {
        var tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = cat;
        body.appendChild(tag);
      }
      var h3 = document.createElement('h3');
      h3.textContent = t.name || exp.name || '';
      var p = document.createElement('p');
      p.textContent = t.desc || exp.description || '';
      body.appendChild(h3); body.appendChild(p);
      link.appendChild(body); card.appendChild(link);
      grid.appendChild(card);
    });
  }

  /* ---------- Utilidad de rutas (funciona en / y en /pages/) ---------- */
  function getRelativePath(target) {
    var inPages = /\/pages\//.test(window.location.pathname);
    return inPages ? '../' + target : target;
  }
})();

(function () {
  'use strict';

  /* ---------- Menu movil ---------- */
  var navToggle = document.getElementById('navToggle');
  var primaryNav = document.getElementById('primaryNav');

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = primaryNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    primaryNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        primaryNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Idioma (EN en preparacion) ---------- */
  var langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', function () {
      showToast('English version coming soon / Versión en inglés próximamente');
    });
  }

  function showToast(message) {
    var toast = document.getElementById('uceToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'uceToast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.style.position = 'fixed';
      toast.style.bottom = '90px';
      toast.style.right = '22px';
      toast.style.maxWidth = '260px';
      toast.style.background = '#02332F';
      toast.style.color = '#F7F1E4';
      toast.style.padding = '12px 16px';
      toast.style.borderRadius = '10px';
      toast.style.fontSize = '0.85rem';
      toast.style.boxShadow = '0 8px 20px rgba(0,0,0,0.25)';
      toast.style.zIndex = '160';
      toast.style.transition = 'opacity 0.25s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      toast.style.opacity = '0';
    }, 3000);
  }

  /* ---------- Datos (data.json + overrides de admin.html) ---------- */
  var DATA_URL = getRelativePath('data.json');
  var STORAGE_KEY = 'uceData';

  fetch(DATA_URL)
    .then(function (res) { return res.ok ? res.json() : {}; })
    .catch(function () { return {}; })
    .then(function (defaults) {
      var merged = mergeDeep(defaults, readLocalOverride());
      applyData(merged);
      setupWhatsapp(merged);
      setupEmailLinks(merged);
      setupSocial(merged);
      renderServices(merged);
      renderExperiences(merged);
    });

  function readLocalOverride() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
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
    return path.split('.').reduce(function (acc, part) {
      return acc && typeof acc === 'object' ? acc[part] : undefined;
    }, obj);
  }

  function applyData(data) {
    document.querySelectorAll('[data-key]').forEach(function (el) {
      var key = el.getAttribute('data-key');
      var value = getByPath(data, key);
      if (value === undefined || value === null || value === '') return;

      var attr = el.getAttribute('data-key-attr');
      if (attr) {
        el.setAttribute(attr, value);
      } else {
        el.textContent = value;
      }
    });
  }

  /* ---------- Enlaces de WhatsApp ---------- */
  function setupWhatsapp(data) {
    var digits = (data.whatsapp || '').replace(/[^\d]/g, '');
    var email = data.email || 'info@uvitaconciergeexperience.com';
    var href = digits
      ? 'https://wa.me/' + digits
      : 'mailto:' + email;
    var label = digits ? 'Escríbenos por WhatsApp' : 'Escríbenos por email';

    document.querySelectorAll('[data-whatsapp-cta]').forEach(function (el) {
      el.setAttribute('href', href);
      if (digits) {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
      } else {
        el.removeAttribute('target');
        el.removeAttribute('rel');
      }
    });

    document.querySelectorAll('[data-whatsapp-label]').forEach(function (el) {
      el.textContent = digits ? (data.whatsapp_display || data.whatsapp || label) : label;
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
        } else {
          el.hidden = true;
        }
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

  /* ---------- Renderizado dinamico (usado cuando admin.html guarda cambios) ---------- */
  function renderServices(data) {
    var grid = document.getElementById('servicesGrid');
    if (!grid || !Array.isArray(data.services) || !data.services.length) return;

    grid.innerHTML = '';
    data.services
      .filter(function (s) { return s.active !== false; })
      .forEach(function (service) {
        var card = document.createElement('article');
        card.className = 'service-card';

        if (service.icon) {
          var img = document.createElement('img');
          img.src = getRelativePath(service.icon);
          img.alt = '';
          img.width = 48; img.height = 48;
          img.loading = 'lazy';
          card.appendChild(img);
        }
        var h3 = document.createElement('h3');
        h3.textContent = service.name || '';
        var p = document.createElement('p');
        p.textContent = service.description || '';
        card.appendChild(h3);
        card.appendChild(p);
        grid.appendChild(card);
      });
  }

  function renderExperiences(data) {
    var grid = document.getElementById('experiencesGrid');
    if (!grid || !Array.isArray(data.experiences) || !data.experiences.length) return;

    grid.innerHTML = '';
    data.experiences
      .filter(function (e) { return e.active !== false; })
      .forEach(function (exp) {
        var card = document.createElement('article');
        card.className = 'experience-card';

        var link = document.createElement('a');
        link.href = getRelativePath(exp.link || ('pages/experiencias.html#' + exp.id));

        if (exp.image) {
          var img = document.createElement('img');
          img.src = getRelativePath(exp.image);
          img.alt = exp.name || '';
          img.width = 1600; img.height = 900;
          img.loading = 'lazy';
          link.appendChild(img);
        }

        var body = document.createElement('div');
        body.className = 'experience-body';

        if (exp.category) {
          var tag = document.createElement('span');
          tag.className = 'tag';
          tag.textContent = exp.category;
          body.appendChild(tag);
        }
        var h3 = document.createElement('h3');
        h3.textContent = exp.name || '';
        var p = document.createElement('p');
        p.textContent = exp.description || '';
        body.appendChild(h3);
        body.appendChild(p);
        link.appendChild(body);
        card.appendChild(link);
        grid.appendChild(card);
      });
  }

  /* ---------- Utilidad de rutas (funciona en / y en /pages/) ---------- */
  function getRelativePath(target) {
    var inPages = /\/pages\//.test(window.location.pathname);
    return inPages ? '../' + target : target;
  }
})();

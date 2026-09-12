(function () {
  'use strict';

  var STORAGE_KEY = 'uceData';
  var state = {};

  var servicesList = document.getElementById('servicesList');
  var experiencesList = document.getElementById('experiencesList');
  var villasList = document.getElementById('villasList');
  var form = document.getElementById('adminForm');
  var statusEl = document.getElementById('adminStatus');

  fetch('data.json')
    .then(function (res) { return res.ok ? res.json() : {}; })
    .catch(function () { return {}; })
    .then(function (defaults) {
      state = mergeDeep(defaults, readLocalOverride());
      state.services = state.services || [];
      state.experiences = state.experiences || [];
      state.villas = state.villas || [];
      populateForm(state);
      renderServices();
      renderExperiences();
      renderVillas();
    });

  /* ---------- helpers ---------- */
  function readLocalOverride() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
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
    return path.split('.').reduce(function (acc, part) {
      return acc && typeof acc === 'object' ? acc[part] : undefined;
    }, obj);
  }

  function setByPath(obj, path, value) {
    var parts = path.split('.');
    var target = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (typeof target[parts[i]] !== 'object' || target[parts[i]] === null) target[parts[i]] = {};
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;
  }

  function slugify(text) {
    var combiningMarks = /[̀-ͯ]/g;
    return (text || 'item')
      .toString()
      .toLowerCase()
      .normalize('NFD').replace(combiningMarks, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || ('item-' + Date.now());
  }

  function showStatus(message) {
    statusEl.textContent = message;
    statusEl.classList.add('is-visible');
    clearTimeout(statusEl._t);
    statusEl._t = setTimeout(function () { statusEl.classList.remove('is-visible'); }, 3000);
  }

  /* ---------- poblar campos simples ---------- */
  function populateForm(data) {
    form.querySelectorAll('[name]').forEach(function (el) {
      var path = el.getAttribute('name');
      var value = getByPath(data, path);
      if (path === 'about.values' && Array.isArray(value)) {
        el.value = value.join(', ');
        return;
      }
      if (value !== undefined && value !== null) el.value = value;
    });
  }

  function readSimpleFields() {
    form.querySelectorAll('[name]').forEach(function (el) {
      var path = el.getAttribute('name');
      if (path === 'about.values') {
        setByPath(state, path, el.value.split(',').map(function (v) { return v.trim(); }).filter(Boolean));
      } else {
        setByPath(state, path, el.value);
      }
    });
  }

  /* ---------- listas repetibles genericas ---------- */
  function buildField(labelText, value, onInput, type) {
    var wrap = document.createElement('div');
    wrap.className = 'field';
    var label = document.createElement('label');
    label.textContent = labelText;
    var input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (type && type !== 'textarea') input.type = type;
    input.value = value || '';
    input.addEventListener('input', function () { onInput(input.value); });
    wrap.appendChild(label);
    wrap.appendChild(input);
    return wrap;
  }

  function buildRemoveRow(onRemove) {
    var row = document.createElement('div');
    row.className = 'repeat-item-actions';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-small btn-remove';
    btn.textContent = 'Eliminar';
    btn.addEventListener('click', onRemove);
    row.appendChild(document.createElement('span'));
    row.appendChild(btn);
    return row;
  }

  /* ---------- Servicios ---------- */
  function renderServices() {
    servicesList.innerHTML = '';
    state.services.forEach(function (service, index) {
      var item = document.createElement('div');
      item.className = 'repeat-item';

      var grid = document.createElement('div');
      grid.className = 'field-grid';
      grid.appendChild(buildField('Nombre', service.name, function (v) {
        service.name = v; service.id = service.id || slugify(v);
      }));
      grid.appendChild(buildField('Ícono (ruta en assets/icons/)', service.icon, function (v) { service.icon = v; }));
      grid.appendChild(buildField('Descripción', service.description, function (v) { service.description = v; }, 'textarea'));

      var activeField = document.createElement('div');
      activeField.className = 'field checkbox-field';
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'svc-active-' + index;
      checkbox.checked = service.active !== false;
      checkbox.addEventListener('change', function () { service.active = checkbox.checked; });
      var checkboxLabel = document.createElement('label');
      checkboxLabel.setAttribute('for', checkbox.id);
      checkboxLabel.textContent = 'Mostrar en el sitio';
      activeField.appendChild(checkbox);
      activeField.appendChild(checkboxLabel);
      grid.appendChild(activeField);

      item.appendChild(grid);
      item.appendChild(buildRemoveRow(function () {
        state.services.splice(index, 1);
        renderServices();
      }));
      servicesList.appendChild(item);
    });
  }

  document.getElementById('addService').addEventListener('click', function () {
    state.services.push({ id: '', name: '', description: '', icon: 'assets/icons/concierge.svg', active: true });
    renderServices();
  });

  /* ---------- Experiencias ---------- */
  function renderExperiences() {
    experiencesList.innerHTML = '';
    state.experiences.forEach(function (exp, index) {
      var item = document.createElement('div');
      item.className = 'repeat-item';

      var grid = document.createElement('div');
      grid.className = 'field-grid';
      grid.appendChild(buildField('Nombre', exp.name, function (v) {
        exp.name = v; exp.id = exp.id || slugify(v);
      }));
      grid.appendChild(buildField('Categoría', exp.category, function (v) { exp.category = v; }));
      grid.appendChild(buildField('Imagen (ruta en assets/)', exp.image, function (v) { exp.image = v; }));
      grid.appendChild(buildField('Enlace', exp.link, function (v) { exp.link = v; }));
      grid.appendChild(buildField('Descripción', exp.description, function (v) { exp.description = v; }, 'textarea'));

      var activeField = document.createElement('div');
      activeField.className = 'field checkbox-field';
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'exp-active-' + index;
      checkbox.checked = exp.active !== false;
      checkbox.addEventListener('change', function () { exp.active = checkbox.checked; });
      var checkboxLabel = document.createElement('label');
      checkboxLabel.setAttribute('for', checkbox.id);
      checkboxLabel.textContent = 'Mostrar en el sitio';
      activeField.appendChild(checkbox);
      activeField.appendChild(checkboxLabel);
      grid.appendChild(activeField);

      item.appendChild(grid);
      item.appendChild(buildRemoveRow(function () {
        state.experiences.splice(index, 1);
        renderExperiences();
      }));
      experiencesList.appendChild(item);
    });
  }

  document.getElementById('addExperience').addEventListener('click', function () {
    state.experiences.push({ id: '', name: '', category: '', description: '', image: '', link: '', active: true });
    renderExperiences();
  });

  /* ---------- Villas ---------- */
  function renderVillas() {
    villasList.innerHTML = '';
    state.villas.forEach(function (villa, index) {
      var item = document.createElement('div');
      item.className = 'repeat-item';

      var grid = document.createElement('div');
      grid.className = 'field-grid';
      grid.appendChild(buildField('Nombre', villa.name, function (v) { villa.name = v; }));
      grid.appendChild(buildField('Ubicación', villa.location, function (v) { villa.location = v; }));
      grid.appendChild(buildField('Contacto', villa.contact, function (v) { villa.contact = v; }));
      grid.appendChild(buildField('Servicios (separados por coma)', (villa.services || []).join(', '), function (v) {
        villa.services = v.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      }));
      grid.appendChild(buildField('Fotografías (rutas separadas por coma)', (villa.photos || []).join(', '), function (v) {
        villa.photos = v.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      }));
      grid.appendChild(buildField('Descripción', villa.description, function (v) { villa.description = v; }, 'textarea'));

      item.appendChild(grid);
      item.appendChild(buildRemoveRow(function () {
        state.villas.splice(index, 1);
        renderVillas();
      }));
      villasList.appendChild(item);
    });
  }

  document.getElementById('addVilla').addEventListener('click', function () {
    state.villas.push({ name: '', description: '', photos: [], services: [], location: '', contact: '' });
    renderVillas();
  });

  /* ---------- Guardar / restablecer ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    readSimpleFields();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    showStatus('Cambios guardados. Recarga el sitio público para verlos.');
  });

  document.getElementById('btnReset').addEventListener('click', function () {
    if (!confirm('¿Restablecer todos los valores por defecto? Se perderán los cambios guardados en este navegador.')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
})();

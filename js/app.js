/**
 * TVLIBRES - Application logic (vanilla JS, no build step).
 * Reads the global CHANNELS array declared in js/channels.js.
 */
(function () {
  'use strict';

  var grid = document.getElementById('grid');
  var searchInput = document.getElementById('search');
  var player = document.getElementById('player');
  var playerFrame = document.getElementById('player-frame');
  var closePlayerBtn = document.getElementById('close-player');
  var installBtn = document.getElementById('install-btn');
  var customForm = document.getElementById('custom-form');
  var customNameInput = document.getElementById('custom-name');
  var customUrlInput = document.getElementById('custom-url');
  var customError = document.getElementById('custom-error');
  var customCards = document.getElementById('custom-cards');

  // ── Render ─────────────────────────────────────────────────────────
  function getGroups(list) {
    var order = [];
    var seen = {};
    list.forEach(function (ch) {
      if (!seen[ch.group]) {
        seen[ch.group] = true;
        order.push(ch.group);
      }
    });
    return order;
  }

  function render(filter) {
    var query = (filter || '').trim().toLowerCase();

    // "Mis Canales" lives in its own container above #grid; filter it too.
    renderCustomCards(query);

    grid.innerHTML = '';
    var list = CHANNELS.filter(function (ch) {
      return !query || ch.name.toLowerCase().indexOf(query) !== -1;
    });

    if (list.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Sin resultados';
      grid.appendChild(empty);
      return;
    }

    getGroups(list).forEach(function (groupName) {
      var section = document.createElement('section');
      section.className = 'group';

      var header = document.createElement('h2');
      header.className = 'group-title';
      header.textContent = groupName;
      section.appendChild(header);

      var cardsWrap = document.createElement('div');
      cardsWrap.className = 'cards';

      list
        .filter(function (ch) {
          return ch.group === groupName;
        })
        .forEach(function (ch) {
          cardsWrap.appendChild(buildCard(ch));
        });

      section.appendChild(cardsWrap);
      grid.appendChild(section);
    });
  }

  function buildCard(ch) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.setAttribute('aria-label', 'Ver ' + ch.name);

    var logo = document.createElement('span');
    logo.className = 'card-logo';
    logo.style.setProperty('--ch', ch.color);
    logo.textContent = ch.logoText;

    var name = document.createElement('span');
    name.className = 'card-name';
    name.textContent = ch.name;

    var kind = document.createElement('span');
    kind.className = 'card-kind';
    kind.textContent = ch.type === 'youtube' ? 'En vivo' : 'Sitio oficial';

    card.appendChild(logo);
    card.appendChild(name);
    card.appendChild(kind);

    card.addEventListener('click', function () {
      openChannel(ch);
    });

    return card;
  }

  // ── Player ─────────────────────────────────────────────────────────
  function openChannel(ch) {
    if (ch.type === 'youtube' && ch.videoId) {
      openPlayer(ch);
    } else if (ch.url) {
      window.open(ch.url, '_blank', 'noopener');
    }
  }

  function openPlayer(ch) {
    // autoplay requires muted under browser policy; controls stay on.
    var src =
      'https://www.youtube.com/embed/' +
      encodeURIComponent(ch.videoId) +
      '?autoplay=1&rel=0&modestbranding=1';

    var iframe = document.createElement('iframe');
    iframe.setAttribute('src', src);
    iframe.setAttribute('title', ch.name);
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('frameborder', '0');

    playerFrame.innerHTML = '';
    playerFrame.appendChild(iframe);

    player.classList.remove('hidden');
    document.body.classList.add('no-scroll');
    closePlayerBtn.focus();
  }

  function closePlayer() {
    // Removing the iframe pauses/stops playback and frees bandwidth.
    playerFrame.innerHTML = '';
    player.classList.add('hidden');
    document.body.classList.remove('no-scroll');
  }

  closePlayerBtn.addEventListener('click', closePlayer);
  player.addEventListener('click', function (e) {
    if (e.target === player) closePlayer();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !player.classList.contains('hidden')) {
      closePlayer();
    }
  });

  // ── Mis Canales (user-defined favorites, localStorage) ─────────────
  var STORAGE_KEY = 'tvlibres-custom-channels';
  var YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
  var errorTimer = null;

  function storageAvailable() {
    try {
      var probe = '__tvlibres_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadCustom() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      // Tolerate corrupt entries: keep only well-formed records.
      return list.filter(function (ch) {
        return (
          ch &&
          typeof ch.id === 'string' &&
          typeof ch.name === 'string' &&
          typeof ch.url === 'string'
        );
      });
    } catch (e) {
      return [];
    }
  }

  function saveCustom(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return (
      Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
    );
  }

  // Returns the 11-char video ID for embeddable YouTube VIDEO/live URLs,
  // or null for everything else (channel/handle URLs, non-YouTube sites).
  function extractYouTubeId(url) {
    var parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      return null;
    }

    var host = parsed.hostname.replace(/^www\./, '');
    var id = null;

    if (host === 'youtu.be') {
      id = parsed.pathname.split('/')[1] || null;
    } else if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com'
    ) {
      if (parsed.pathname === '/watch') {
        id = parsed.searchParams.get('v');
      } else {
        var match = parsed.pathname.match(/^\/(?:live|embed)\/([^/?#]+)/);
        if (match) id = match[1];
      }
    }

    return id && YT_ID_RE.test(id) ? id : null;
  }

  var canStore = storageAvailable();
  var customList = canStore ? loadCustom() : [];
  if (!canStore) customForm.classList.add('hidden');

  function showError(message) {
    customError.textContent = message;
    customError.classList.remove('hidden');
    clearTimeout(errorTimer);
    errorTimer = setTimeout(clearError, 4000);
  }

  function clearError() {
    clearTimeout(errorTimer);
    customError.textContent = '';
    customError.classList.add('hidden');
  }

  function renderCustomCards(query) {
    customCards.innerHTML = '';

    var matches = customList.filter(function (ch) {
      return !query || ch.name.toLowerCase().indexOf(query) !== -1;
    });

    if (matches.length === 0) {
      // Invite line only on a blank search; while searching, stay quiet.
      if (!query) {
        var empty = document.createElement('p');
        empty.className = 'empty custom-empty';
        empty.textContent = 'Agregá tus canales preferidos.';
        customCards.appendChild(empty);
      }
      return;
    }

    matches.forEach(function (ch) {
      customCards.appendChild(buildCustomCard(ch));
    });
  }

  function buildCustomCard(ch) {
    // A div (not a <button>) so the nested delete <button> stays valid HTML.
    var card = document.createElement('div');
    card.className = 'card card-custom';
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.setAttribute('aria-label', 'Ver ' + ch.name);

    var logo = document.createElement('span');
    logo.className = 'card-logo';
    // No --ch set → falls back to var(--accent), marking it as custom.
    logo.textContent = ch.name.trim().slice(0, 2).toUpperCase();

    var name = document.createElement('span');
    name.className = 'card-name';
    name.textContent = ch.name;

    var kind = document.createElement('span');
    kind.className = 'card-kind';
    kind.textContent = ch.videoId ? 'YouTube' : 'Personalizado';

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'card-delete';
    del.textContent = '✕';
    del.setAttribute('aria-label', 'Eliminar ' + ch.name);
    del.addEventListener('click', function (e) {
      e.stopPropagation();
      removeCustom(ch.id);
    });

    card.appendChild(logo);
    card.appendChild(name);
    card.appendChild(kind);
    card.appendChild(del);

    card.addEventListener('click', function () {
      if (ch.videoId) {
        openPlayer(ch);
      } else if (ch.url) {
        window.open(ch.url, '_blank', 'noopener');
      }
    });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });

    return card;
  }

  function removeCustom(id) {
    customList = customList.filter(function (ch) {
      return ch.id !== id;
    });
    saveCustom(customList);
    render(searchInput.value);
  }

  customNameInput.addEventListener('input', clearError);
  customUrlInput.addEventListener('input', clearError);

  customForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = customNameInput.value.trim();
    var url = customUrlInput.value.trim();

    if (!name || !url) {
      showError('Ingresá un nombre y una URL.');
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    var duplicate = customList.some(function (ch) {
      return ch.name.toLowerCase() === name.toLowerCase();
    });
    if (duplicate) {
      showError('Ya existe un canal con ese nombre.');
      return;
    }

    customList.push({
      id: newId(),
      name: name,
      url: url,
      videoId: extractYouTubeId(url),
    });

    if (!saveCustom(customList)) {
      customList.pop();
      showError('No se pudo guardar en este dispositivo.');
      return;
    }

    customNameInput.value = '';
    customUrlInput.value = '';
    clearError();
    render(searchInput.value);
  });

  // ── Search ─────────────────────────────────────────────────────────
  searchInput.addEventListener('input', function () {
    render(searchInput.value);
  });

  // ── Install prompt ─────────────────────────────────────────────────
  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    // Prevent the mini-infobar from appearing automatically.
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
  });

  installBtn.addEventListener('click', function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () {
      deferredPrompt = null;
      installBtn.classList.add('hidden');
    });
  });

  window.addEventListener('appinstalled', function () {
    installBtn.classList.add('hidden');
    deferredPrompt = null;
  });

  // ── Service worker (only over http/https, not file://) ─────────────
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {
        /* SW registration failed; app still works. */
      });
    });
  }

  // ── Init ───────────────────────────────────────────────────────────
  render('');
})();

// ── Theme toggle (class-based theming: html.dark) ───────────────────
(function () {
  'use strict';

  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var moon = document.getElementById('icon-moon');
  var sun = document.getElementById('icon-sun');
  var saved = localStorage.getItem('theme');
  var dark = saved
    ? saved === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;

  function updateIcon() {
    // Dark active → show sun (switch to light); light active → show moon.
    moon.classList.toggle('hidden', dark);
    sun.classList.toggle('hidden', !dark);
  }

  function apply() {
    root.classList.toggle('dark', dark);
    updateIcon();
  }

  apply();

  btn.addEventListener('click', function () {
    dark = !dark;
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    apply();
  });
})();

// ── Hero logo (LogoScroll: scroll scale/blur + mouse-driven opacity) ─
(function () {
  'use strict';

  var CUBES = [
    { cx: 9.5, cy: 9.5 },
    { cx: 22.5, cy: 9.5 },
    { cx: 9.5, cy: 22.5 },
    { cx: 22.5, cy: 22.5 },
  ];
  var MAX_DIST = 22;
  var BASE_OPACITIES = [1, 0.7, 0.5, 0.3];

  var heroLogoWrap = document.getElementById('hero-logo-wrap');
  var heroLogo = document.getElementById('hero-logo');
  var svg = document.getElementById('hero-logo-svg');
  var watermark = document.getElementById('watermark');
  var cubeEls = CUBES.map(function (_, i) {
    return document.getElementById('cube' + i);
  });

  function getOpacities(mx, my) {
    if (mx == null || my == null) return BASE_OPACITIES.slice();
    return CUBES.map(function (cube) {
      var d = Math.hypot(mx - cube.cx, my - cube.cy);
      var factor = Math.max(0, 1 - d / MAX_DIST);
      return 0.15 + factor * 0.85;
    });
  }

  function applyOpacities(opacities) {
    cubeEls.forEach(function (el, i) {
      el.style.transition = 'opacity .25s ease-out';
      el.style.opacity = opacities[i];
    });
  }

  function onScroll() {
    var rect = heroLogoWrap.getBoundingClientRect();
    var progress = Math.min(
      1,
      Math.max(0, -rect.top / (heroLogoWrap.offsetHeight * 1.2))
    );
    heroLogo.style.transform = 'scale(' + (1 - progress * 0.6) + ')';
    heroLogo.style.opacity = 1 - progress * 0.85;
    heroLogo.style.filter = 'blur(' + progress * 12 + 'px)';
    // Very subtle watermark: fades in gently after the logo starts leaving.
    watermark.style.opacity =
      progress > 0.15 ? Math.min(0.06, (progress - 0.15) * 0.12) : 0;
  }

  svg.addEventListener('mousemove', function (e) {
    var rect = svg.getBoundingClientRect();
    var x = ((e.clientX - rect.left) / rect.width) * 32;
    var y = ((e.clientY - rect.top) / rect.height) * 32;
    applyOpacities(getOpacities(x, y));
  });

  svg.addEventListener('mouseleave', function () {
    applyOpacities(BASE_OPACITIES);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  applyOpacities(BASE_OPACITIES);
})();

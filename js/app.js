/**
 * TDA Live - Application logic (vanilla JS, no build step).
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
    grid.innerHTML = '';
    var query = (filter || '').trim().toLowerCase();
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

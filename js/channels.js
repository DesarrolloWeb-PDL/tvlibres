/**
 * TDA Live - Channel catalog
 * All sources are official/legal free-to-air + TDT + Brazilian channels.
 *
 * IMPORTANT: YouTube videoIds for 24/7 live streams can change when the
 * stream restarts. If a channel stops playing, update the videoId or switch
 * that channel to type 'external' (which opens the official live page).
 *
 * NOTE: This file is loaded as a PLAIN SCRIPT (not an ES module) so the app
 * works over file:// and any static host without a build step.
 * Therefore CHANNELS is declared as a global const (no `export` keyword).
 */

const CHANNELS = [
  // ── Aire ────────────────────────────────────────────────────────────
  {
    id: 'telefe',
    name: 'Telefe',
    group: 'Aire',
    color: '#00A0E9',
    type: 'external',
    url: 'https://www.mitelefe.com/telefe-en-vivo',
    logoText: 'Telefe',
  },
  {
    id: 'eltrece',
    name: 'El Trece',
    group: 'Aire',
    color: '#003DA5',
    type: 'external',
    url: 'https://www.eltrecetv.com.ar/vivo/',
    logoText: '13',
  },
  {
    id: 'america',
    name: 'América TV',
    group: 'Aire',
    color: '#E4002B',
    type: 'external',
    url: 'https://www.americatv.com.ar/vivo',
    logoText: 'América',
  },
  {
    id: 'elnueve',
    name: 'El Nueve',
    group: 'Aire',
    color: '#F7941D',
    type: 'external',
    url: 'https://www.elnueve.com.ar/envivo',
    logoText: '9',
  },

  // ── Noticias ────────────────────────────────────────────────────────
  // Embedded 24/7 YouTube live streams. NOTE: these videoIds change when a
  // stream restarts. If a channel stops playing, re-resolve the live ID.
  {
    id: 'cronica',
    name: 'Crónica TV',
    group: 'Noticias',
    color: '#D0021B',
    type: 'youtube',
    videoId: 'hw4uHyct4vg',
    logoText: 'Crónica',
  },
  {
    id: 'c5n',
    name: 'C5N',
    group: 'Noticias',
    color: '#0057A0',
    type: 'youtube',
    videoId: 'j6oh4Kqz3UM',
    logoText: 'C5N',
  },
  {
    id: 'canal26',
    name: 'Canal 26',
    group: 'Noticias',
    color: '#00A4A6',
    type: 'youtube',
    videoId: 'RGtc10K9Kmw',
    logoText: '26',
  },
  {
    id: 'lnplus',
    name: 'LN+',
    group: 'Noticias',
    color: '#1A1A1A',
    type: 'youtube',
    videoId: 'FEWZjXJ7M0c',
    logoText: 'LN+',
  },
  {
    id: 'a24',
    name: 'A24',
    group: 'Noticias',
    color: '#0033A0',
    type: 'youtube',
    videoId: 'MMBRR30Wq1M',
    logoText: 'A24',
  },

  // ── TDT Público ─────────────────────────────────────────────────────
  {
    id: 'tvpublica',
    name: 'TV Pública',
    group: 'TDT Público',
    color: '#0067B1',
    type: 'youtube',
    videoId: 'iyG7hGUYGRs',
    logoText: 'TVP',
  },
  {
    id: 'deportv',
    name: 'DeporTV',
    group: 'TDT Público',
    color: '#FDB913',
    type: 'external',
    url: 'https://www.youtube.com/channel/UCSmh3DFxBwFurMttT60PQ1g',
    logoText: 'Depor',
  },
  {
    id: 'encuentro',
    name: 'Encuentro',
    group: 'TDT Público',
    color: '#8DC63F',
    type: 'external',
    url: 'https://www.youtube.com/user/encuentro',
    logoText: 'Enc',
  },
  {
    id: 'pakapaka',
    name: 'Pakapaka',
    group: 'TDT Público',
    color: '#F7941E',
    type: 'external',
    url: 'https://www.youtube.com/channel/UCVVNYxncuD4EfHpKDlPIYcQ',
    logoText: 'Paka',
  },
  {
    id: 'cinear',
    name: 'Cine.Ar',
    group: 'TDT Público',
    color: '#6D2077',
    type: 'external',
    url: 'https://www.cine.ar/',
    logoText: 'Cine',
  },

  // ── Brasil ──────────────────────────────────────────────────────────
  // Globoplay uses DRM, so these cannot be embedded — open officially.
  {
    id: 'globo',
    name: 'Rede Globo',
    group: 'Brasil',
    color: '#009B3A',
    type: 'external',
    url: 'https://globoplay.globo.com/tv-globo/ao-vivo/6120663/',
    logoText: 'Globo',
  },
  {
    id: 'rbstv',
    name: 'RBS TV',
    group: 'Brasil',
    color: '#0067B1',
    type: 'external',
    url: 'https://globoplay.globo.com/categorias/rbstv/',
    logoText: 'RBS',
  },
];

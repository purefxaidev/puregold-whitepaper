/* PureGold landing service worker — versioned shell, network-first data. */
const VERSION = '20261110mobi1';
const SHELL = 'puregold-shell-' + VERSION;
const DATA = 'puregold-data-' + VERSION;
const SHELL_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/apple-touch-icon.png',
  '/assets/logo-mark.svg',
  '/assets/logo-lockup.svg',
  '/assets/logo-192.png',
  '/assets/logo-64.png',
  '/assets/sharecard.js',
  '/assets/features.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await Promise.all(SHELL_URLS.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res && res.ok) await cache.put(url, res);
      } catch (_) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key !== SHELL && key !== DATA)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

function isDataRequest(url) {
  if (url.pathname.endsWith('.json')) return true;
  if (url.pathname.startsWith('/data/')) return true;
  // Price and market JSON must not be served stale from the shell cache.
  if (/\/(xau-klines|quotes|live|levels|spot|perf)\.json$/.test(url.pathname)) return true;
  return false;
}

function isBypass(url) {
  if (url.pathname.startsWith('/downloads/')) return true;
  if (/\.(apk|mp4|webm)$/i.test(url.pathname)) return true;
  return false;
}

function isShellAsset(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname === '/manifest.webmanifest' || url.pathname.startsWith('/icons/')) return true;
  return /\.(js|css|png|svg|jpg|jpeg|webp|woff2|webmanifest)$/i.test(url.pathname);
}

async function networkFirstData(request) {
  const cache = await caches.open(DATA);
  try {
    const fresh = await fetch(request, { cache: 'no-store' });
    if (fresh && fresh.ok) {
      try { await cache.put(request, fresh.clone()); } catch (_) {}
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(request) || await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}

async function networkFirstNav(request) {
  const cache = await caches.open(SHELL);
  try {
    const fresh = await fetch(request, { cache: 'no-store' });
    if (fresh && fresh.ok) {
      try { await cache.put('/index.html', fresh.clone()); } catch (_) {}
      return fresh;
    }
  } catch (_) {}
  return (await cache.match('/index.html'))
    || (await cache.match('/'))
    || (await cache.match('/offline.html'))
    || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL);
  const cached = await cache.match(request) || await cache.match(request, { ignoreSearch: true });
  const network = fetch(request).then((res) => {
    if (res && res.ok) {
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  }).catch(() => undefined);
  if (cached) {
    network.catch(() => {});
    return cached;
  }
  const fresh = await network;
  if (fresh) return fresh;
  throw new Error('offline');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  let url;
  try { url = new URL(request.url); } catch (_) { return; }
  if (isBypass(url)) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstNav(request));
    return;
  }
  if (isDataRequest(url)) {
    event.respondWith(networkFirstData(request));
    return;
  }
  if (isShellAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

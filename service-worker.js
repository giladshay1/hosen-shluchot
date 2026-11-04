/* Service worker – offline-first plumbing for "חוסן שלוחות".
 * - App shell, content JSON (checklists, templates, flyer catalog…), logos, icons and the core flyer images are
 *   PRE-CACHED at install, so the emergency module works with zero connectivity.
 * - API calls (Apps Script, cross-origin POST) are NOT handled here: they always go to the network, and POSTs are
 *   never cached. api.js keeps its own IndexedDB outbox (iOS Safari has no Background Sync).
 * Bump VERSION on every deploy so phones pick up the new files ("גרסה חדשה זמינה – לחץ לעדכון").
 */
const VERSION = 'v1.2.0';
const SHELL_CACHE = 'shell-' + VERSION;
const CONTENT_CACHE = 'content-' + VERSION;
const FLYER_CACHE = 'flyers-rt';            // runtime cache for any other flyer opened later; survives versions

const SHELL = [
  './', './index.html', './app.js', './api.js', './styles.css', './manifest.webmanifest',
  './assets/maashavim.png', './assets/shield.png', './assets/shield-text.png', './assets/shield-full.png',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'
];
const CONTENT = [
  './data/events.json', './data/templates.json', './data/flyers.json', './data/roles.json', './data/services.json',
  './data/facil.json', './data/ar_drafts.json', './data/claude.json',
  // core flyers (public distribution only; ≤ 3 MB total)
  './flyers/post_elderly_1.jpg', './flyers/post_elderly_2.jpg', './flyers/post_elderly_3.jpg', './flyers/post_elderly_4.jpg',
  './flyers/post_parenting_1.jpg', './flyers/post_parenting_2.jpg', './flyers/post_parenting_3.jpg', './flyers/post_parenting_4.jpg',
  './flyers/post_parenting_5.jpg', './flyers/post_neighbors.jpg', './flyers/post_anxiety_ritual.jpg', './flyers/post_anxiety_news.jpg',
  './flyers/post_anxiety_wave.jpg', './flyers/post_anxiety_grounding.jpg', './flyers/post_anxiety_action.jpg',
  './flyers/kids_talk_he.jpg', './flyers/kids_talk_ar_jpeg.jpg'
];

// cache:'reload' bypasses the HTTP cache (GitHub Pages sends max-age=600), so a new VERSION really gets new files.
const fresh = (u) => new Request(u, { cache: 'reload' });

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await shell.addAll(SHELL.map(fresh));
    const content = await caches.open(CONTENT_CACHE);
    // One by one, so a single missing file does not fail the whole install.
    await Promise.all(CONTENT.map((u) => fetch(fresh(u)).then((r) => (r.ok ? content.put(u, r) : null)).catch(() => null)));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [SHELL_CACHE, CONTENT_CACHE, FLYER_CACHE];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

// The page asks a waiting worker to take over ("גרסה חדשה – לחץ לעדכון").
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                        // API POSTs: network only, never cached
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;         // API GETs (ping), Google Fonts: network only

  // Navigations: network-first (fresh app), fall back to the cached shell offline.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(async () => (await caches.match('./index.html')) || (await caches.match('./')) || Response.error()));
    return;
  }
  // Content JSON: stale-while-revalidate (instant offline, refreshed in the background).
  if (url.pathname.includes('/data/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CONTENT_CACHE);
      const cached = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached || Response.error());
      return cached || net;
    })());
    return;
  }
  // Shell, logos, flyers: cache-first, then network (and remember flyers).
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res.ok && url.pathname.includes('/flyers/')) (await caches.open(FLYER_CACHE)).put(req, res.clone());
      return res;
    } catch (e) {
      return Response.error();
    }
  })());
});

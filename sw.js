const CACHE_NAME = 'du-timetable-builder-v4';
const CORE_ASSETS = [
  './', './index.html', './styles.css', './palette-loader.js', './contact-config.js',
  './app.js', './manifest.webmanifest', './assets/logo.svg',
  './assets/icons/email.svg', './assets/icons/instagram.svg', './assets/icons/reddit.svg',
  './palettes/manifest.json',
  './palettes/cute-muted.json', './palettes/retro-pop.json', './palettes/vintage-paper.json',
  './palettes/soft-academia.json', './palettes/pastel-dream.json', './palettes/dark-academia.json',
  './palettes/y2k.json', './palettes/minimal-neutral.json', './palettes/botanical.json',
  './palettes/ocean-calm.json', './palettes/citrus-club.json', './palettes/mono-red.json'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('du-timetable-builder-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (response && response.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => {
      if (event.request.mode === 'navigate') return caches.match('./index.html');
      throw new Error('This resource is not available offline.');
    });
  }));
});

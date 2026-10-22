/* ===== SERVICE WORKER: PERSOONLIJK DASHBOARD =====
 * Zorgt voor:
 * - offline openen van de app (de app-schil wordt bewaard);
 * - pushmeldingen tonen en de app openen bij een klik.
 * Gegevens uit de database worden nooit bewaard: die gaan altijd
 * rechtstreeks naar Supabase.
 */

const CACHE = 'dashboard-v1.2';

const SHELL = [
    './',
    './index.html',
    './manifest.json',
    './favicon.png'
];


/* ===== INSTALLEREN ===== */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) => cache.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});


/* ===== OUDE VERSIES OPRUIMEN ===== */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => key !== CACHE)
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});


/* ===== OPHALEN ===== */
// Alleen eigen bestanden van de site: eerst het netwerk (zodat je
// altijd de nieuwste versie krijgt), bij geen verbinding de kopie.
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const copy = response.clone();

                    caches.open(CACHE).then((cache) => cache.put(request, copy));
                }

                return response;
            })
            .catch(() =>
                caches
                    .match(request)
                    .then((hit) => hit || caches.match('./index.html'))
            )
    );
});


/* ===== PUSHMELDING ONTVANGEN ===== */
self.addEventListener('push', (event) => {
    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch (err) {
        data = { body: event.data ? event.data.text() : '' };
    }

    const title = String(data.title || 'Persoonlijk Dashboard').slice(0, 120);

    const options = {
        body: String(data.body || '').slice(0, 300),
        icon: './favicon.png',
        badge: './favicon.png',
        tag: data.tag || undefined,
        data: {
            page: typeof data.page === 'string' ? data.page.replace(/[^a-z]/g, '') : ''
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});


/* ===== KLIK OP EEN MELDING ===== */
// Opent de app (of zet een open venster vooraan) op de juiste pagina.
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const page = event.notification.data && event.notification.data.page;
    const target = new URL('./' + (page ? '#' + page : ''), self.registration.scope).href;

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((windows) => {
                for (const client of windows) {
                    if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
                        client.navigate(target);
                        return client.focus();
                    }
                }

                return self.clients.openWindow(target);
            })
    );
});

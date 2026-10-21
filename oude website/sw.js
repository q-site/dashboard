/* =========================================================
   SERVICE WORKER — PERSOONLIJK DASHBOARD
   Plaats dit bestand naast index.html (dus in de root van je
   GitHub Pages repo). De scope van de service worker is de map
   waarin dit bestand staat.
========================================================= */

/* Zelfde publieke VAPID-sleutel als in index.html.
   Alleen nodig om opnieuw te kunnen abonneren als de browser
   het abonnement vernieuwt. */
const VAPID_PUBLIC_KEY = "BBGet23Ehe5AXcRl-ILtY3oytuLiZJwr_xD6TxIwaGUSL2iJ2wsveMKA26UsSE9POJ5EwaaY0WrhwE8E-yU6PI8";


self.addEventListener("install", () => {
    self.skipWaiting();
});


self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());
});


/* ---------------------------------------------------------
   PUSHBERICHT ONTVANGEN
--------------------------------------------------------- */

self.addEventListener("push", event => {

    const fallback = {
        title:"Persoonlijk dashboard",
        body:"Je hebt een nieuwe herinnering.",
        url:"./",
        tag:"dashboard"
    };

    let payload = fallback;

    if (event.data) {

        try {

            payload = {
                ...fallback,
                ...event.data.json()
            };

        } catch (error) {

            payload = {
                ...fallback,
                body:event.data.text()
            };

        }

    }

    event.waitUntil(
        self.registration.showNotification(
            payload.title,
            {
                body:payload.body,
                icon:"./favicon.png",
                badge:"./favicon.png",
                tag:payload.tag,
                data:{
                    url:payload.url
                }
            }
        )
    );

});


/* ---------------------------------------------------------
   KLIK OP DE MELDING
--------------------------------------------------------- */

self.addEventListener("notificationclick", event => {

    event.notification.close();

    const target =
        new URL(
            (event.notification.data && event.notification.data.url) || "./",
            self.registration.scope
        ).href;

    event.waitUntil(
        self.clients
            .matchAll({
                type:"window",
                includeUncontrolled:true
            })
            .then(clientList => {

                for (const client of clientList) {

                    if (
                        client.url.startsWith(self.registration.scope) &&
                        "focus" in client
                    ) {
                        return client.focus();
                    }

                }

                return self.clients.openWindow(target);

            })
    );

});


/* ---------------------------------------------------------
   ABONNEMENT VERNIEUWD DOOR DE BROWSER

   De service worker kan hier niet bij je Supabase-sessie, dus
   we maken alleen een nieuw abonnement aan. De pagina stuurt
   dat abonnement bij het eerstvolgende bezoek naar de database
   (syncPushSubscription in index.html).
--------------------------------------------------------- */

self.addEventListener("pushsubscriptionchange", event => {

    event.waitUntil(
        self.registration.pushManager.subscribe({
            userVisibleOnly:true,
            applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        }).catch(error => {
            console.error("Opnieuw abonneren mislukt:", error);
        })
    );

});


function urlBase64ToUint8Array(base64String) {

    const padding =
        "=".repeat((4 - (base64String.length % 4)) % 4);

    const base64 =
        (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    const raw =
        atob(base64);

    const output =
        new Uint8Array(raw.length);

    for (let i = 0; i < raw.length; i++) {
        output[i] = raw.charCodeAt(i);
    }

    return output;
}

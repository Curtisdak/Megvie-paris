const DEFAULT_VERSE_URL = "/verset-du-jour"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let payload = {}

  if (event.data) {
    try {
      payload = event.data.json()
    } catch {
      payload = { body: event.data.text() }
    }
  }

  const reference = payload.reference ? ` \u2014 ${payload.reference}` : ""
  const body =
    payload.body ||
    (payload.text ? `${payload.text}${reference}` : null) ||
    "Un verset biblique pour commencer la journee avec foi."
  const url = payload.url || DEFAULT_VERSE_URL

  event.waitUntil(
    self.registration.showNotification(
      payload.title || "Verset du jour \u2014 MegVie Paris",
      {
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        tag: "megvie-daily-verse",
        data: { url },
      },
    ),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl = new URL(
    event.notification.data?.url || DEFAULT_VERSE_URL,
    self.location.origin,
  ).href

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clientList) => {
        const targetPath = new URL(targetUrl).pathname

        for (const client of clientList) {
          const clientUrl = new URL(client.url)

          if (
            clientUrl.origin === self.location.origin &&
            clientUrl.pathname === targetPath
          ) {
            return client.focus()
          }
        }

        return self.clients.openWindow(targetUrl)
      },
    ),
  )
})

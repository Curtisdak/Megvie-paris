const DEFAULT_VERSE_URL = "/verset-du-jour"
const DEFAULT_ICON = "/icons/icon-192x192.png"
const DEFAULT_BADGE = "/icons/badge-72x72.png"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

function safeNotificationUrl(value, notificationId) {
  const raw = typeof value === "string" ? value.trim() : ""
  const fallbackUrl = new URL(DEFAULT_VERSE_URL, self.location.origin)

  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return fallbackUrl.href
  }

  try {
    const url = new URL(raw, self.location.origin)

    if (url.origin !== self.location.origin) {
      return fallbackUrl.href
    }

    if (notificationId && !url.searchParams.has("notification")) {
      url.searchParams.set("notification", notificationId)
    }

    return url.href
  } catch {
    return fallbackUrl.href
  }
}

function readPushPayload(event) {
  if (!event.data) return {}

  try {
    return event.data.json()
  } catch {
    return { body: event.data.text() }
  }
}

function buildNotificationOptions(payload) {
  const reference = payload.reference ? ` - ${payload.reference}` : ""
  const body =
    payload.body ||
    (payload.text ? `${payload.text}${reference}` : null) ||
    "Un verset biblique pour commencer la journee avec foi."
  const notificationId =
    typeof payload.notificationId === "string" ? payload.notificationId : null
  const url = safeNotificationUrl(payload.url || DEFAULT_VERSE_URL, notificationId)

  return {
    title: payload.title || "Verset du jour - MegVie Paris",
    options: {
      body,
      icon: payload.icon || DEFAULT_ICON,
      badge: payload.badge || DEFAULT_BADGE,
      image: typeof payload.image === "string" ? payload.image : undefined,
      tag: payload.tag || "megvie-daily-verse",
      data: {
        url,
        notificationId,
        type: payload.type || "DAILY_VERSE",
      },
    },
  }
}

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event)
  const notification = buildNotificationOptions(payload)

  event.waitUntil(
    self.registration.showNotification(
      notification.title,
      notification.options,
    ),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl = safeNotificationUrl(
    event.notification.data && event.notification.data.url,
    event.notification.data && event.notification.data.notificationId,
  )

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      async (clientList) => {
        for (const client of clientList) {
          const clientUrl = new URL(client.url)

          if (clientUrl.origin === self.location.origin) {
            if ("navigate" in client && client.url !== targetUrl) {
              const navigatedClient = await client.navigate(targetUrl)
              return (navigatedClient || client).focus()
            }

            return client.focus()
          }
        }

        return self.clients.openWindow(targetUrl)
      },
    ),
  )
})

import "server-only"

export type ParsedPushSubscription = {
  endpoint: string
  p256dh: string
  auth: string
}

type PushSubscriptionLike = {
  endpoint?: unknown
  keys?: {
    p256dh?: unknown
    auth?: unknown
  }
}

export function parsePushSubscription(
  value: unknown,
): ParsedPushSubscription | { error: string } {
  const subscription = value as PushSubscriptionLike
  const endpoint = subscription?.endpoint
  const p256dh = subscription?.keys?.p256dh
  const auth = subscription?.keys?.auth

  if (
    typeof endpoint !== "string" ||
    typeof p256dh !== "string" ||
    typeof auth !== "string" ||
    endpoint.length < 20 ||
    p256dh.length < 10 ||
    auth.length < 10
  ) {
    return {
      error:
        "Abonnement push invalide. endpoint, keys.p256dh et keys.auth sont requis.",
    }
  }

  return { endpoint, p256dh, auth }
}

export function normalizeLocale(value: unknown) {
  return typeof value === "string" && value.length <= 24 ? value : "fr-FR"
}

export function normalizeTimezone(value: unknown) {
  return typeof value === "string" && value.length <= 64
    ? value
    : "Europe/Paris"
}

import "server-only"

import webPush, { type PushSubscription } from "web-push"

export type StoredPushSubscription = {
  endpoint: string
  p256dh: string
  auth: string
}

type WebPushConfig =
  | { push: typeof webPush; error?: never }
  | { push?: never; error: string }

export function getWebPushConfig(): WebPushConfig {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
  const subject =
    process.env.WEB_PUSH_CONTACT_EMAIL?.trim() ||
    "mailto:contact@megvie-paris.fr"

  if (!publicKey || !privateKey) {
    return {
      error:
        "Web Push est mal configure. Ajoutez NEXT_PUBLIC_VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY.",
    }
  }

  webPush.setVapidDetails(subject, publicKey, privateKey)

  return { push: webPush }
}

export function toWebPushSubscription(
  subscription: StoredPushSubscription,
): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  }
}

export function isExpiredPushSubscriptionError(error: unknown) {
  if (typeof error !== "object" || error === null) return false

  const statusCode = Number(
    (error as { statusCode?: unknown; status?: unknown }).statusCode ??
      (error as { statusCode?: unknown; status?: unknown }).status,
  )

  return statusCode === 404 || statusCode === 410
}

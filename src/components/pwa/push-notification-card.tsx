"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type PushSupportState =
  | "checking"
  | "ready"
  | "unsupported"
  | "missing-key"
  | "ios-install-required"
  | "denied"

function isIosDevice() {
  if (typeof navigator === "undefined") return false

  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

async function getActiveSubscription() {
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export function PushNotificationCard() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const [supportState, setSupportState] =
    useState<PushSupportState>("checking")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    const evaluateSupport = async () => {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setSupportState("unsupported")
        return
      }

      if (!vapidPublicKey) {
        setSupportState("missing-key")
        return
      }

      if (Notification.permission === "denied") {
        setSupportState("denied")
        return
      }

      if (isIosDevice() && !isStandaloneDisplay()) {
        setSupportState("ios-install-required")
        return
      }

      const subscription = await getActiveSubscription().catch(() => null)
      setIsSubscribed(Boolean(subscription))
      setSupportState("ready")
    }

    void evaluateSupport()
  }, [vapidPublicKey])

  const statusMessage = useMemo(() => {
    if (isSubscribed) {
      return "Notifications activees. Vous recevrez le verset du jour de MegVie Paris."
    }

    switch (supportState) {
      case "checking":
        return "Verification des notifications..."
      case "unsupported":
        return "Ce navigateur ne prend pas en charge les notifications web."
      case "missing-key":
        return "Les notifications seront disponibles apres configuration de la cle VAPID publique."
      case "ios-install-required":
        return "Sur iPhone, ajoutez d'abord l'application a l'ecran d'accueil, ouvrez-la, puis activez les notifications."
      case "denied":
        return "Les notifications sont bloquees dans ce navigateur. Vous pouvez les reactiver dans les reglages du site."
      default:
        return "Chaque matin, recevez un verset biblique pour commencer la journee avec foi."
    }
  }, [isSubscribed, supportState])

  const handleSubscribe = async () => {
    if (!vapidPublicKey || supportState !== "ready") return

    setIsBusy(true)

    try {
      const permission = await Notification.requestPermission()

      if (permission !== "granted") {
        setSupportState(permission === "denied" ? "denied" : "ready")
        toast.info("Notifications non activees", {
          description:
            "Vous pouvez activer les notifications plus tard depuis cette page.",
        })
        return
      }

      const registration = await navigator.serviceWorker.ready
      const existingSubscription =
        await registration.pushManager.getSubscription()
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            vapidPublicKey,
          ) as BufferSource,
        }))

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          locale: navigator.language,
          timezone:
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
            "Europe/Paris",
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(data?.error ?? "Inscription impossible.")
      }

      setIsSubscribed(true)
      toast.success("Notifications activees", {
        description: "Vous recevrez le verset du jour de MegVie Paris.",
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible d'activer les notifications."

      toast.error("Notifications indisponibles", {
        description: message,
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleUnsubscribe = async () => {
    setIsBusy(true)

    try {
      const subscription = await getActiveSubscription()
      const endpoint = subscription?.endpoint

      if (subscription) {
        await subscription.unsubscribe()
      }

      if (endpoint) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        })
      }

      setIsSubscribed(false)
      toast.info("Notifications desactivees", {
        description:
          "Vous pouvez reactiver le verset du jour a tout moment.",
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de desactiver les notifications."

      toast.error("Action impossible", {
        description: message,
      })
    } finally {
      setIsBusy(false)
    }
  }

  const canSubscribe = supportState === "ready" && !isSubscribed && !isBusy
  const canUnsubscribe = isSubscribed && !isBusy

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-6">
      <div>
        <span className="inline-flex rounded-full bg-amber-100 p-3 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
          <Bell className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
          Verset du jour
        </p>
        <h3 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-white sm:text-2xl">
          Recevoir le verset du jour
        </h3>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          {statusMessage}
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Vous pouvez desactiver les notifications a tout moment.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {isSubscribed ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-zinc-300"
            onClick={handleUnsubscribe}
            disabled={!canUnsubscribe}
          >
            {isBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BellOff className="mr-2 h-4 w-4" />
            )}
            Desactiver les notifications
          </Button>
        ) : (
          <Button
            type="button"
            className="rounded-full bg-amber-600 px-6 text-white hover:bg-amber-500"
            onClick={handleSubscribe}
            disabled={!canSubscribe}
          >
            {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Recevoir le verset du jour
          </Button>
        )}
      </div>
    </div>
  )
}

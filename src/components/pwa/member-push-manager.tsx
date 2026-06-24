"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, BellOff, Loader2, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type PushState =
  | "checking"
  | "unsupported"
  | "missing-key"
  | "default"
  | "granted"
  | "denied"
  | "subscribed"
  | "ios-install-required"

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

export function MemberPushManager({ activeDevices }: { activeDevices: number }) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const [state, setState] = useState<PushState>("checking")
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    const evaluate = async () => {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setState("unsupported")
        return
      }

      if (!vapidPublicKey) {
        setState("missing-key")
        return
      }

      if (isIosDevice() && !isStandaloneDisplay()) {
        setState("ios-install-required")
        return
      }

      if (Notification.permission === "denied") {
        setState("denied")
        return
      }

      const subscription = await getActiveSubscription().catch(() => null)
      setState(subscription ? "subscribed" : Notification.permission)
    }

    void evaluate()
  }, [vapidPublicKey])

  const status = useMemo(() => {
    switch (state) {
      case "unsupported":
        return "Ce navigateur ne prend pas en charge les notifications web."
      case "missing-key":
        return "La cle publique VAPID manque dans la configuration."
      case "ios-install-required":
        return "Sur iPhone, ouvrez l'application installee depuis l'ecran d'accueil pour activer les notifications."
      case "denied":
        return "Les notifications sont bloquees dans les reglages de votre navigateur."
      case "subscribed":
        return "Notifications activees sur cet appareil."
      case "granted":
        return "Le navigateur autorise les notifications. Abonnez cet appareil pour les recevoir."
      case "default":
        return "Vous pouvez activer les notifications sur cet appareil."
      default:
        return "Verification de cet appareil..."
    }
  }, [state])

  const handleSubscribe = async () => {
    if (!vapidPublicKey || state === "unsupported" || state === "missing-key") {
      return
    }

    setIsBusy(true)

    try {
      const permission = await Notification.requestPermission()

      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "default")
        toast.info("Notifications non activees")
        return
      }

      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      const subscription =
        existing ??
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
          deviceName: navigator.userAgent.includes("Mobile")
            ? "Telephone"
            : "Ordinateur",
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(data?.error ?? "Inscription impossible.")
      }

      setState("subscribed")
      toast.success("Notifications activees")
    } catch (error) {
      toast.error("Notifications indisponibles", {
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'activer les notifications.",
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

      setState(Notification.permission === "granted" ? "granted" : "default")
      toast.info("Notifications desactivees sur cet appareil")
    } catch (error) {
      toast.error("Action impossible", {
        description:
          error instanceof Error
            ? error.message
            : "Impossible de desactiver cet appareil.",
      })
    } finally {
      setIsBusy(false)
    }
  }

  const canSubscribe =
    !isBusy && (state === "default" || state === "granted")
  const canUnsubscribe = !isBusy && state === "subscribed"

  return (
    <section className="rounded-[1.5rem] border border-zinc-200 bg-white/95 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100">
            <Smartphone className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Cet appareil</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {status}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {activeDevices} appareil{activeDevices > 1 ? "s" : ""} actif
              {activeDevices > 1 ? "s" : ""} sur votre compte.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="rounded-full"
            onClick={handleSubscribe}
            disabled={!canSubscribe}
          >
            {isBusy && state !== "subscribed" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Bell className="h-4 w-4" aria-hidden />
            )}
            Activer les notifications
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={handleUnsubscribe}
            disabled={!canUnsubscribe}
          >
            {isBusy && state === "subscribed" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <BellOff className="h-4 w-4" aria-hidden />
            )}
            Desactiver sur cet appareil
          </Button>
        </div>
      </div>
    </section>
  )
}

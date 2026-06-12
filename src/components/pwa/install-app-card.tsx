"use client"

import { useEffect, useState } from "react"
import { Download, Share2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getStandaloneDisplayModeQueries,
  isPwaInstalled,
  markPwaInstalled,
} from "@/lib/pwa-install"

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const dismissedStorageKey = "megvie-install-card-dismissed"

function isIosDevice() {
  if (typeof navigator === "undefined") return false

  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

export function InstallAppCard() {
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const syncInstalledState = () => {
      const installed = isPwaInstalled()
      setIsInstalled(installed)

      if (installed) {
        setInstallPrompt(null)
      }
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsIos(isIosDevice())
      syncInstalledState()
      setIsDismissed(localStorage.getItem(dismissedStorageKey) === "true")
    })

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      if (isPwaInstalled()) {
        setInstallPrompt(null)
        setIsInstalled(true)
        return
      }

      setInstallPrompt(event as InstallPromptEvent)
    }

    const handleInstalled = () => {
      markPwaInstalled()
      syncInstalledState()
    }

    const mediaQueries = getStandaloneDisplayModeQueries().map((query) =>
      window.matchMedia(query),
    )

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleInstalled)

    mediaQueries.forEach((mediaQuery) => {
      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", syncInstalledState)
      }
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      )
      window.removeEventListener("appinstalled", handleInstalled)

      mediaQueries.forEach((mediaQuery) => {
        if (typeof mediaQuery.removeEventListener === "function") {
          mediaQuery.removeEventListener("change", syncInstalledState)
        }
      })
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice

    if (choice.outcome === "accepted") {
      markPwaInstalled()
      setIsInstalled(true)
      setInstallPrompt(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(dismissedStorageKey, "true")
    setIsDismissed(true)
  }

  if (isDismissed || isInstalled) return null

  return (
    <div className="relative flex h-full flex-col justify-between rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-6">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label="Masquer cette invitation"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="pr-8">
        <span className="inline-flex rounded-full bg-amber-100 p-3 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
          <Download className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
          Application
        </p>
        <h3 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-white sm:text-2xl">
          Installer MegVie Paris
        </h3>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Gardez l&apos;eglise MegVie Paris sur votre ecran d&apos;accueil ou
          votre ordinateur portable pour retrouver rapidement les cultes, les
          dons et le verset du jour.
        </p>
      </div>

      <div className="mt-5">
        {installPrompt ? (
          <Button
            type="button"
            className="rounded-full bg-amber-600 px-6 text-white hover:bg-amber-500"
            onClick={handleInstall}
          >
            Installer l&apos;application
          </Button>
        ) : isIos ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Share2 className="h-4 w-4" />
              Sur iPhone
            </div>
            Appuyez sur Partager, puis &quot;Ajouter a l&apos;ecran
            d&apos;accueil&quot;.
          </div>
        ) : (
          <p className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
            Sur ordinateur portable, utilisez l&apos;icone d&apos;installation dans
            la barre d&apos;adresse de Chrome ou Edge. Si elle n&apos;apparait pas,
            ouvrez le menu du navigateur puis choisissez Installer
            l&apos;application.
          </p>
        )}
      </div>
    </div>
  )
}

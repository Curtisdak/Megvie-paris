"use client"

import { useEffect, useState } from "react"
import { InstallAppDialog } from "@/components/pwa/install-app-dialog"
import {
  getStandaloneDisplayModeQueries,
  isPwaInstalled,
  markPwaInstalled,
} from "@/lib/pwa-install"

export function FloatingInstallButton() {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    const updateVisibility = () => {
      setShouldShow(!isPwaInstalled())
    }

    const handleInstalled = () => {
      markPwaInstalled()
      updateVisibility()
    }

    const mediaQueries = getStandaloneDisplayModeQueries().map((query) =>
      window.matchMedia(query),
    )

    updateVisibility()
    window.addEventListener("appinstalled", handleInstalled)

    mediaQueries.forEach((mediaQuery) => {
      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", updateVisibility)
      }
    })

    return () => {
      window.removeEventListener("appinstalled", handleInstalled)

      mediaQueries.forEach((mediaQuery) => {
        if (typeof mediaQuery.removeEventListener === "function") {
          mediaQuery.removeEventListener("change", updateVisibility)
        }
      })
    }
  }, [])

  if (!shouldShow) {
    return null
  }

  return (
    <InstallAppDialog
      triggerLabel="Installer"
      triggerClassName="floating-install-button fixed bottom-4 right-4 z-[60] h-11 w-auto rounded-full border-amber-300 bg-amber-600 px-3 text-sm font-semibold text-white shadow-2xl shadow-amber-700/20 hover:bg-amber-500 dark:border-amber-300/40 dark:bg-amber-500 dark:text-white dark:hover:bg-amber-400 sm:bottom-6 sm:right-6 sm:px-4"
    />
  )
}

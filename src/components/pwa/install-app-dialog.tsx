"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Menu,
  PlusSquare,
  Share2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  getStandaloneDisplayModeQueries,
  isPwaInstalled,
  isStandaloneDisplay,
  markPwaInstalled,
} from "@/lib/pwa-install"
import { cn } from "@/lib/utils"

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

type InstallAppDialogProps = {
  autoOpen?: boolean
  autoOpenDelayMs?: number
  triggerClassName?: string
  triggerLabel?: string
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false

  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

function isSafariBrowser() {
  if (typeof navigator === "undefined") return false

  const userAgent = navigator.userAgent.toLowerCase()

  return (
    userAgent.includes("safari") &&
    !userAgent.includes("crios") &&
    !userAgent.includes("fxios") &&
    !userAgent.includes("edgios")
  )
}

export function InstallAppDialog({
  autoOpen = false,
  autoOpenDelayMs = 1800,
  triggerClassName,
  triggerLabel = "Installer",
}: InstallAppDialogProps) {
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [isSafari, setIsSafari] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    let timeoutId: number | undefined

    const syncInstalledState = () => {
      const installed = isPwaInstalled()

      setIsInstalled(installed)
      setIsStandalone(installed)

      if (installed) {
        setIsOpen(false)
        setInstallPrompt(null)
      }

      return installed
    }

    const frameId = window.requestAnimationFrame(() => {
      const installed = syncInstalledState()

      setIsIos(isIosDevice())
      setIsSafari(isSafariBrowser())

      if (autoOpen && !installed) {
        timeoutId = window.setTimeout(() => {
          setIsOpen(true)
        }, autoOpenDelayMs)
      }
    })

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      if (isPwaInstalled()) {
        setInstallPrompt(null)
        setIsOpen(false)
        setIsInstalled(true)
        setIsStandalone(true)
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
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
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
  }, [autoOpen, autoOpenDelayMs])

  const handleInstall = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice

    if (choice.outcome === "accepted") {
      markPwaInstalled()
      setIsInstalled(true)
      setIsStandalone(true)
      setIsOpen(false)
      setInstallPrompt(null)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Lien copie", {
        description:
          "Ouvrez Safari, collez le lien, puis ajoutez MegVie Paris a l'ecran d'accueil.",
      })
    } catch {
      toast.error("Copie impossible", {
        description: "Copiez l'adresse depuis la barre du navigateur.",
      })
    }
  }

  if (isInstalled || isStandaloneDisplay()) {
    return null
  }

  return (
    <Dialog open={autoOpen ? isOpen : undefined} onOpenChange={setIsOpen}>
      {!autoOpen && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "rounded-full border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100 dark:hover:bg-amber-400/20",
              triggerClassName,
            )}
          >
            <Download className="mr-2 h-4 w-4" />
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className="z-[80] max-h-[calc(100dvh-1.5rem)] overflow-y-auto overflow-x-hidden border-amber-100 bg-white/95 p-5 text-zinc-900 shadow-2xl dark:border-amber-400/30 dark:bg-zinc-950 dark:text-zinc-100 sm:max-h-[calc(100dvh-3rem)] sm:p-6"
        style={{
          boxSizing: "border-box",
          width: "min(32rem, calc(100vw - 1.5rem))",
          maxWidth: "calc(100vw - 1.5rem)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-amber-700 dark:text-amber-200">
            Installer MegVie Paris
          </DialogTitle>
          <DialogDescription className="text-base leading-7 text-zinc-600 dark:text-zinc-300">
            Ajoutez MegVie Paris a votre telephone, tablette ou ordinateur
            portable pour l&apos;ouvrir rapidement comme une application.
          </DialogDescription>
        </DialogHeader>

        {isStandalone ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
            <div className="flex items-center gap-3 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              Application deja installee
            </div>
            <p className="mt-2 text-sm leading-6">
              Vous utilisez deja MegVie Paris en mode application.
            </p>
          </div>
        ) : installPrompt ? (
          <div className="min-w-0 rounded-2xl border border-amber-100 bg-amber-50/80 p-4 dark:border-amber-400/20 dark:bg-amber-400/10 sm:p-5">
            <p className="break-words text-sm leading-6 text-amber-900 dark:text-amber-100">
              Votre navigateur peut installer MegVie Paris directement sur cet
              appareil. Cela fonctionne aussi sur ordinateur portable avec
              Chrome, Edge ou un autre navigateur compatible.
            </p>
            <Button
              type="button"
              className="mt-4 rounded-full bg-amber-600 px-6 text-white hover:bg-amber-500"
              onClick={handleInstall}
            >
              <Download className="mr-2 h-4 w-4" />
              Installer maintenant
            </Button>
          </div>
        ) : isIos ? (
          <div className="min-w-0 space-y-4 rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100 sm:p-5">
            <div>
              <p className="text-base font-semibold">Installer sur iPhone</p>
              <p className="mt-1 text-sm leading-6">
                Apple demande une installation depuis Safari. Suivez ces 3
                etapes rapides.
              </p>
            </div>

            {!isSafari && (
              <div className="rounded-2xl border border-amber-200 bg-white/80 p-4 dark:border-amber-400/30 dark:bg-zinc-950/40">
                <div className="flex gap-3">
                  <span className="mt-1 rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200">
                    <ExternalLink className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold">Ouvrez cette page dans Safari</p>
                    <p className="mt-1 text-xs leading-5">
                      Si vous etes dans Chrome, Facebook, WhatsApp ou Instagram,
                      copiez le lien puis ouvrez-le dans Safari.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 rounded-full border-amber-200 bg-white/90"
                  onClick={handleCopyLink}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copier le lien
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {[
                {
                  label: "1",
                  title: "Touchez Partager",
                  text: "Dans Safari, appuyez sur l'icone Partager en bas de l'ecran.",
                  icon: Share2,
                },
                {
                  label: "2",
                  title: "Choisissez Ajouter a l'ecran d'accueil",
                  text: "Faites defiler la feuille de partage si l'option n'est pas visible.",
                  icon: PlusSquare,
                },
                {
                  label: "3",
                  title: "Confirmez avec Ajouter",
                  text: "L'icone MegVie Paris apparaitra sur votre ecran d'accueil.",
                  icon: CheckCircle2,
                },
              ].map((step) => {
                const Icon = step.icon

                return (
                  <div
                    key={step.label}
                    className="flex gap-3 rounded-2xl bg-white/80 p-3 dark:bg-zinc-950/40"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white">
                      {step.label}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-semibold">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{step.title}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5">{step.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="min-w-0 space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 sm:p-5">
            <p className="font-semibold text-zinc-900 dark:text-white">
              Sur ordinateur portable
            </p>
            <div className="flex gap-3">
              <span className="mt-1 rounded-full bg-white p-2 text-amber-700 dark:bg-zinc-950/40 dark:text-amber-200">
                <Menu className="h-4 w-4" />
              </span>
              <p>
                Dans Chrome ou Edge, cliquez sur l&apos;icone d&apos;installation
                dans la barre d&apos;adresse si elle apparait. Sinon, ouvrez le
                menu du navigateur, puis choisissez Installer MegVie Paris ou
                Installer l&apos;application.
              </p>
            </div>
            <p className="rounded-xl border border-white bg-white/80 px-4 py-3 text-xs leading-5 text-zinc-600 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-300">
              Sur Safari Mac, utilisez Partager, puis Ajouter au Dock si cette
              option est proposee.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

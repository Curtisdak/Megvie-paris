"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Bell, ChevronLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCountBadge } from "@/components/navigation/notification-count-badge"
import { InstallAppDialog } from "@/components/pwa/install-app-dialog"

function getPageTitle(pathname: string) {
  if (pathname === "/") return "Accueil"
  if (pathname.startsWith("/bible")) return "Bible"
  if (pathname.startsWith("/donate")) return "Faire un don"
  if (pathname.startsWith("/notifications")) return "Notifications"
  if (pathname.startsWith("/contact")) return "Contact"
  if (pathname.startsWith("/verset-du-jour")) return "Verset du jour"
  if (pathname.startsWith("/inscription")) return "Inscription"
  if (pathname.startsWith("/connexion")) return "Connexion"
  if (pathname.startsWith("/mot-de-passe-oublie")) return "Mot de passe"
  if (pathname.startsWith("/reinitialiser-mot-de-passe")) return "Mot de passe"
  if (pathname.startsWith("/espace-membre/profil")) return "Profil"
  if (pathname.startsWith("/espace-membre/carte")) return "Carte membre"
  if (pathname.startsWith("/espace-membre/securite")) return "Securite"
  if (pathname.startsWith("/espace-membre/notifications"))
    return "Notifications"
  if (pathname.startsWith("/espace-membre/dons")) return "Mes dons"
  if (pathname.startsWith("/espace-membre/versets-favoris")) return "Favoris"
  if (pathname.startsWith("/espace-membre/notes-bibliques"))
    return "Notes bibliques"
  if (pathname.startsWith("/espace-membre")) return "Espace membre"
  if (pathname.startsWith("/admin")) return "Administration"
  return "MegVie Paris"
}

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const pageTitle = getPageTitle(pathname)
  const isHomePage = pathname === "/"
  const notificationHref = pathname.startsWith("/espace-membre")
    ? "/espace-membre/notifications"
    : "/notifications"

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 px-3 py-2 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex min-h-12 w-full max-w-6xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isHomePage ? (
            <Image
              src="/icons/icon-192x192.png"
              alt=""
              width={36}
              height={36}
              className="rounded-lg min-[1025px]:hidden"
            />
          ) : (
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() =>
                window.history.length > 1 ? router.back() : router.push("/")
              }
              disabled={isHomePage}
              aria-label="Retour"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
          )}
          <span className="min-w-0 truncate text-base font-semibold text-zinc-950 dark:text-white sm:text-lg">
            {isHomePage ? "MegVie Paris" : pageTitle}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <InstallAppDialog iconOnly />
          <ThemeToggle />
          <Link
            href={notificationHref}
            className="relative grid size-11 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Ouvrir les notifications"
            title="Notifications"
          >
            <Bell className="h-4 w-4" aria-hidden />
            <NotificationCountBadge />
          </Link>
        </div>
      </div>
    </header>
  )
}

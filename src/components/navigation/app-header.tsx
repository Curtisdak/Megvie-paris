"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, ChevronLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

function getPageTitle(pathname: string) {
  if (pathname === "/") return "Accueil"
  if (pathname.startsWith("/bible")) return "Bible"
  if (pathname.startsWith("/donate")) return "Faire un don"
  if (pathname.startsWith("/notifications")) return "Notifications"
  if (pathname.startsWith("/contact")) return "Contact"
  if (pathname.startsWith("/verset-du-jour")) return "Verset du jour"
  return "MegVie Paris"
}

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const pageTitle = getPageTitle(pathname)
  const isHomePage = pathname === "/"

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/80 px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 sm:px-4">
      <div className="mx-auto flex min-h-12 w-full max-w-6xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-white/90 text-zinc-700 shadow-sm transition hover:-translate-x-0.5 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:border-amber-300/40 dark:hover:bg-amber-300/10 dark:hover:text-amber-100"
            onClick={() => router.back()}
            disabled={isHomePage}
            aria-label="Retour"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <span className="min-w-0 truncate text-base font-semibold text-zinc-950 dark:text-white sm:text-lg">
            {pageTitle}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-200/80 bg-white/75 p-1 shadow-sm ring-1 ring-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:ring-white/5">
          <ThemeToggle />
          <Link
            href="/notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-amber-300"
            aria-label="Ouvrir les notifications"
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-amber-400 dark:border-white" />
          </Link>
        </div>
      </div>
    </header>
  )
}

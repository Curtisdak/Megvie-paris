"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  UserRound,
} from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"
import type { ChurchRole } from "@/generated/prisma/enums"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"
import { getAdminNavItems } from "@/lib/admin/navigation"
import { cn } from "@/lib/utils"

export function AdminShell({
  role,
  displayName,
  email,
  children,
}: {
  role: ChurchRole
  displayName: string
  email: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const navItems = getAdminNavItems(role)

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#fafafa_0%,#f4f4f5_100%)] text-zinc-950 dark:bg-[linear-gradient(180deg,#09090b_0%,#111113_100%)] dark:text-zinc-50">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-zinc-200 bg-white/95 p-3 shadow-[14px_0_40px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95 lg:flex lg:flex-col">
        <Link
          href="/admin"
          className="flex items-center gap-3 rounded-2xl px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-600 text-xs font-black text-white shadow-lg shadow-amber-600/20">
            MVP
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-200">
              Admin
            </span>
            <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
              MegVie Paris
            </span>
          </span>
        </Link>

        <ScrollArea className="mt-5 min-h-0 flex-1 pr-1">
          <nav className="space-y-1.5" aria-label="Navigation administration">
            {navItems.map((item) => {
              const Icon = item.icon
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                    active
                      ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/10 dark:bg-white dark:text-zinc-950"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-xl transition",
                      active
                        ? "bg-amber-500 text-white"
                        : "bg-zinc-100 text-zinc-500 group-hover:bg-white group-hover:text-amber-700 dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:bg-zinc-800",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
          <p className="font-semibold text-zinc-950 dark:text-white">
            Connecte
          </p>
          <p className="mt-1 truncate">{displayName}</p>
          <p className="mt-2 rounded-full bg-white px-2 py-1 text-center font-semibold text-amber-700 dark:bg-zinc-950 dark:text-amber-200">
            {role}
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 px-3 py-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Retour a l'espace membre"
              >
                <Link href="/espace-membre">
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </Link>
              </Button>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-200">
                  Administration
                </p>
                <h1 className="truncate text-base font-semibold sm:text-lg">
                  {currentTitle(pathname)}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-full border border-zinc-200 bg-white/80 p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <ThemeToggle />
              </div>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Notifications"
              >
                <Link href="/notifications">
                  <Bell className="h-5 w-5" aria-hidden />
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    <UserRound className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">{displayName}</span>
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <span className="block truncate">{displayName}</span>
                    <span className="block truncate text-xs font-normal text-zinc-500">
                      {email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/espace-membre">
                      <LayoutDashboard className="h-4 w-4" aria-hidden />
                      Espace membre
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <SignOutButton>
                    <DropdownMenuItem>
                      <LogOut className="h-4 w-4" aria-hidden />
                      Se deconnecter
                    </DropdownMenuItem>
                  </SignOutButton>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <nav
            className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden"
            aria-label="Navigation administration mobile"
          >
            {navItems.map((item) => {
              const Icon = item.icon
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                    active
                      ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                      : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-3 py-5 sm:px-5 sm:py-6 xl:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}

function currentTitle(pathname: string) {
  if (pathname.startsWith("/admin/demandes-adhesion")) return "Demandes"
  if (pathname.startsWith("/admin/membres")) return "Membres"
  if (pathname.startsWith("/admin/evenements")) return "Evenements"
  if (pathname.startsWith("/admin/galerie")) return "Galerie"
  if (pathname.startsWith("/admin/messages")) return "Messages"
  if (pathname.startsWith("/admin/annonces")) return "Annonces"
  if (pathname.startsWith("/admin/roles")) return "Roles"
  if (pathname.startsWith("/admin/audit")) return "Audit"
  return "Tableau de bord"
}

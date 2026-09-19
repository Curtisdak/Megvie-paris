"use client"

import { useEffect, useSyncExternalStore } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  HeartHandshake,
  Home,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  UserRound,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotificationCountBadge } from "@/components/navigation/notification-count-badge"
import { usePathname } from "next/navigation"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Accueil", mobile: "Accueil", href: "/", icon: Home },
  { label: "La Bible", mobile: "Bible", href: "/bible", icon: BookOpen },
  {
    label: "Verset du jour",
    mobile: "Verset",
    href: "/verset-du-jour",
    icon: Sun,
  },
  {
    label: "Faire un don",
    mobile: "Donner",
    href: "/donate",
    icon: HeartHandshake,
  },
  {
    label: "Notifications",
    mobile: "Actualités",
    href: "/notifications",
    icon: Bell,
  },
  { label: "Contact", mobile: "Contact", href: "/contact", icon: Mail },
  {
    label: "Espace membre",
    mobile: "Mon espace",
    href: "/espace-membre",
    icon: UserRound,
  },
]
const mobileItems = navItems.filter(
  (item) => !["/verset-du-jour", "/notifications"].includes(item.href),
)
const storageKey = "megvie-sidebar-collapsed"
const changeEvent = "megvie-sidebar-collapsed-change"

function getSnapshot() {
  try {
    return window.localStorage.getItem(storageKey) === "true"
  } catch {
    return false
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(changeEvent, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(changeEvent, callback)
  }
}
function isActive(path: string, href: string) {
  return href === "/"
    ? path === href
    : path === href || path.startsWith(href + "/")
}

export function AppNavigation() {
  const pathname = usePathname()
  const reducedMotion = usePrefersReducedMotion()
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, () => false)
  useEffect(() => {
    document.documentElement.classList.toggle("sidebar-collapsed", collapsed)
    return () => document.documentElement.classList.remove("sidebar-collapsed")
  }, [collapsed])
  function toggle() {
    try {
      localStorage.setItem(storageKey, String(!collapsed))
      window.dispatchEvent(new Event(changeEvent))
    } catch {
      /* Navigation remains available when browser storage is disabled. */
    }
  }

  return (
    <>
      <aside
        className={cn(
          "app-sidebar-nav fixed inset-y-0 left-0 z-40 flex-col border-r border-border bg-card p-3 transition-[width] duration-200",
          collapsed ? "w-[4.75rem]" : "w-[15.5rem]",
        )}
        aria-label="Navigation principale"
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-1">
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg"
            aria-label="MegVie Paris, accueil"
          >
            <Image
              src="/icons/icon-192x192.png"
              alt=""
              width={38}
              height={38}
              className="shrink-0 rounded-lg"
            />
            {!collapsed && (
              <span className="min-w-0">
                <strong className="block truncate text-sm">MegVie Paris</strong>
                <span className="block text-xs text-muted-foreground">
                  Foi & communauté
                </span>
              </span>
            )}
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={toggle}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Réduire le menu"
              title="Réduire le menu"
            >
              <PanelLeftClose className="size-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={toggle}
            className="mx-auto mt-3 grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Ouvrir le menu"
            title="Ouvrir le menu"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        )}
        <ScrollArea className="mt-7 min-h-0 flex-1">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-teal-50 font-semibold text-teal-800 dark:bg-teal-400/10 dark:text-teal-200"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 h-5 w-0.5 rounded-full bg-teal-600 dark:bg-teal-300" />
                  )}
                  <Icon className="size-[19px] shrink-0" aria-hidden />
                  {!collapsed && <span>{item.label}</span>}
                  {item.href === "/notifications" && (
                    <NotificationCountBadge className="right-2 top-2" />
                  )}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
        <Link
          href="/contact"
          title={collapsed ? "Nous retrouver" : undefined}
          className="mt-5 flex items-center gap-3 border-t border-border px-2 pt-4 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowUpRight className="size-5 shrink-0" aria-hidden />
          {!collapsed && (
            <span>
              <span className="block font-semibold text-foreground">
                On se retrouve dimanche
              </span>
              <span className="mt-1 block">14:30 · Le Perreux-sur-Marne</span>
            </span>
          )}
        </Link>
      </aside>
      <nav
        className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/50 bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/55"
        aria-label="Navigation principale mobile"
      >
        <div className="mx-auto grid h-16 max-w-xl grid-cols-5 gap-1 px-2">
          {mobileItems.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium transition-colors",
                  active
                    ? "text-teal-800 dark:text-teal-200"
                    : "text-zinc-600 dark:text-zinc-400",
                )}
              >
                <span className="relative grid h-7 w-12 place-items-center">
                  {active && (
                    <motion.span
                      layoutId="mobile-nav-active"
                      className="absolute inset-0 rounded-full bg-teal-100 dark:bg-teal-400/15"
                      transition={{ duration: reducedMotion ? 0 : 0.2 }}
                    />
                  )}
                  <Icon className="relative size-5" aria-hidden />
                </span>
                <span className="max-w-full truncate">{item.mobile}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

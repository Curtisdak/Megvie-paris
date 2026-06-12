"use client"

import type { ComponentType } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Bell,
  BookOpen,
  HeartHandshake,
  Home,
  Mail,
  PanelLeftClose,
  Search,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const desktopNavItems = [
  {
    label: "Accueil",
    href: "/",
    icon: Home,
    description: "Page principale",
  },
  {
    label: "Don",
    href: "/donate",
    icon: HeartHandshake,
    description: "Soutenir la mission",
  },
  {
    label: "Bible",
    href: "/bible",
    icon: Search,
    description: "Lire et rechercher",
  },
  {
    label: "Verset du jour",
    href: "/verset-du-jour",
    icon: BookOpen,
    description: "Encouragement quotidien",
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    description: "Versets et messages",
  },
  {
    label: "Contact",
    href: "/contact",
    icon: Mail,
    description: "Nous joindre",
  },
]

const mobileNavItems = desktopNavItems.filter(
  (item) => item.href !== "/verset-du-jour" && item.href !== "/notifications",
)

function isNavItemActive(pathname: string, hash: string, href: string) {
  if (href === "/") {
    return pathname === "/" && hash !== "#don"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppNavigation() {
  const pathname = usePathname()
  const [hash, setHash] = useState("")
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }

    return window.localStorage.getItem("megvie-sidebar-collapsed") === "true"
  })

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash)

    updateHash()
    window.addEventListener("hashchange", updateHash)
    window.addEventListener("popstate", updateHash)

    return () => {
      window.removeEventListener("hashchange", updateHash)
      window.removeEventListener("popstate", updateHash)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle(
      "sidebar-collapsed",
      isCollapsed,
    )

    return () => {
      document.documentElement.classList.remove("sidebar-collapsed")
    }
  }, [isCollapsed])

  const toggleSidebar = () => {
    setIsCollapsed((current) => {
      const next = !current
      window.localStorage.setItem("megvie-sidebar-collapsed", String(next))
      return next
    })
  }

  return (
    <>
      <aside
        className={cn(
          "app-sidebar-nav fixed inset-y-0 left-0 z-40 flex-col border-r border-zinc-200/80 bg-white/90 px-4 py-5 shadow-[12px_0_40px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-[width,padding] duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/90",
          isCollapsed ? "w-[4.75rem] px-2" : "w-72",
        )}
        aria-label="Navigation principale"
      >
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "justify-between gap-3",
          )}
        >
          {isCollapsed ? (
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-600 text-xs font-black tracking-[0.08em] text-white shadow-md shadow-amber-600/20 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              onClick={toggleSidebar}
              aria-label="Ouvrir le menu lateral"
              aria-expanded={false}
            >
              MVP
            </button>
          ) : (
            <>
              <Link
                href="/"
                className="group flex min-w-0 items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-sm font-black tracking-[0.08em] text-white shadow-md shadow-amber-600/20 transition group-hover:scale-105">
                  MVP
                </span>
                <span className="min-w-0 truncate text-sm font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
                  MegVie Paris
                </span>
              </Link>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-amber-300/40 dark:hover:text-amber-100"
                onClick={toggleSidebar}
                aria-label="Fermer le menu lateral"
                aria-expanded
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        <ScrollArea className="mt-6 min-h-0 flex-1 pr-1">
          <nav className="flex flex-col gap-2">
            {desktopNavItems.map((item, index) => (
              <NavigationLink
                key={item.href}
                collapsed={isCollapsed}
                description={item.description}
                hash={hash}
                href={item.href}
                icon={item.icon}
                index={index}
                label={item.label}
                pathname={pathname}
                variant="sidebar"
              />
            ))}
          </nav>
        </ScrollArea>

        {!isCollapsed ? (
          <div className="rounded-3xl border border-zinc-200 bg-white/75 p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
            <p className="font-semibold text-zinc-900 dark:text-white">
              Notifications
            </p>
            <p className="mt-1 leading-6">
              Bientot: versets, messages, anniversaires et nouvelles de
              l&apos;eglise.
            </p>
          </div>
        ) : null}
      </aside>

      <nav
        className="app-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(env(safe-area-inset-bottom),0.65rem)] pt-2"
        aria-label="Navigation principale mobile"
      >
        <div className="pointer-events-auto mx-auto max-w-sm rounded-[1.75rem] border border-white/70 bg-white/95 p-1.5 shadow-[0_18px_44px_rgba(15,23,42,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/95 dark:shadow-[0_18px_44px_rgba(0,0,0,0.45)]">
          <div className="grid grid-cols-4 gap-1">
            {mobileNavItems.map((item, index) => (
              <NavigationLink
                key={item.href}
                hash={hash}
                href={item.href}
                icon={item.icon}
                index={index}
                label={item.label}
                pathname={pathname}
                variant="bottom"
              />
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}

function NavigationLink({
  collapsed = false,
  description,
  hash,
  href,
  icon: Icon,
  index,
  label,
  pathname,
  variant,
}: {
  collapsed?: boolean
  description?: string
  hash: string
  href: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  index: number
  label: string
  pathname: string
  variant: "sidebar" | "bottom"
}) {
  const isActive = isNavItemActive(pathname, hash, href)

  if (variant === "sidebar") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, delay: index * 0.035 }}
      >
        <Link
          href={href}
          aria-current={isActive ? "page" : undefined}
          title={collapsed ? label : undefined}
          className={cn(
            "group relative flex min-h-16 items-center gap-3 overflow-hidden rounded-3xl px-3 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
            collapsed && "justify-center px-1.5",
            isActive
              ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/15 dark:bg-white dark:text-zinc-950"
              : "text-zinc-600 hover:bg-amber-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-amber-400/10 dark:hover:text-white",
          )}
        >
          {isActive ? (
            <motion.span
              layoutId="sidebar-active-pill"
              className="absolute inset-0 rounded-3xl bg-zinc-950 dark:bg-white"
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            />
          ) : null}
          <span
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-105",
              collapsed && "h-9 w-9 rounded-[1.15rem]",
              isActive
                ? "bg-amber-500 text-white"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          {!collapsed ? (
            <span className="relative min-w-0">
              <span className="block truncate font-semibold">{label}</span>
              {description ? (
                <span
                  className={cn(
                    "mt-0.5 block truncate text-xs",
                    isActive
                      ? "text-white/70 dark:text-zinc-600"
                      : "text-zinc-400 dark:text-zinc-500",
                  )}
                >
                  {description}
                </span>
              ) : null}
            </span>
          ) : null}
          {collapsed && href === "/notifications" ? (
            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border border-white bg-amber-500 dark:border-zinc-950" />
          ) : null}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.025 }}
      className="min-w-0"
    >
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        aria-label={label}
        className={cn(
          "group relative flex min-h-14 min-w-0 items-center justify-center overflow-hidden rounded-[1.35rem] px-1 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
          isActive
            ? "text-zinc-950 dark:text-white"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
        )}
      >
        {isActive ? (
          <motion.span
            layoutId="bottom-active-pill"
            className="absolute inset-0 rounded-[1.35rem] bg-gradient-to-b from-amber-100 via-white to-white shadow-inner dark:from-amber-400/20 dark:via-white/10 dark:to-white/5"
            transition={{ type: "spring", stiffness: 430, damping: 30 }}
          />
        ) : null}
        <span
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-2xl transition group-hover:-translate-y-0.5 group-hover:scale-105",
            isActive
              ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/20 dark:bg-white dark:text-zinc-950"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
          {href === "/notifications" ? (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-amber-500 dark:border-zinc-950" />
          ) : null}
        </span>
        {isActive ? (
          <span className="absolute bottom-1.5 h-1 w-5 rounded-full bg-amber-500 shadow-sm" />
        ) : null}
        <span className="sr-only">
          {label}
        </span>
      </Link>
    </motion.div>
  )
}

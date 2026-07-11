"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import type { ChurchRole } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCountBadge } from "@/components/navigation/notification-count-badge";
import { AdminRouteTransition } from "@/components/admin/admin-route-transition";
import { getAdminNavItems, type AdminNavItem } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

const mobilePriority = [
  "/admin",
  "/admin/demandes-adhesion",
  "/admin/membres",
  "/admin/messages",
];

const groupOrder = ["Aperçu", "Communauté", "Contenus", "Finances", "Système"];

export function AdminShell({
  role,
  displayName,
  email,
  children,
}: {
  role: ChurchRole;
  displayName: string;
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = getAdminNavItems(role);
  const groupedItems = groupAdminItems(navItems);
  const mobilePrimaryItems = mobilePriority
    .map((href) => navItems.find((item) => item.href === href))
    .filter((item): item is AdminNavItem => Boolean(item))
    .slice(0, navItems.length > 4 ? 3 : 4);
  const mobileOverflowItems = navItems.filter(
    (item) => !mobilePrimaryItems.some((primary) => primary.href === item.href),
  );
  const hasMobileOverflow = mobileOverflowItems.length > 0;
  const mobileColumnCount =
    mobilePrimaryItems.length + (hasMobileOverflow ? 1 : 0);
  const overflowIsActive = mobileOverflowItems.some((item) =>
    isNavItemActive(pathname, item.href),
  );

  return (
    <div className="admin-workspace min-h-dvh bg-[linear-gradient(135deg,#f4f5f7_0%,#fff7ed_48%,#ecfdf5_100%)] text-zinc-950 dark:bg-[linear-gradient(135deg,#09090b_0%,#18110d_52%,#07140f_100%)] dark:text-zinc-50">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden h-dvh overflow-hidden border-r border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,247,237,0.96)_48%,rgba(236,253,245,0.96)_100%)] shadow-[18px_0_60px_rgba(15,23,42,0.06)] transition-[width] duration-300 dark:border-white/10 dark:bg-[linear-gradient(180deg,#0d0d0f_0%,#17100c_50%,#07120e_100%)] lg:flex lg:flex-col",
          collapsed ? "w-[5.25rem]" : "w-[17rem]",
        )}
      >
        <div className="flex h-[4.75rem] shrink-0 items-center border-b border-zinc-200/80 px-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 text-left outline-none transition hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:bg-white/5"
            aria-label={
              collapsed
                ? "Ouvrir la barre latérale"
                : "Réduire la barre latérale"
            }
            title={collapsed ? "Ouvrir la barre latérale" : undefined}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-600 text-[0.68rem] font-black text-white shadow-sm shadow-orange-600/20">
              MVP
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 overflow-hidden transition-opacity duration-200",
                collapsed ? "pointer-events-none opacity-0" : "opacity-100",
              )}
            >
              <span className="block truncate text-sm font-bold">
                Administration
              </span>
              <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                MegVie Paris
              </span>
            </span>
            {!collapsed ? (
              <PanelLeftClose
                className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                aria-hidden
              />
            ) : null}
          </button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <nav
            className="space-y-5 px-3 py-4"
            aria-label="Navigation administration"
          >
            {groupOrder.map((group) => {
              const items = groupedItems.get(group);
              if (!items?.length) return null;

              return (
                <div key={group}>
                  <p
                    className={cn(
                      "mb-1.5 h-5 overflow-hidden px-3 text-[0.64rem] font-bold uppercase tracking-[0.16em] text-zinc-400 transition-opacity",
                      collapsed ? "opacity-0" : "opacity-100",
                    )}
                    aria-hidden={collapsed}
                  >
                    {group}
                  </p>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active = isNavItemActive(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            "group relative flex h-11 items-center gap-3 rounded-xl px-2.5 text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500",
                            active
                              ? "bg-gradient-to-r from-orange-600 via-amber-500 to-emerald-600 text-white shadow-lg shadow-orange-600/15"
                              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors",
                              active
                                ? "bg-white/20 text-white ring-1 ring-white/20"
                                : "text-zinc-500 group-hover:text-orange-600 dark:text-zinc-400 dark:group-hover:text-orange-400",
                            )}
                          >
                            <Icon
                              className="h-[1.05rem] w-[1.05rem]"
                              aria-hidden
                            />
                          </span>
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate transition-opacity duration-200",
                              collapsed ? "opacity-0" : "opacity-100",
                            )}
                          >
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="shrink-0 border-t border-zinc-200/80 p-3 dark:border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left outline-none transition hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:bg-white/5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-50 text-sm font-bold text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
                  {initials(displayName)}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 transition-opacity",
                    collapsed ? "opacity-0" : "opacity-100",
                  )}
                >
                  <span className="block truncate text-sm font-semibold">
                    {displayName}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {roleLabel(role)}
                  </span>
                </span>
                {!collapsed ? (
                  <ChevronDown className="h-4 w-4 text-zinc-400" aria-hidden />
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <AccountMenu displayName={displayName} email={email} />
          </DropdownMenu>
        </div>
      </aside>

      <div
        className={cn(
          "min-h-dvh transition-[padding] duration-300",
          collapsed ? "lg:pl-[5.25rem]" : "lg:pl-[17rem]",
        )}
      >
        <header className="sticky top-0 z-40 h-[4.25rem] border-b border-zinc-200/80 bg-[linear-gradient(90deg,rgba(255,255,255,0.96),rgba(255,247,237,0.94),rgba(236,253,245,0.94))] px-3 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(90deg,rgba(13,13,15,0.97),rgba(30,17,10,0.95),rgba(7,25,18,0.95))] sm:px-5 lg:h-[4.75rem]">
          <div className="mx-auto flex h-full w-full max-w-[1480px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl"
                aria-label="Retour à l'espace membre"
              >
                <Link href="/espace-membre">
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <div className="min-w-0">
                <p className="hidden text-[0.64rem] font-bold uppercase tracking-[0.16em] text-orange-600 sm:block dark:text-orange-400">
                  Administration
                </p>
                <h1 className="truncate text-base font-bold sm:text-lg">
                  {currentTitle(pathname)}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-0.5 dark:border-white/10 dark:bg-white/5">
                <ThemeToggle />
              </div>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-xl"
                aria-label="Notifications"
              >
                <Link href="/admin/notifications">
                  <Bell className="h-[1.1rem] w-[1.1rem]" aria-hidden />
                  <NotificationCountBadge />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 rounded-xl px-2.5 shadow-none sm:px-3"
                  >
                    <UserRound className="h-4 w-4" aria-hidden />
                    <span className="hidden max-w-28 truncate sm:inline">
                      {displayName}
                    </span>
                    <ChevronDown
                      className="h-3.5 w-3.5 text-zinc-400"
                      aria-hidden
                    />
                  </Button>
                </DropdownMenuTrigger>
                <AccountMenu displayName={displayName} email={email} />
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-3 py-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-5 sm:py-5 lg:px-6 lg:pb-8">
          <AdminRouteTransition>{children}</AdminRouteTransition>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/80 bg-[linear-gradient(90deg,rgba(255,255,255,0.96),rgba(255,247,237,0.96),rgba(236,253,245,0.96))] px-2 pb-[calc(0.4rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-14px_38px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(90deg,rgba(13,13,15,0.97),rgba(30,17,10,0.96),rgba(7,25,18,0.96))] lg:hidden"
        aria-label="Navigation administration mobile"
      >
        <div
          className="mx-auto grid max-w-xl gap-1"
          style={{
            gridTemplateColumns: `repeat(${mobileColumnCount}, minmax(0, 1fr))`,
          }}
        >
          {mobilePrimaryItems.map((item) => (
            <MobileNavItem key={item.href} item={item} pathname={pathname} />
          ))}

          {hasMobileOverflow ? (
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Voir toutes les pages admin"
                  className={cn(
                    "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[0.62rem] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500",
                    overflowIsActive
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-zinc-500 dark:text-zinc-400",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-10 place-items-center rounded-xl",
                      overflowIsActive && "bg-orange-50 dark:bg-orange-500/10",
                    )}
                  >
                    <MoreHorizontal
                      className="h-[1.15rem] w-[1.15rem]"
                      aria-hidden
                    />
                  </span>
                  <span>Plus</span>
                </button>
              </DialogTrigger>
              <AdminMobileMenu
                navItems={navItems}
                pathname={pathname}
                role={role}
              />
            </Dialog>
          ) : null}
        </div>
      </nav>
    </div>
  );
}

function MobileNavItem({
  item,
  pathname,
}: {
  item: AdminNavItem;
  pathname: string;
}) {
  const Icon = item.icon;
  const active = isNavItemActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[0.62rem] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500",
        active
          ? "text-orange-600 dark:text-orange-400"
          : "text-zinc-500 dark:text-zinc-400",
      )}
    >
      <span
        className={cn(
          "grid h-8 w-10 place-items-center rounded-xl transition-all duration-300",
          active &&
            "bg-gradient-to-br from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25",
        )}
      >
        <Icon className="h-[1.15rem] w-[1.15rem]" aria-hidden />
      </span>
      <span className="w-full truncate text-center">
        {shortMobileLabel(item.label)}
      </span>
    </Link>
  );
}

function AdminMobileMenu({
  navItems,
  pathname,
  role,
}: {
  navItems: AdminNavItem[];
  pathname: string;
  role: ChurchRole;
}) {
  return (
    <DialogContent className="bottom-0 left-0 top-auto max-h-[82dvh] w-full max-w-full translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-b-none rounded-t-2xl border-x-0 border-b-0 p-0 sm:max-w-full">
      <DialogHeader className="border-b border-zinc-200 px-5 py-4 text-left dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <DialogTitle>Navigation admin</DialogTitle>
            <DialogDescription>
              {roleLabel(role)} · {navItems.length} sections disponibles
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              aria-label="Fermer le menu"
            >
              <PanelLeftOpen className="h-5 w-5" aria-hidden />
            </Button>
          </DialogClose>
        </div>
      </DialogHeader>
      <ScrollArea className="max-h-[calc(82dvh-5.5rem)]">
        <div className="grid grid-cols-2 gap-2 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:grid-cols-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(pathname, item.href);
            return (
              <DialogClose asChild key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-24 flex-col justify-between rounded-xl border p-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500",
                    active
                      ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-orange-300 hover:bg-orange-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:border-orange-500/40",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      !active && "text-orange-600 dark:text-orange-400",
                    )}
                    aria-hidden
                  />
                  <span>{item.label}</span>
                </Link>
              </DialogClose>
            );
          })}
        </div>
      </ScrollArea>
    </DialogContent>
  );
}

function AccountMenu({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  return (
    <DropdownMenuContent align="end" className="w-64 rounded-xl">
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
          Se déconnecter
        </DropdownMenuItem>
      </SignOutButton>
    </DropdownMenuContent>
  );
}

function groupAdminItems(items: AdminNavItem[]) {
  const groups = new Map<string, AdminNavItem[]>();
  for (const item of items) {
    const group = groupForHref(item.href);
    groups.set(group, [...(groups.get(group) ?? []), item]);
  }
  return groups;
}

function groupForHref(href: string) {
  if (href === "/admin") return "Aperçu";
  if (
    ["/admin/demandes-adhesion", "/admin/membres", "/admin/messages"].includes(
      href,
    )
  )
    return "Communauté";
  if (
    [
      "/admin/evenements",
      "/admin/galerie",
      "/admin/annonces",
      "/admin/notifications",
      "/admin/versets-du-jour",
    ].includes(href)
  )
    return "Contenus";
  if (["/admin/finance", "/admin/dons/directs"].includes(href))
    return "Finances";
  return "Système";
}

function isNavItemActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function currentTitle(pathname: string) {
  if (pathname.startsWith("/admin/demandes-adhesion"))
    return "Demandes d'adhésion";
  if (pathname.startsWith("/admin/membres")) return "Membres";
  if (pathname.startsWith("/admin/evenements")) return "Événements";
  if (pathname.startsWith("/admin/galerie")) return "Galerie";
  if (pathname.startsWith("/admin/messages")) return "Messages";
  if (pathname.startsWith("/admin/annonces")) return "Annonces";
  if (pathname.startsWith("/admin/notifications")) return "Notifications";
  if (pathname.startsWith("/admin/versets-du-jour")) return "Versets du jour";
  if (pathname.startsWith("/admin/dons/directs")) return "Dons directs";
  if (pathname.startsWith("/admin/finance")) return "Finance";
  if (pathname.startsWith("/admin/webhooks-stripe")) return "Webhooks Stripe";
  if (pathname.startsWith("/admin/audit")) return "Journal d'audit";
  return "Tableau de bord";
}

function roleLabel(role: ChurchRole) {
  const labels: Record<ChurchRole, string> = {
    MEMBER: "Membre",
    RESPO: "Responsable",
    FINANCE: "Finance",
    MASTER: "Administrateur",
    CREATOR: "Créateur",
  };
  return labels[role];
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "MV"
  );
}

function shortMobileLabel(label: string) {
  if (label === "Tableau de bord") return "Accueil";
  if (label === "Demandes") return "Demandes";
  return label;
}

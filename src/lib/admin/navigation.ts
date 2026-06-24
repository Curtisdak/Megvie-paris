import type { ComponentType } from "react"
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarDays,
  CircleDollarSign,
  HandCoins,
  FileText,
  GalleryHorizontalEnd,
  History,
  Mail,
  UserCheck,
  UsersRound,
} from "lucide-react"
import type { ChurchRole } from "@/generated/prisma/enums"
import { hasPermission } from "@/lib/auth/permissions"

export type AdminNavItem = {
  label: string
  href: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}

export function getAdminNavItems(role: ChurchRole): AdminNavItem[] {
  if (role === "FINANCE") {
    return [
      {
        label: "Tableau de bord",
        href: "/admin",
        icon: BarChart3,
      },
      {
        label: "Finance",
        href: "/admin/finance",
        icon: CircleDollarSign,
      },
      {
        label: "Dons directs",
        href: "/admin/dons/directs",
        icon: HandCoins,
      },
    ]
  }

  const items: AdminNavItem[] = [
    {
      label: "Tableau de bord",
      href: "/admin",
      icon: BarChart3,
    },
  ]

  if (hasPermission(role, "members.approve")) {
    items.push({
      label: "Demandes",
      href: "/admin/demandes-adhesion",
      icon: UserCheck,
    })
  }

  if (hasPermission(role, "members.read_basic")) {
    items.push({
      label: "Membres",
      href: "/admin/membres",
      icon: UsersRound,
    })
  }

  if (hasPermission(role, "events.manage")) {
    items.push({
      label: "Evenements",
      href: "/admin/evenements",
      icon: CalendarDays,
    })
  }

  if (hasPermission(role, "gallery.manage")) {
    items.push({
      label: "Galerie",
      href: "/admin/galerie",
      icon: GalleryHorizontalEnd,
    })
  }

  if (hasPermission(role, "messages.read_general")) {
    items.push({
      label: "Messages",
      href: "/admin/messages",
      icon: Mail,
    })
  }

  if (hasPermission(role, "announcements.manage")) {
    items.push({
      label: "Annonces",
      href: "/admin/annonces",
      icon: FileText,
    })
  }

  if (hasPermission(role, "notifications.manage")) {
    items.push({
      label: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
    })
  }

  if (hasPermission(role, "daily_verses.manage")) {
    items.push({
      label: "Versets du jour",
      href: "/admin/versets-du-jour",
      icon: BookOpenCheck,
    })
  }

  if (hasPermission(role, "donations.read_all")) {
    items.push({
      label: "Finance",
      href: "/admin/finance",
      icon: CircleDollarSign,
    })
    items.push({
      label: "Dons directs",
      href: "/admin/dons/directs",
      icon: HandCoins,
    })
  }

  if (hasPermission(role, "audit.read")) {
    items.push({
      label: "Audit",
      href: "/admin/audit",
      icon: History,
    })
  }

  if (role === "CREATOR") {
    items.push({
      label: "Webhooks Stripe",
      href: "/admin/webhooks-stripe",
      icon: History,
    })
  }

  return items
}

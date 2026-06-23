import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  Camera,
  FileText,
  Mail,
  ShieldAlert,
  UserCheck,
  UsersRound,
} from "lucide-react"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { getAdminDashboardData } from "@/lib/admin/data"
import { hasPermission } from "@/lib/auth/permissions"

const cardConfig = [
  {
    key: "pendingMembers",
    label: "Demandes en attente",
    description: "A valider",
    icon: UserCheck,
    href: "/admin/demandes-adhesion",
  },
  {
    key: "activeMembers",
    label: "Membres actifs",
    description: "Annuaire",
    icon: UsersRound,
    href: "/admin/membres",
  },
  {
    key: "suspendedMembers",
    label: "Membres suspendus",
    description: "A suivre",
    icon: ShieldAlert,
    href: "/admin/membres?status=SUSPENDED",
  },
  {
    key: "unreadMessages",
    label: "Messages non lus",
    description: "Boite de reception",
    icon: Mail,
    href: "/admin/messages?status=NEW",
  },
  {
    key: "upcomingEvents",
    label: "Evenements a venir",
    description: "Calendrier",
    icon: CalendarDays,
    href: "/admin/evenements",
  },
  {
    key: "draftAnnouncements",
    label: "Annonces en brouillon",
    description: "A publier",
    icon: FileText,
    href: "/admin/annonces",
  },
  {
    key: "scheduledAnnouncements",
    label: "Annonces programmees",
    description: "Planifiees",
    icon: FileText,
    href: "/admin/annonces",
  },
  {
    key: "recentPhotos",
    label: "Photos en galerie",
    description: "Medias",
    icon: Camera,
    href: "/admin/galerie",
  },
] as const

export default async function AdminPage() {
  const data = await getAdminDashboardData()
  const role = data.user.role

  if (role === "FINANCE") {
    return (
      <div className="space-y-6">
        <AdminCard className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-500/10 dark:to-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-200">
            Finance
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            Module finance prepare pour une prochaine phase.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Votre role est reconnu, mais Prompt 2 ne doit pas exposer les dons,
            statistiques ou exports financiers. Ces ecrans arriveront dans la
            phase finance.
          </p>
        </AdminCard>
      </div>
    )
  }

  const visibleCards = cardConfig.filter((item) => {
    if (item.key === "pendingMembers") return hasPermission(role, "members.approve")
    if (item.key === "activeMembers" || item.key === "suspendedMembers") {
      return hasPermission(role, "members.read_basic")
    }
    if (item.key === "unreadMessages") return hasPermission(role, "messages.read_general")
    if (item.key === "upcomingEvents") return hasPermission(role, "events.manage")
    if (item.key === "recentPhotos") return hasPermission(role, "gallery.manage")
    return hasPermission(role, "announcements.manage")
  })

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-200">
              Administration
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Piloter la vie de l&apos;eglise
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Gere les membres, demandes, contenus, messages et annonces selon
              les permissions de votre role.
            </p>
          </div>
          <StatusBadge
            value={role}
            className="w-fit border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
          />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visibleCards.map((item) => {
          const Icon = item.icon
          const value = data.counts[item.key]

          return (
            <Link
              key={item.key}
              href={item.href}
              className="group rounded-[1.35rem] border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-amber-400/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    {item.description}
                  </p>
                </div>
                <span className="rounded-2xl bg-amber-50 p-2.5 text-amber-700 ring-1 ring-amber-100 transition group-hover:bg-amber-600 group-hover:text-white dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/10">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <p className="text-4xl font-semibold tracking-tight">{value}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-200">
                  Ouvrir
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Activite recente</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Les actions sensibles restent dans l&apos;audit.
            </p>
          </div>
          {hasPermission(role, "audit.read") ? (
            <Button asChild variant="outline">
              <Link href="/admin/audit">Voir tout</Link>
            </Button>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          {data.recentAudit.length > 0 ? (
            data.recentAudit.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-1 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{entry.summary ?? entry.action}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {entry.entityType} - {entry.action}
                  </p>
                </div>
                <time className="text-xs text-zinc-500 dark:text-zinc-400">
                  {entry.createdAt.toLocaleString("fr-FR")}
                </time>
              </div>
            ))
          ) : (
            <EmptyState
              title="Aucune activite visible"
              description="Les actions recentes apparaitront ici selon vos permissions."
            />
          )}
        </div>
      </AdminCard>
    </div>
  )
}

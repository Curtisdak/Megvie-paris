import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Camera,
  FileText,
  Mail,
  ShieldAlert,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { AdminCard, EmptyState } from "@/components/admin/admin-card";
import { AdminPageHero } from "@/components/admin/admin-page-hero";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { getAdminDashboardData } from "@/lib/admin/data";
import { hasPermission } from "@/lib/auth/permissions";

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
] as const;

export default async function AdminPage() {
  const data = await getAdminDashboardData();
  const role = data.user.role;

  if (role === "FINANCE") {
    return (
      <div className="space-y-5">
        <AdminPageHero
          eyebrow="Espace finance"
          title="Suivi des dons"
          description="Consultez les transactions confirmées, les dons mensuels et les exports autorisés."
          action={
            <Button asChild className="rounded-xl">
              <Link href="/admin/finance">
                Ouvrir la finance{" "}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const visibleCards = cardConfig.filter((item) => {
    if (item.key === "pendingMembers")
      return hasPermission(role, "members.approve");
    if (item.key === "activeMembers" || item.key === "suspendedMembers") {
      return hasPermission(role, "members.read_basic");
    }
    if (item.key === "unreadMessages")
      return hasPermission(role, "messages.read_general");
    if (item.key === "upcomingEvents")
      return hasPermission(role, "events.manage");
    if (item.key === "recentPhotos")
      return hasPermission(role, "gallery.manage");
    return hasPermission(role, "announcements.manage");
  });

  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Vue d'ensemble"
        title="Tableau de bord"
        description="Les informations utiles pour gérer la communauté et les contenus MegVie Paris."
        action={
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
            <span className="hidden text-xs text-white/70 sm:inline">
              {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
                new Date(),
              )}
            </span>
            <StatusBadge
              value={role}
              className="border-white/20 bg-white/10 text-white"
            />
          </div>
        }
      />

      <section aria-labelledby="admin-indicators">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 id="admin-indicators" className="text-sm font-bold">
              Indicateurs clés
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Accès direct aux tâches en cours.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {visibleCards.map((item) => {
            const Icon = item.icon;
            const value = data.counts[item.key];

            return (
              <Link
                key={item.key}
                href={item.href}
                className="group rounded-xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition hover:border-orange-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)] focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-white/10 dark:bg-[#111114] dark:hover:border-orange-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-orange-50 group-hover:text-orange-700 dark:bg-white/5 dark:text-zinc-300 dark:group-hover:bg-orange-500/10 dark:group-hover:text-orange-300">
                    <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden />
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 text-zinc-300 transition group-hover:text-orange-600 dark:text-zinc-700 dark:group-hover:text-orange-400"
                    aria-hidden
                  />
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight">
                  {value}
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <AdminCard className="p-0 sm:p-0">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-4 dark:border-white/10 sm:px-5">
          <div>
            <h2 className="text-base font-bold">Activité récente</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Dernières opérations enregistrées dans l&apos;audit.
            </p>
          </div>
          {hasPermission(role, "audit.read") ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-lg shadow-none"
            >
              <Link href="/admin/audit">
                Voir le journal <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
        <div className="divide-y divide-zinc-100 px-4 dark:divide-white/5 sm:px-5">
          {data.recentAudit.length > 0 ? (
            data.recentAudit.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {entry.summary ?? entry.action}
                  </p>
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
            <div className="py-4">
              <EmptyState
                title="Aucune activité visible"
                description="Les actions récentes apparaîtront ici selon vos permissions."
              />
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  );
}

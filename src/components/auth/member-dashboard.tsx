import Link from "next/link"
import {
  ArrowRight,
  Bell,
  BookMarked,
  CreditCard,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  NotebookPen,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MemberDashboardData } from "@/lib/auth/dashboard"
import { getDisplayName } from "@/lib/auth/member"
import { SignOutControl } from "@/components/auth/sign-out-control"

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "active"
      ? "Actif"
      : status === "pending"
        ? "En attente"
        : status

  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800 dark:bg-amber-400/15 dark:text-amber-100">
      {label}
    </span>
  )
}

type MemberContent = {
  events: Array<{
    id: string
    title: string
    shortDescription: string | null
    startsAt: Date
    locationName: string | null
    visibility: string
  }>
  announcements: Array<{
    id: string
    title: string
    summary: string | null
    category: string
    visibility: string
    publishedAt: Date | null
  }>
}

export function MemberHome({
  data,
  content,
}: {
  data: MemberDashboardData
  content?: MemberContent
}) {
  const profile = data.profile
  const isActive = profile?.membership_status === "active"
  const isAdmin = ["respo", "finance", "master", "creator"].includes(data.role)
  const displayName = profile ? getDisplayName(profile) : "Membre MegVie"

  return (
    <div className="app-page">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="border-b border-border pb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                Espace membre
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight">
                Bienvenue, {displayName}.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Heureux de vous retrouver dans la communauté MegVie Paris.
              </p>
            </div>
            <StatusBadge status={profile?.membership_status ?? "pending"} />
          </div>
        </section>

        {!isActive ? (
          <section className="rounded-[28px] border border-amber-100 bg-amber-50/90 p-5 text-amber-950 shadow-sm dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100 sm:p-6">
            <h2 className="text-xl font-semibold">
              Adhesion en attente de validation
            </h2>
            <p className="mt-2 text-sm leading-6">
              Vous pouvez deja completer votre profil et vos preferences. Votre
              carte officielle et votre identifiant membre apparaitront apres
              validation par l&apos;equipe autorisee.
            </p>
          </section>
        ) : (
          <section className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
            <p className="text-sm text-muted-foreground">
              Identifiant membre
            </p>
            <Link href="/espace-membre/carte" className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 font-mono text-sm font-semibold text-teal-800 dark:bg-teal-400/10 dark:text-teal-200">
              <CreditCard className="size-4" aria-hidden />
              {profile?.member_id}
            </Link>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            {
              href: "/espace-membre/profil",
              label: "Mon profil",
              description: "Coordonnees et informations personnelles.",
              icon: UserRound,
            },
            {
              href: "/espace-membre/carte",
              label: "Carte membre",
              description: isActive
                ? "Apercu de votre carte numerique."
                : "Disponible apres validation.",
              icon: CreditCard,
            },
            {
              href: "/espace-membre/notifications",
              label: "Notifications",
              description: "Verset du jour, annonces et anniversaires.",
              icon: Bell,
            },
            {
              href: "/espace-membre/dons",
              label: "Mes dons",
              description: "Historique et dons mensuels.",
              icon: HeartHandshake,
            },
            {
              href: "/espace-membre/versets-favoris",
              label: "Versets favoris",
              description: "Passages bibliques sauvegardes.",
              icon: BookMarked,
            },
            {
              href: "/espace-membre/notes-bibliques",
              label: "Notes bibliques",
              description: "Notes privees de lecture.",
              icon: NotebookPen,
            },
            {
              href: "/espace-membre/securite",
              label: "Securite",
              description: "Mot de passe et sessions Clerk.",
              icon: ShieldCheck,
            },
            ...(isAdmin
              ? [
                  {
                    href: "/admin",
                    label: "Administration",
                    description: "Ouvrir le tableau de bord admin.",
                    icon: LayoutDashboard,
                  },
                ]
              : []),
          ].map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group min-w-0 rounded-lg border border-border bg-card p-4 transition-colors hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-400/5"
              >
                <span className="inline-flex text-teal-700 dark:text-teal-300">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-3 text-sm font-semibold">{item.label}</h2>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {item.description}
                </p>
              </Link>
            )
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="min-w-0 border-t border-border py-5">
            <h2 className="text-lg font-semibold">Evenements a venir</h2>
            <div className="mt-4 space-y-3">
              {content?.events.length ? (
                content.events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl bg-zinc-50 p-4 text-sm dark:bg-zinc-950/40"
                  >
                    <p className="font-semibold">{event.title}</p>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                      {event.startsAt.toLocaleString("fr-FR")}
                      {event.locationName ? ` - ${event.locationName}` : ""}
                    </p>
                    {event.shortDescription ? (
                      <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                        {event.shortDescription}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Aucun evenement publie pour le moment.
                </p>
              )}
            </div>
          </div>
          <div className="min-w-0 border-t border-border py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-2xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100">
                  <FileText className="h-4 w-4" aria-hidden />
                </span>
                <h2 className="text-lg font-semibold">Annonces</h2>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/espace-membre/annonces">
                  Tout voir
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {content?.announcements.length ? (
                content.announcements.map((announcement) => (
                  <Link
                    key={announcement.id}
                    href={`/espace-membre/annonces/${announcement.id}`}
                    className="block rounded-2xl bg-zinc-50 p-4 text-sm transition hover:bg-amber-50 dark:bg-zinc-950/40 dark:hover:bg-zinc-950"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
                      {announcement.category.toLowerCase().replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 font-semibold">{announcement.title}</p>
                    {announcement.summary ? (
                      <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                        {announcement.summary}
                      </p>
                    ) : null}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Aucune annonce publiee pour le moment.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-border py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Votre compte</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                MegVie Paris · Espace personnel
              </p>
            </div>
            <SignOutControl />
          </div>
        </section>
      </main>
    </div>
  )
}

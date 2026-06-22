import Link from "next/link"
import { Bell, CreditCard, ShieldCheck, UserRound } from "lucide-react"
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

export function MemberHome({ data }: { data: MemberDashboardData }) {
  const profile = data.profile
  const isActive = profile?.membership_status === "active"
  const displayName = profile ? getDisplayName(profile) : "Membre MegVie"

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-3 py-5 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50 sm:px-4 sm:py-12">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-zinc-950 via-amber-900 to-emerald-800 p-6 text-white shadow-2xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-100">
                Espace membre
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">
                Bienvenue, {displayName}.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
                Gerer votre profil, votre securite, vos preferences et votre
                carte membre MegVie Paris.
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
          <section className="rounded-[28px] border border-zinc-200 bg-white/95 p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-600">
              Identifiant membre
            </p>
            <p className="mt-3 text-4xl font-black text-zinc-950 dark:text-white">
              {profile?.member_id}
            </p>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              href: "/espace-membre/securite",
              label: "Securite",
              description: "Mot de passe et MFA.",
              icon: ShieldCheck,
            },
          ].map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-lg font-semibold">{item.label}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {item.description}
                </p>
              </Link>
            )
          })}
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white/90 p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Fonctions a venir</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Dons recurrents, annonces, evenements et ressources seront
                ajoutes dans les prochaines phases.
              </p>
            </div>
            <SignOutControl />
          </div>
        </section>
      </main>
    </div>
  )
}

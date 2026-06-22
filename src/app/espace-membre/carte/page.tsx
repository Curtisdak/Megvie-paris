import type { Metadata } from "next"
import Link from "next/link"
import { getRequiredMemberDashboardData } from "@/lib/auth/dashboard"
import { getDisplayName } from "@/lib/auth/member"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Carte membre",
}

export default async function MemberCardPage() {
  const data = await getRequiredMemberDashboardData("/espace-membre/carte")
  const profile = data.profile
  const isActive = profile?.membership_status === "active"

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-3 py-5 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 sm:px-4 sm:py-12">
      <main className="mx-auto max-w-4xl">
        <Link href="/espace-membre" className="text-sm text-amber-700">
          Retour espace membre
        </Link>
        <section className="mt-5 overflow-hidden rounded-[32px] bg-zinc-950 text-white shadow-2xl">
          <div className="bg-gradient-to-br from-amber-700 via-amber-600 to-emerald-700 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">
              Carte membre MegVie Paris
            </p>
            <h1 className="mt-8 text-3xl font-semibold">
              {profile ? getDisplayName(profile) : "Membre MegVie"}
            </h1>
            <p className="mt-2 text-white/80">
              {isActive
                ? profile?.member_id
                : "Adhesion en attente de validation"}
            </p>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-sm text-zinc-300">Statut</p>
              <p className="mt-1 text-xl font-semibold">
                {isActive ? "Actif" : "En attente"}
              </p>
              <p className="mt-4 max-w-md text-xs leading-5 text-zinc-400">
                TODO Phase future: remplacer ce bloc par un jeton de carte signe,
                revocable et verifiable. Aucune donnee sensible n&apos;est placee
                dans le QR code pour cette phase.
              </p>
            </div>
            <div className="grid h-28 w-28 place-items-center rounded-3xl bg-white text-center text-xs font-semibold text-zinc-950">
              QR
              <br />
              Phase 2
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

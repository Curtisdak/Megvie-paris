import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, Clock3 } from "lucide-react"
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
    <div className="app-page">
      <main className="mx-auto max-w-4xl">
        <Link href="/espace-membre" className="text-sm text-amber-700">
          Retour espace membre
        </Link>
        <section className="mt-5 overflow-hidden rounded-lg bg-zinc-950 text-white shadow-none">
          <div className="bg-gradient-to-br from-amber-700 via-amber-600 to-emerald-700 p-6">
            <p className="text-xs font-semibold uppercase tracking-normal text-white/75">
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
            </div>
            <div className="grid size-14 place-items-center rounded-lg bg-white/10 text-teal-200">
              {isActive ? <BadgeCheck className="size-7" aria-label="Membre actif" /> : <Clock3 className="size-7" aria-label="En attente" />}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

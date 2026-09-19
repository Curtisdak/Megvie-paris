import type { Metadata } from "next"
import Link from "next/link"
import { ProfileForm } from "@/components/auth/auth-forms"
import { getRequiredMemberDashboardData } from "@/lib/auth/dashboard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Profil membre",
}

export default async function MemberProfilePage() {
  const data = await getRequiredMemberDashboardData("/espace-membre/profil")

  return (
    <div className="app-page">
      <main className="mx-auto w-full max-w-4xl">
        <Link href="/espace-membre" className="text-sm text-amber-700">
          Retour espace membre
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Mon profil</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Vous pouvez modifier vos informations de contact. Votre statut,
          identifiant membre et role ne sont pas modifiables par le navigateur.
        </p>
        <div className="mt-6">
          <ProfileForm data={data} />
        </div>
      </main>
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { ClerkSecurityPanel } from "@/components/auth/auth-forms"
import { getRequiredMemberDashboardData } from "@/lib/auth/dashboard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Securite membre",
}

export default async function MemberSecurityPage() {
  await getRequiredMemberDashboardData("/espace-membre/securite")

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-3 py-5 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 sm:px-4 sm:py-12">
      <main className="mx-auto max-w-4xl">
        <Link href="/espace-membre" className="text-sm text-amber-700">
          Retour espace membre
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Securite</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Gerez votre mot de passe, vos sessions et les reglages de securite
          proposes par Clerk.
        </p>
        <div className="mt-6">
          <ClerkSecurityPanel />
        </div>
      </main>
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { NotificationPreferencesForm } from "@/components/auth/auth-forms"
import { getRequiredMemberDashboardData } from "@/lib/auth/dashboard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Notifications membre",
}

export default async function MemberNotificationsPage() {
  const data = await getRequiredMemberDashboardData(
    "/espace-membre/notifications",
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-3 py-5 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 sm:px-4 sm:py-12">
      <main className="mx-auto max-w-4xl rounded-[28px] border border-zinc-200 bg-white/95 p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/85 sm:p-7">
        <Link href="/espace-membre" className="text-sm text-amber-700">
          Retour espace membre
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Mes notifications</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Choisissez ce que vous souhaitez recevoir. Les anniversaires publics
          restent desactives par defaut.
        </p>
        <div className="mt-6">
          <NotificationPreferencesForm data={data} />
        </div>
      </main>
    </div>
  )
}

import type { Metadata } from "next"
import { requireAdminAal2 } from "@/lib/auth/clerk-user"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Administration",
}

export default async function AdminPage() {
  await requireAdminAal2("/admin")

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-3 py-12 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <main className="mx-auto max-w-5xl rounded-[28px] border border-zinc-200 bg-white/95 p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/85">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
          Phase 1
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          Administration membership
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Les RPC d&apos;approbation, suspension et gestion des roles sont en
          place. Les modules admin complets arrivent dans une phase suivante.
        </p>
      </main>
    </div>
  )
}

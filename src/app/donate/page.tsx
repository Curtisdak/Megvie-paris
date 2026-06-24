import type { Metadata } from "next"
import { DonatePageClient } from "@/components/donation/donate-page-client"
import { listActiveDonationCategories } from "@/lib/finance/categories"

export const metadata: Metadata = {
  title: "Faire un don",
  description:
    "Soutenir MegVie Paris avec un don securise en ligne via Stripe.",
}

export const dynamic = "force-dynamic"

export default async function DonatePage() {
  const categories = await listActiveDonationCategories()

  return (
    <div className="app-edge-to-edge min-h-screen bg-[linear-gradient(180deg,#fff8eb_0%,#f7faf7_46%,#ffffff_100%)] py-4 text-zinc-950 dark:bg-[linear-gradient(180deg,#080808_0%,#11120f_48%,#050505_100%)] dark:text-zinc-50 sm:py-8">
      <main className="mx-auto flex w-full max-w-6xl flex-col">
        <DonatePageClient categories={categories} />
      </main>
    </div>
  )
}

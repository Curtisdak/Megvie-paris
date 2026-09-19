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
    <div className="app-page">
      <main className="mx-auto w-full max-w-5xl">
        <DonatePageClient categories={categories} />
      </main>
    </div>
  )
}

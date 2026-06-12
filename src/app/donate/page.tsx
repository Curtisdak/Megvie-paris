import type { Metadata } from "next"
import { DonatePageClient } from "@/components/donation/donate-page-client"
import { HighlightsSection } from "@/components/landing/highlights-section"

export const metadata: Metadata = {
  title: "Faire un don",
  description:
    "Soutenir MegVie Paris avec un don securise en ligne via Stripe.",
}

export default function DonatePage() {
  return (
    <div className="app-edge-to-edge min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 py-5 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50 sm:py-12">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <DonatePageClient />
        <HighlightsSection />
      </main>
    </div>
  )
}

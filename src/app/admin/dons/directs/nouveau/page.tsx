import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AdminPageHero } from "@/components/admin/admin-page-hero"
import { DirectDonationForm } from "@/components/donation/direct-donation-form"
import { Button } from "@/components/ui/button"
import { getDirectDonationFormData } from "@/lib/finance/direct"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Nouveau don direct",
}

function toDateTimeLocal(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

export default async function NewDirectDonationPage() {
  const { categories, events } = await getDirectDonationFormData()

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="outline" className="rounded-lg shadow-none">
          <Link href="/admin/dons/directs">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour
          </Link>
        </Button>
      </div>

      <AdminPageHero
        eyebrow="Dons directs"
        title="Enregistrer un don reçu en main propre"
        description="Les dons directs restent en vérification avant d'entrer dans les totaux officiels. Les paiements Stripe ne passent jamais par ce formulaire."
      />

      <section className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#111114] sm:p-5">
        <DirectDonationForm
          categories={categories}
          events={events.map((event) => ({
            ...event,
            startsAt: event.startsAt.toISOString(),
          }))}
          defaultReceivedAt={toDateTimeLocal()}
        />
      </section>
    </div>
  )
}

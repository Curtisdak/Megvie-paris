import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, BadgeEuro } from "lucide-react"
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
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/admin/dons/directs">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour
          </Link>
        </Button>
      </div>

      <section className="rounded-[1.35rem] bg-gradient-to-br from-zinc-950 via-amber-950 to-emerald-950 p-5 text-white shadow-xl sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-amber-100 ring-1 ring-white/15">
            <BadgeEuro className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
              Dons directs
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Enregistrer un don recu en main propre.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-200">
              Les dons directs restent en verification avant d&apos;entrer dans les
              totaux officiels. Les paiements Stripe ne passent jamais par ce
              formulaire.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.35rem] border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-5">
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

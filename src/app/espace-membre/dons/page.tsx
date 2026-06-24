import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CreditCard, HeartHandshake, ReceiptText } from "lucide-react"
import { CustomerPortalButton } from "@/components/donation/customer-portal-button"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/admin/status-badge"
import { getMemberDonationHistory } from "@/lib/finance/data"
import { formatCurrencyFromCents } from "@/lib/finance/config"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Historique de mes dons",
}

export default async function MemberDonationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>
}) {
  const params = (await searchParams) ?? {}
  const data = await getMemberDonationHistory({ page: params.page })
  const hasRecurring = data.recurringDonations.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-3 py-5 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 sm:px-4 sm:py-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="rounded-[1.65rem] bg-gradient-to-br from-zinc-950 via-amber-950 to-emerald-950 p-5 text-white shadow-xl sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">
            Dons
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold sm:text-4xl">
                Historique de mes dons
              </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-200">
                Retrouvez vos confirmations de paiement Stripe et vos dons
                directs rattaches a votre compte.
              </p>
            </div>
            <Button asChild className="w-fit rounded-full bg-white text-zinc-950 hover:bg-zinc-100">
              <Link href="/donate">
                Faire un don
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>

        <section className="rounded-[1.45rem] border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/80 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-100">
                <CreditCard className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold">Don mensuel</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {hasRecurring
                    ? "Gestion securisee par Stripe Customer Portal."
                    : "Aucun don mensuel actif pour le moment."}
                </p>
              </div>
            </div>
            {hasRecurring ? <CustomerPortalButton /> : null}
          </div>
          {hasRecurring ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {data.recurringDonations.map((item) => (
                <div key={item.id} className="rounded-2xl border border-zinc-200 p-3 dark:border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{item.category.label}</p>
                    <StatusBadge value={item.status} />
                  </div>
                  <p className="mt-2 text-lg font-semibold">
                    {formatCurrencyFromCents(item.amountCents, item.currency)}
                    <span className="text-sm font-normal text-zinc-500"> / mois</span>
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.45rem] border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/80 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-100">
              <ReceiptText className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold">Confirmations de don</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Les dons en ligne apparaissent apres confirmation Stripe. Les
                dons directs apparaissent apres saisie finance.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.donations.length ? (
              data.donations.map((donation) => {
                const isDirect = donation.source === "DIRECT"
                const statusValue = isDirect
                  ? (donation.directStatus ?? "RECORDED")
                  : donation.status
                const statusLabel = isDirect
                  ? donation.directStatus === "VERIFIED"
                    ? "Verifie"
                    : donation.directStatus === "CANCELLED"
                      ? "Annule"
                      : "Enregistre"
                  : undefined
                const displayDate =
                  (isDirect ? donation.receivedAt : donation.donatedAt) ??
                  donation.createdAt

                return (
                <article key={donation.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{donation.category.label}</p>
                        <StatusBadge value={statusValue} label={statusLabel} />
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                          {isDirect ? "Don direct" : "Stripe"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">
                        {isDirect
                          ? "Don recu par l'equipe finance"
                          : donation.frequency === "MONTHLY"
                            ? "Don mensuel"
                            : "Don unique"}{" "}
                        - {displayDate.toLocaleString("fr-FR")}
                      </p>
                      {!isDirect && (donation.stripeReceiptUrl || donation.stripeHostedInvoiceUrl) ? (
                        <Link
                          href={donation.stripeReceiptUrl ?? donation.stripeHostedInvoiceUrl ?? "#"}
                          className="mt-2 inline-flex text-sm font-semibold text-amber-700 dark:text-amber-200"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ouvrir le recu Stripe
                        </Link>
                      ) : null}
                    </div>
                    <p className="text-xl font-semibold">
                      {formatCurrencyFromCents(donation.amountCents, donation.currency)}
                    </p>
                  </div>
                </article>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
                <HeartHandshake className="mx-auto h-8 w-8 text-amber-600" />
                <p className="mt-3 font-semibold">Aucun don confirme</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Votre historique apparaitra ici apres confirmation Stripe.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

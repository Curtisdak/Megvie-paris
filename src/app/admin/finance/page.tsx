import Link from "next/link"
import {
  ArrowDownToLine,
  Banknote,
  CalendarClock,
  Filter,
  HandCoins,
  Plus,
  ReceiptText,
  Repeat,
  Search,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateDonationCategoryAction } from "@/lib/finance/actions"
import { formatCurrencyFromCents } from "@/lib/finance/config"
import {
  getFinanceDashboardData,
  getRecurringDonationAdminData,
} from "@/lib/finance/data"

const donationStatusOptions = [
  ["", "Tous statuts"],
  ["SUCCEEDED", "Confirmes"],
  ["PENDING", "En attente"],
  ["FAILED", "Echoues"],
  ["PARTIALLY_REFUNDED", "Partiellement rembourses"],
  ["REFUNDED", "Rembourses"],
  ["DISPUTED", "Litiges"],
]

const frequencyOptions = [
  ["", "Tous types"],
  ["ONE_TIME", "Don unique"],
  ["MONTHLY", "Don mensuel"],
]

const sourceOptions = [
  ["", "Toutes sources"],
  ["ONLINE", "Stripe en ligne"],
  ["DIRECT", "Dons directs"],
]

const directStatusOptions = [
  ["", "Tous dons directs"],
  ["RECORDED", "Directs a verifier"],
  ["VERIFIED", "Directs verifies"],
  ["CANCELLED", "Directs annules"],
]

const directKindOptions = [
  ["", "Tous types directs"],
  ["IDENTIFIED", "Membre identifie"],
  ["ANONYMOUS_COLLECTION", "Collecte anonyme"],
]

const statusLabelByValue = Object.fromEntries(donationStatusOptions)
const frequencyLabelByValue = Object.fromEntries(frequencyOptions)
const directStatusLabelByValue = Object.fromEntries(directStatusOptions)
const directKindLabelByValue = Object.fromEntries(directKindOptions)

function buildHref(path: string, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value)
  }

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

function donorName(donation: {
  donorNameSnapshot: string | null
  user: {
    email: string
    firstName: string | null
    lastName: string | null
    profile: { displayName: string | null; memberId: string | null } | null
  } | null
}) {
  return (
    donation.donorNameSnapshot ||
    donation.user?.profile?.displayName ||
    [donation.user?.firstName, donation.user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    donation.user?.email ||
    "Donateur"
  )
}

function stripeReference(donation: {
  stripeInvoiceId: string | null
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
  stripeCheckoutSessionId: string | null
}) {
  return (
    donation.stripeInvoiceId ||
    donation.stripePaymentIntentId ||
    donation.stripeChargeId ||
    donation.stripeCheckoutSessionId
  )
}

function shortReference(value: string) {
  return value.length > 22 ? `${value.slice(0, 11)}...${value.slice(-6)}` : value
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string
    source?: string
    status?: string
    frequency?: string
    directStatus?: string
    directKind?: string
    category?: string
    from?: string
    to?: string
    page?: string
  }>
}) {
  const params = (await searchParams) ?? {}
  const data = await getFinanceDashboardData(params)
  const recurring = await getRecurringDonationAdminData(params)
  const exportHref = buildHref("/api/admin/finance/export", params)
  const canManageCategories = data.user.role === "CREATOR"
  const hasActiveFilters = Boolean(
      params.q ||
      params.source ||
      params.status ||
      params.frequency ||
      params.directStatus ||
      params.directKind ||
      params.category ||
      params.from ||
      params.to,
  )

  const statCards = [
    {
      label: "Stripe",
      value: data.stats.format(data.stats.onlineTotals.netCents),
      helper: `${data.stats.onlineTotals.count} paiement(s) confirme(s)`,
      icon: CalendarClock,
      className:
        "bg-emerald-50 text-emerald-950 dark:bg-emerald-500/10 dark:text-emerald-50",
    },
    {
      label: "Direct verifies",
      value: data.stats.format(data.stats.directVerifiedTotals.netCents),
      helper: `${data.stats.directVerifiedTotals.count} don(s) officiel(s)`,
      icon: HandCoins,
      className:
        "bg-amber-50 text-amber-950 dark:bg-amber-500/10 dark:text-amber-50",
    },
    {
      label: "A verifier",
      value: data.stats.format(data.stats.directRecorded.grossCents),
      helper: `${data.stats.directRecorded.count} direct(s) en attente`,
      icon: ReceiptText,
      className:
        "bg-sky-50 text-sky-950 dark:bg-sky-500/10 dark:text-sky-50",
    },
    {
      label: "Total officiel",
      value: data.stats.format(data.stats.totals.netCents),
      helper: "Stripe net + directs verifies",
      icon: UsersRound,
      className:
        "bg-zinc-100 text-zinc-950 dark:bg-white/10 dark:text-zinc-50",
    },
  ]

  return (
    <div className="space-y-3 pb-4 sm:space-y-4">
      <section className="rounded-[1.35rem] border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/80 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-700 dark:text-amber-200">
              Finance
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Finance des dons
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                Webhooks verifies
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                {data.pagination.filtered} don(s)
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-flow-col sm:justify-end">
            <Button
              asChild
              className="h-11 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700 sm:w-fit"
            >
              <Link href="/admin/dons/directs/nouveau">
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter un don direct
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 w-full rounded-2xl bg-white dark:bg-zinc-950 sm:w-fit"
            >
              <Link href={exportHref}>
                <ArrowDownToLine className="h-4 w-4" aria-hidden />
                Export CSV
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon

          return (
            <section
              key={item.label}
              className={`rounded-[1.2rem] p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10 sm:p-4 ${item.className}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
                    {item.label}
                  </p>
                  <p className="mt-2 truncate text-xl font-semibold tracking-tight sm:text-2xl">
                    {item.value}
                  </p>
                </div>
                <span className="rounded-2xl bg-white/70 p-2 text-current shadow-sm dark:bg-white/10">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              </div>
              <p className="mt-2 text-xs opacity-70">{item.helper}</p>
            </section>
          )
        })}
      </div>

      <AdminCard className="p-3 sm:p-4">
        <form className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Rechercher un don</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <Input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Nom, email, membre, Stripe, collecte..."
                className="h-12 rounded-2xl pl-10"
              />
            </label>
            <Button type="submit" className="h-12 rounded-2xl sm:w-36">
              <Filter className="h-4 w-4" aria-hidden />
              Filtrer
            </Button>
          </div>

          <details
            open={hasActiveFilters}
            className="group rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-zinc-950/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold marker:hidden">
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Options de filtre
              </span>
              <span className="text-xs font-medium text-zinc-500">
                {hasActiveFilters ? "actifs" : "ouvrir"}
              </span>
            </summary>
            <div className="grid gap-2 border-t border-zinc-200 p-3 dark:border-white/10 sm:grid-cols-2 xl:grid-cols-7">
              <select
                name="source"
                defaultValue={params.source ?? ""}
                className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                {sourceOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                name="status"
                defaultValue={params.status ?? ""}
                className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                {donationStatusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                name="frequency"
                defaultValue={params.frequency ?? ""}
                className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                {frequencyOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                name="directStatus"
                defaultValue={params.directStatus ?? ""}
                className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                {directStatusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                name="directKind"
                defaultValue={params.directKind ?? ""}
                className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                {directKindOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                name="category"
                defaultValue={params.category ?? ""}
                className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="">Toutes categories</option>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              <Input
                name="from"
                type="date"
                defaultValue={params.from ?? ""}
                className="h-11 rounded-2xl"
              />
              <Input
                name="to"
                type="date"
                defaultValue={params.to ?? ""}
                className="h-11 rounded-2xl"
              />
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-2xl bg-white dark:bg-zinc-950"
              >
                <Link href="/admin/finance">Effacer</Link>
              </Button>
            </div>
          </details>
        </form>
      </AdminCard>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr),22rem]">
        <AdminCard className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Historique</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {data.pagination.filtered} resultat(s)
              </p>
            </div>
            {hasActiveFilters ? (
              <StatusBadge value="GENERAL" label="filtre" />
            ) : null}
          </div>

          <div className="mt-3 space-y-2.5">
            {data.donations.length ? (
              data.donations.map((donation) => {
                const reference = stripeReference(donation)
                const receiptUrl =
                  donation.stripeReceiptUrl ?? donation.stripeHostedInvoiceUrl
                const isDirect = donation.source === "DIRECT"
                const detailHref = isDirect
                  ? `/admin/dons/directs/${donation.id}`
                  : receiptUrl
                const displayDate =
                  (isDirect ? donation.receivedAt : donation.donatedAt) ??
                  donation.createdAt

                return (
                  <article
                    key={donation.id}
                    className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-950/40 sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h4 className="max-w-full truncate font-semibold">
                            {donorName(donation)}
                          </h4>
                          <StatusBadge
                            value={
                              isDirect
                                ? (donation.directStatus ?? "RECORDED")
                                : donation.status
                            }
                            label={
                              isDirect
                                ? (directStatusLabelByValue[
                                    donation.directStatus ?? ""
                                  ] ?? "Direct")
                                : (statusLabelByValue[donation.status] ??
                                  donation.status)
                            }
                            className="px-2 py-0.5 text-[0.65rem]"
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                          <span className="rounded-full bg-white px-2 py-1 dark:bg-white/10">
                            {donation.memberIdSnapshot ??
                              donation.user?.profile?.memberId ??
                              "Invite"}
                          </span>
                          <span className="rounded-full bg-white px-2 py-1 dark:bg-white/10">
                            {donation.category.label}
                          </span>
                          <span className="rounded-full bg-white px-2 py-1 dark:bg-white/10">
                            {isDirect
                              ? (directKindLabelByValue[
                                  donation.directKind ?? ""
                                ] ?? "Don direct")
                              : (frequencyLabelByValue[donation.frequency] ??
                                donation.frequency)}
                          </span>
                          {isDirect && donation.event ? (
                            <span className="rounded-full bg-white px-2 py-1 dark:bg-white/10">
                              {donation.event.title}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {displayDate.toLocaleString("fr-FR")}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-lg font-semibold sm:text-xl">
                          {formatCurrencyFromCents(
                            donation.amountCents,
                            donation.currency,
                          )}
                        </p>
                        {donation.refundedAmountCents > 0 ? (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                            -{" "}
                            {formatCurrencyFromCents(
                              donation.refundedAmountCents,
                              donation.currency,
                            )}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {(reference || detailHref) ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-3 text-xs dark:border-white/10">
                        <span className="font-mono text-zinc-500 dark:text-zinc-400">
                          {isDirect
                            ? (donation.manualReference ??
                              donation.collectionLabel ??
                              "Don direct")
                            : reference
                              ? shortReference(reference)
                              : "Stripe"}
                        </span>
                        {detailHref ? (
                          <Link
                            href={detailHref}
                            target={isDirect ? undefined : "_blank"}
                            rel={isDirect ? undefined : "noreferrer"}
                            className="font-semibold text-amber-700 dark:text-amber-200"
                          >
                            {isDirect ? "Verifier le don" : "Ouvrir le recu"}
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                )
              })
            ) : (
              <EmptyState
                title="Aucun don trouve"
                description="Essayez une autre recherche ou retirez les filtres."
              />
            )}
          </div>
        </AdminCard>

        <div className="space-y-3">
          <AdminCard className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Dons mensuels</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Suivi rapide
                </p>
              </div>
              <span className="rounded-2xl bg-amber-50 p-2 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
                <Repeat className="h-4 w-4" aria-hidden />
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100">
                <p>Actifs</p>
                <p className="mt-2 text-2xl font-semibold">
                  {data.stats.activeMonthlyDonors}
                </p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-3 text-rose-800 dark:bg-rose-500/10 dark:text-rose-100">
                <p>En retard</p>
                <p className="mt-2 text-2xl font-semibold">
                  {data.stats.pastDueMonthlyDonors}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {recurring.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-200 p-3 dark:border-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {item.user.profile?.displayName ?? item.user.email}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.category.label} -{" "}
                        {formatCurrencyFromCents(
                          item.amountCents,
                          item.currency,
                        )}
                      </p>
                    </div>
                    <StatusBadge
                      value={item.status}
                      className="px-2 py-0.5 text-[0.65rem]"
                    />
                  </div>
                </div>
              ))}
              {!recurring.length ? (
                <p className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-500 dark:bg-zinc-950/50 dark:text-zinc-400">
                  Aucun don mensuel pour le moment.
                </p>
              ) : null}
            </div>
          </AdminCard>

          <AdminCard className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Net total</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Depuis le debut
                </p>
              </div>
              <Banknote className="h-5 w-5 text-amber-600" aria-hidden />
            </div>
            <p className="mt-4 text-3xl font-semibold">
              {data.stats.format(data.stats.totals.netCents)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Brut: {data.stats.format(data.stats.totals.grossCents)}</span>
              <span>
                Rembourse:{" "}
                {data.stats.format(data.stats.totals.refundedCents)}
              </span>
            </div>
          </AdminCard>
        </div>
      </section>

      {canManageCategories ? (
        <details className="group rounded-[1.35rem] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:hidden">
            <div>
              <p className="text-sm font-semibold">Categories de don</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Gestion Creator, masquee par defaut.
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
              Modifier
            </span>
          </summary>
          <div className="grid gap-3 border-t border-zinc-200 p-3 dark:border-white/10 lg:grid-cols-2">
            {data.categories.map((category) => (
              <AdminActionForm
                key={category.id}
                action={updateDonationCategoryAction}
                className="space-y-2 rounded-2xl border border-zinc-200 p-3 dark:border-white/10"
              >
                <input type="hidden" name="id" value={category.id} />
                <div className="grid gap-2 sm:grid-cols-[1fr,90px]">
                  <Input
                    name="label"
                    defaultValue={category.label}
                    className="h-10 rounded-xl"
                  />
                  <Input
                    name="sortOrder"
                    type="number"
                    defaultValue={category.sortOrder}
                    className="h-10 rounded-xl"
                  />
                </div>
                <Textarea
                  name="description"
                  defaultValue={category.description ?? ""}
                  className="min-h-16 rounded-xl"
                />
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={category.isActive}
                    />
                    Active
                  </label>
                  <Button size="sm" className="rounded-full">
                    Enregistrer
                  </Button>
                </div>
              </AdminActionForm>
            ))}
          </div>
        </details>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        {data.pagination.hasPreviousPage ? (
          <Button asChild variant="outline" className="rounded-full">
            <Link
              href={buildHref("/admin/finance", {
                ...params,
                page: String(data.pagination.page - 1),
              })}
            >
              Precedent
            </Link>
          </Button>
        ) : (
          <Button variant="outline" disabled className="rounded-full">
            Precedent
          </Button>
        )}
        <span className="text-xs font-medium text-zinc-500 sm:text-sm">
          {data.pagination.page} / {data.pagination.totalPages}
        </span>
        {data.pagination.hasNextPage ? (
          <Button asChild variant="outline" className="rounded-full">
            <Link
              href={buildHref("/admin/finance", {
                ...params,
                page: String(data.pagination.page + 1),
              })}
            >
              Suivant
            </Link>
          </Button>
        ) : (
          <Button variant="outline" disabled className="rounded-full">
            Suivant
          </Button>
        )}
      </div>
    </div>
  )
}

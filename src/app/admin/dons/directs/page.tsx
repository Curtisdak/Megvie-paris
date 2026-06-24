import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  BadgeEuro,
  CheckCircle2,
  Clock3,
  Filter,
  Plus,
  Search,
  XCircle,
} from "lucide-react"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrencyFromCents } from "@/lib/finance/config"
import { listDirectDonations } from "@/lib/finance/direct"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Dons directs",
}

const statusOptions = [
  ["", "Tous les statuts"],
  ["RECORDED", "A verifier"],
  ["VERIFIED", "Verifies"],
  ["CANCELLED", "Annules"],
]

const kindOptions = [
  ["", "Tous les types"],
  ["IDENTIFIED", "Membre identifie"],
  ["ANONYMOUS_COLLECTION", "Collecte anonyme"],
]

const statusLabels: Record<string, string> = {
  RECORDED: "A verifier",
  VERIFIED: "Verifie",
  CANCELLED: "Annule",
}

const kindLabels: Record<string, string> = {
  IDENTIFIED: "Membre",
  ANONYMOUS_COLLECTION: "Collecte",
}

function buildHref(path: string, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value)
  }

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

function displayReceivedDate(value: Date | null, fallback: Date) {
  return (value ?? fallback).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default async function DirectDonationsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string
    kind?: string
    directStatus?: string
    category?: string
    from?: string
    to?: string
    page?: string
  }>
}) {
  const params = (await searchParams) ?? {}
  const data = await listDirectDonations(params)

  return (
    <div className="space-y-4">
      <section className="rounded-[1.35rem] bg-gradient-to-br from-zinc-950 via-amber-950 to-emerald-950 p-5 text-white shadow-xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
              Finance
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Dons directs
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-200">
              Saisie, verification et correction des dons en especes ou
              collectes. Seuls les dons verifies comptent officiellement.
            </p>
          </div>
          <Button
            asChild
            className="h-11 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-100"
          >
            <Link href="/admin/dons/directs/nouveau">
              <Plus className="h-4 w-4" aria-hidden />
              Ajouter un don
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          {
            label: "Total filtre",
            value: data.pagination.total,
            icon: BadgeEuro,
          },
          { label: "A verifier", value: data.statusCounts.recorded, icon: Clock3 },
          { label: "Verifies", value: data.statusCounts.verified, icon: CheckCircle2 },
          { label: "Annules", value: data.statusCounts.cancelled, icon: XCircle },
        ].map((item) => {
          const Icon = item.icon
          return (
            <section
              key={item.label}
              className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {item.label}
                </p>
                <span className="rounded-xl bg-amber-50 p-2 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold">{item.value}</p>
            </section>
          )
        })}
      </div>

      <AdminCard>
        <form className="grid gap-2 lg:grid-cols-[1.2fr,0.85fr,0.85fr,0.85fr,0.7fr,0.7fr,auto]">
          <label className="relative">
            <span className="sr-only">Rechercher</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <Input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Nom, email, ID, collecte..."
              className="h-11 rounded-2xl pl-10"
            />
          </label>
          <select
            name="directStatus"
            defaultValue={params.directStatus ?? ""}
            className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {statusOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="kind"
            defaultValue={params.kind ?? ""}
            className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {kindOptions.map(([value, label]) => (
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
          <Button className="h-11 rounded-2xl">
            <Filter className="h-4 w-4" aria-hidden />
            Filtrer
          </Button>
        </form>
      </AdminCard>

      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Journal des dons directs</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {data.pagination.total} entree(s)
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/admin/finance">Finance</Link>
          </Button>
        </div>

        <div className="mt-4 space-y-2.5">
          {data.donations.length ? (
            data.donations.map((donation) => (
              <Link
                key={donation.id}
                href={`/admin/dons/directs/${donation.id}`}
                className="group block rounded-[1.2rem] border border-zinc-200 bg-zinc-50 p-3 transition hover:border-amber-400 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-zinc-900 sm:p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        value={donation.directStatus ?? "RECORDED"}
                        label={
                          statusLabels[donation.directStatus ?? ""] ??
                          "A verifier"
                        }
                        className="px-2 py-0.5 text-[0.65rem]"
                      />
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                        {kindLabels[donation.directKind ?? ""] ?? "Direct"}
                      </span>
                    </div>
                    <h3 className="mt-3 truncate text-lg font-semibold">
                      {donation.donorNameSnapshot ??
                        donation.collectionLabel ??
                        "Collecte anonyme"}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="rounded-full bg-white px-2.5 py-1 dark:bg-white/10">
                        {donation.memberIdSnapshot ?? "Sans membre"}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 dark:bg-white/10">
                        {donation.category.label}
                      </span>
                      {donation.event ? (
                        <span className="rounded-full bg-white px-2.5 py-1 dark:bg-white/10">
                          {donation.event.title}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      Recu le{" "}
                      {displayReceivedDate(donation.receivedAt, donation.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-3 sm:block sm:text-right">
                    <p className="text-2xl font-semibold">
                      {formatCurrencyFromCents(
                        donation.amountCents,
                        donation.currency,
                      )}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 opacity-100 dark:text-amber-200 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                      Ouvrir
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              title="Aucun don direct"
              description="Ajoutez un don direct ou modifiez vos filtres."
            />
          )}
        </div>
      </AdminCard>

      <div className="flex items-center justify-between gap-2">
        {data.pagination.hasPreviousPage ? (
          <Button asChild variant="outline" className="rounded-full">
            <Link
              href={buildHref("/admin/dons/directs", {
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
        <span className="text-sm font-medium text-zinc-500">
          {data.pagination.page} / {data.pagination.totalPages}
        </span>
        {data.pagination.hasNextPage ? (
          <Button asChild variant="outline" className="rounded-full">
            <Link
              href={buildHref("/admin/dons/directs", {
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

import Link from "next/link"
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  ImageIcon,
  MapPin,
  PencilLine,
  Search,
  Send,
} from "lucide-react"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { EventFormDialog } from "@/components/admin/event-form-dialog"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { listEvents } from "@/lib/admin/data"

const selectClass =
  "h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-zinc-800 dark:bg-zinc-950"

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"

const statusOptions = [
  ["DRAFT", "Brouillon"],
  ["SCHEDULED", "Programme"],
  ["PUBLISHED", "Publie"],
  ["CANCELLED", "Annule"],
  ["ARCHIVED", "Archive"],
] as const

const visibilityOptions = [
  ["PUBLIC", "Public"],
  ["MEMBERS_ONLY", "Membres seulement"],
] as const

const statusLabels = Object.fromEntries(statusOptions) as Record<string, string>
const visibilityLabels = Object.fromEntries(visibilityOptions) as Record<string, string>

function formatDateTime(value: Date | null) {
  if (!value) return null
  return value.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value)
}

function pageWindow(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  return Array.from(
    new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]),
  ).filter((page) => page >= 1 && page <= totalPages)
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string
    status?: string
    visibility?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const { events, counts, pagination } = await listEvents({
    search: params?.q,
    status: params?.status,
    visibility: params?.visibility,
    page: params?.page,
  })
  const hasFilters = Boolean(params?.q || params?.status || params?.visibility)
  const metrics = [
    {
      label: "Total evenements",
      value: counts.total,
      icon: CalendarDays,
      tone:
        "border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white",
    },
    {
      label: "Publies",
      value: counts.published,
      icon: Send,
      tone:
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
    },
    {
      label: "Programmes",
      value: counts.scheduled,
      icon: CalendarClock,
      tone:
        "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100",
    },
    {
      label: "Brouillons",
      value: counts.draft,
      icon: PencilLine,
      tone:
        "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-100",
    },
  ]

  function hrefForPage(page: number) {
    const next = new URLSearchParams()
    if (params?.q) next.set("q", params.q)
    if (params?.status) next.set("status", params.status)
    if (params?.visibility) next.set("visibility", params.visibility)
    if (page > 1) next.set("page", String(page))
    const query = next.toString()
    return query ? `/admin/evenements?${query}` : "/admin/evenements"
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-700 dark:text-orange-200">
            Administration
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Evenements
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Planifiez les cultes, rencontres, activites et evenements visibles
            dans l&apos;application.
          </p>
        </div>
        <EventFormDialog />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div
              key={metric.label}
              className={`rounded-2xl border p-4 shadow-sm ${metric.tone}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium opacity-80">
                  {metric.label}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 shadow-sm dark:bg-white/10">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold">
                {compactNumber(metric.value)}
              </p>
            </div>
          )
        })}
      </section>

      <AdminCard className="p-4 sm:p-5">
        <form className="grid gap-3 lg:grid-cols-[minmax(220px,1fr),180px,190px,auto] lg:items-end">
          <div className="space-y-2">
            <label htmlFor="event-search" className={labelClass}>
              Rechercher
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <Input
                id="event-search"
                name="q"
                placeholder="Titre, lieu, description..."
                defaultValue={params?.q ?? ""}
                className="h-10 rounded-xl pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="event-status-filter" className={labelClass}>
              Statut
            </label>
            <select
              id="event-status-filter"
              name="status"
              defaultValue={params?.status ?? ""}
              className={selectClass}
            >
              <option value="">Tous</option>
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="event-visibility-filter" className={labelClass}>
              Audience
            </label>
            <select
              id="event-visibility-filter"
              name="visibility"
              defaultValue={params?.visibility ?? ""}
              className={selectClass}
            >
              <option value="">Toutes</option>
              {visibilityOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <Button variant="outline" className="h-10 rounded-full">
              <Filter className="h-4 w-4" aria-hidden />
              Filtrer
            </Button>
            {hasFilters ? (
              <Button asChild variant="ghost" className="h-10 rounded-full">
                <Link href="/admin/evenements">Reset</Link>
              </Button>
            ) : null}
          </div>
        </form>
      </AdminCard>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={labelClass}>Liste</p>
          <h3 className="mt-1 text-2xl font-semibold">
            {compactNumber(pagination.filtered)} evenement
            {pagination.filtered > 1 ? "s" : ""}
          </h3>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Page {pagination.page} sur {pagination.totalPages}
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="Aucun evenement"
          description="Aucun evenement ne correspond aux filtres actuels."
        />
      ) : (
        <div className="grid gap-3">
          {events.map((event) => {
            const startsAt = formatDateTime(event.startsAt)
            const endsAt = formatDateTime(event.endsAt)
            const publishedAt = formatDateTime(event.publishedAt)
            return (
              <AdminCard key={event.id} className="p-0">
                <div className="grid overflow-hidden rounded-2xl lg:grid-cols-[150px,minmax(0,1fr),180px]">
                  <div className="min-h-36 bg-zinc-100 dark:bg-zinc-950 lg:min-h-full">
                    {event.coverImageUrl ? (
                      <div
                        className="h-full min-h-36 bg-cover bg-center"
                        style={{ backgroundImage: `url("${event.coverImageUrl}")` }}
                        aria-hidden
                      />
                    ) : (
                      <div className="flex h-full min-h-36 items-center justify-center bg-zinc-100 dark:bg-zinc-950">
                        <ImageIcon
                          className="h-8 w-8 text-zinc-400"
                          aria-hidden
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        value={event.status}
                        label={statusLabels[event.status]}
                      />
                      <StatusBadge
                        value={event.visibility}
                        label={visibilityLabels[event.visibility]}
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold leading-tight">
                        {event.title}
                      </h4>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {event.shortDescription ||
                          "Aucun resume court renseigne."}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm text-zinc-500 dark:text-zinc-400 sm:grid-cols-2">
                      <span className="inline-flex items-center gap-2">
                        <CalendarClock className="h-4 w-4" aria-hidden />
                        {startsAt}
                      </span>
                      {endsAt ? (
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock className="h-4 w-4" aria-hidden />
                          Fin {endsAt}
                        </span>
                      ) : null}
                      {event.locationName ? (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" aria-hidden />
                          {event.locationName}
                        </span>
                      ) : null}
                      {publishedAt ? (
                        <span className="inline-flex items-center gap-2">
                          <Send className="h-4 w-4" aria-hidden />
                          Publie {publishedAt}
                        </span>
                      ) : null}
                      {event.registrationUrl ? (
                        <span className="inline-flex items-center gap-2 truncate">
                          <ExternalLink
                            className="h-4 w-4 shrink-0"
                            aria-hidden
                          />
                          <span className="truncate">
                            Lien d&apos;inscription
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50 lg:border-l lg:border-t-0">
                    <Button asChild variant="outline" className="w-full rounded-full">
                      <Link href={`/admin/evenements/${event.id}`}>
                        Modifier
                      </Link>
                    </Button>
                    <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      Mis a jour le {formatDateTime(event.updatedAt)}.
                    </p>
                  </div>
                </div>
              </AdminCard>
            )
          })}
        </div>
      )}

      <nav
        aria-label="Pagination des evenements"
        className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {compactNumber(pagination.filtered)} resultat
          {pagination.filtered > 1 ? "s" : ""} - {pagination.pageSize} par page
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild={pagination.hasPreviousPage}
            variant="outline"
            className="h-9 rounded-full"
            disabled={!pagination.hasPreviousPage}
          >
            {pagination.hasPreviousPage ? (
              <Link href={hrefForPage(pagination.page - 1)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Precedent
              </Link>
            ) : (
              <span>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Precedent
              </span>
            )}
          </Button>

          {pageWindow(pagination.page, pagination.totalPages).map((page) => (
            <Button
              key={page}
              asChild={page !== pagination.page}
              variant={page === pagination.page ? "default" : "outline"}
              className="h-9 min-w-9 rounded-full px-3"
            >
              {page === pagination.page ? (
                <span>{page}</span>
              ) : (
                <Link href={hrefForPage(page)}>{page}</Link>
              )}
            </Button>
          ))}

          <Button
            asChild={pagination.hasNextPage}
            variant="outline"
            className="h-9 rounded-full"
            disabled={!pagination.hasNextPage}
          >
            {pagination.hasNextPage ? (
              <Link href={hrefForPage(pagination.page + 1)}>
                Suivant
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : (
              <span>
                Suivant
                <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            )}
          </Button>
        </div>
      </nav>
    </div>
  )
}

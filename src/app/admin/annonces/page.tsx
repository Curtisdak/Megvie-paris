import Link from "next/link"
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Filter,
  Globe2,
  ImageIcon,
  Megaphone,
  PencilLine,
  Search,
  Send,
  UsersRound,
} from "lucide-react"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { AnnouncementFormDialog } from "@/components/admin/announcement-form-dialog"
import { DeleteSubmitButton } from "@/components/admin/delete-submit-button"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  deleteAnnouncementAction,
  updateAnnouncementStatusAction,
} from "@/lib/admin/actions"
import { listAnnouncements } from "@/lib/admin/data"

const selectClass =
  "h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-zinc-800 dark:bg-zinc-950"

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"

const categoryOptions = [
  ["GENERAL", "General"],
  ["EMPLOI", "Emploi"],
  ["MARIAGE", "Mariage"],
  ["BAPTEME", "Bapteme"],
  ["EVENEMENT", "Evenement"],
  ["BON_PLAN", "Bon plan"],
  ["URGENT", "Urgent"],
] as const

const visibilityOptions = [
  ["PUBLIC", "Public"],
  ["MEMBERS_ONLY", "Membres seulement"],
] as const

const statusOptions = [
  ["DRAFT", "Brouillon"],
  ["SCHEDULED", "Programme"],
  ["PUBLISHED", "Publie"],
  ["ARCHIVED", "Archive"],
] as const

const statusLabels = Object.fromEntries(statusOptions) as Record<string, string>
const visibilityLabels = Object.fromEntries(visibilityOptions) as Record<string, string>
const categoryLabels = Object.fromEntries(categoryOptions) as Record<string, string>

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

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string
    status?: string
    visibility?: string
    category?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const { announcements, counts, pagination } = await listAnnouncements({
    search: params?.q,
    status: params?.status,
    visibility: params?.visibility,
    category: params?.category,
    page: params?.page,
  })
  const hasFilters = Boolean(
    params?.q || params?.status || params?.visibility || params?.category,
  )
  const metrics = [
    {
      label: "Total annonces",
      value: counts.total,
      icon: Megaphone,
      tone:
        "border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white",
    },
    {
      label: "Publiees",
      value: counts.published,
      icon: Send,
      tone:
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
    },
    {
      label: "Programmees",
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
    if (params?.category) next.set("category", params.category)
    if (page > 1) next.set("page", String(page))
    const query = next.toString()
    return query ? `/admin/annonces?${query}` : "/admin/annonces"
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-700 dark:text-orange-200">
            Administration
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Annonces
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Recherchez, filtrez, publiez et archivez les annonces visibles dans
            l&apos;application.
          </p>
        </div>
        <AnnouncementFormDialog />
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
        <form className="grid gap-3 lg:grid-cols-[minmax(220px,1fr),170px,190px,190px,auto] lg:items-end">
          <div className="space-y-2">
            <label htmlFor="announcement-search" className={labelClass}>
              Rechercher
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <Input
                id="announcement-search"
                name="q"
                placeholder="Titre, resume, contenu..."
                defaultValue={params?.q ?? ""}
                className="h-10 rounded-xl pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="announcement-status-filter" className={labelClass}>
              Statut
            </label>
            <select
              id="announcement-status-filter"
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
            <label htmlFor="announcement-visibility-filter" className={labelClass}>
              Audience
            </label>
            <select
              id="announcement-visibility-filter"
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

          <div className="space-y-2">
            <label htmlFor="announcement-category-filter" className={labelClass}>
              Categorie
            </label>
            <select
              id="announcement-category-filter"
              name="category"
              defaultValue={params?.category ?? ""}
              className={selectClass}
            >
              <option value="">Toutes</option>
              {categoryOptions.map(([value, label]) => (
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
                <Link href="/admin/annonces">Reset</Link>
              </Button>
            ) : null}
          </div>
        </form>
      </AdminCard>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={labelClass}>Liste</p>
          <h3 className="mt-1 text-2xl font-semibold">
            {compactNumber(pagination.filtered)} annonce
            {pagination.filtered > 1 ? "s" : ""}
          </h3>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Page {pagination.page} sur {pagination.totalPages}
        </p>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          title="Aucune annonce"
          description="Aucune annonce ne correspond aux filtres actuels."
        />
      ) : (
        <div className="grid gap-3">
          {announcements.map((announcement) => {
            const publishedAt = formatDateTime(announcement.publishedAt)
            const publishAt = formatDateTime(announcement.publishAt)
            const expiresAt = formatDateTime(announcement.expiresAt)
            return (
              <AdminCard key={announcement.id} className="p-0">
                <div className="grid overflow-hidden rounded-2xl lg:grid-cols-[150px,minmax(0,1fr),230px]">
                  <div className="min-h-36 bg-zinc-100 dark:bg-zinc-950 lg:min-h-full">
                    {announcement.coverImageUrl ? (
                      <div
                        className="h-full min-h-36 bg-cover bg-center"
                        style={{
                          backgroundImage: `url("${announcement.coverImageUrl}")`,
                        }}
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
                        value={announcement.status}
                        label={statusLabels[announcement.status]}
                      />
                      <StatusBadge
                        value={announcement.visibility}
                        label={visibilityLabels[announcement.visibility]}
                      />
                      <StatusBadge
                        value={announcement.category}
                        label={categoryLabels[announcement.category]}
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold leading-tight">
                        {announcement.title}
                      </h4>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {announcement.summary || "Aucun resume court renseigne."}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm text-zinc-500 dark:text-zinc-400 sm:grid-cols-2">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-4 w-4" aria-hidden />
                        {formatDateTime(announcement.updatedAt)}
                      </span>
                      {publishedAt ? (
                        <span className="inline-flex items-center gap-2">
                          <Eye className="h-4 w-4" aria-hidden />
                          {publishedAt}
                        </span>
                      ) : null}
                      {publishAt ? (
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock className="h-4 w-4" aria-hidden />
                          {publishAt}
                        </span>
                      ) : null}
                      {expiresAt ? (
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock className="h-4 w-4" aria-hidden />
                          Expire {expiresAt}
                        </span>
                      ) : null}
                      {announcement.externalUrl ? (
                        <span className="inline-flex items-center gap-2 truncate">
                          <Globe2 className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="truncate">{announcement.externalUrl}</span>
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-2">
                        <UsersRound className="h-4 w-4" aria-hidden />
                        {visibilityLabels[announcement.visibility]}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50 lg:border-l lg:border-t-0">
                    <AdminActionForm
                      action={updateAnnouncementStatusAction}
                      className="space-y-3"
                    >
                      <input type="hidden" name="id" value={announcement.id} />
                      <label
                        htmlFor={`status-${announcement.id}`}
                        className={labelClass}
                      >
                        Statut
                      </label>
                      <select
                        id={`status-${announcement.id}`}
                        name="status"
                        defaultValue={announcement.status}
                        className={selectClass}
                      >
                        {statusOptions.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-start gap-2 rounded-2xl border border-zinc-200 bg-white p-3 text-xs leading-5 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                        <Checkbox name="notifyPush" className="mt-0.5" />
                        <span>
                          Notifier a la publication. Les doublons sont
                          bloques automatiquement.
                        </span>
                      </label>
                      <Button variant="outline" className="w-full rounded-full">
                        Mettre a jour
                      </Button>
                    </AdminActionForm>
                    <AdminActionForm action={deleteAnnouncementAction} className="mt-3">
                      <input type="hidden" name="id" value={announcement.id} />
                      <DeleteSubmitButton
                        disabled={announcement.status === "ARCHIVED"}
                        confirmMessage={`Supprimer l'annonce "${announcement.title}" ?`}
                      />
                    </AdminActionForm>
                  </div>
                </div>
              </AdminCard>
            )
          })}
        </div>
      )}

      <nav
        aria-label="Pagination des annonces"
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

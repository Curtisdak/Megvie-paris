import Link from "next/link"
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  XCircle,
} from "lucide-react"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { DeleteSubmitButton } from "@/components/admin/delete-submit-button"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  cancelNotificationCampaignAction,
  deleteNotificationCampaignAction,
  retryNotificationCampaignAction,
  sendAdminTestNotificationAction,
} from "@/lib/notifications/admin-actions"
import { listNotificationCampaigns } from "@/lib/notifications/admin"

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"

const selectClass =
  "h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-zinc-800 dark:bg-zinc-950"

const typeOptions = [
  ["DAILY_VERSE", "Verset"],
  ["BIRTHDAY", "Anniversaire"],
  ["ANNOUNCEMENT", "Annonce"],
  ["EVENT_PUBLISHED", "Evenement"],
  ["EVENT_REMINDER", "Rappel"],
  ["EVENT_CANCELLED", "Annulation"],
  ["PERSONAL", "Personnel"],
  ["STAFF_NEW_MESSAGE", "Message equipe"],
  ["STAFF_CONFIDENTIAL_MESSAGE", "Confidentiel"],
  ["SYSTEM", "Systeme"],
  ["TEST", "Test"],
] as const

const statusOptions = [
  ["SCHEDULED", "Programme"],
  ["PENDING", "En attente"],
  ["PROCESSING", "En cours"],
  ["COMPLETED", "Termine"],
  ["PARTIAL", "Partiel"],
  ["FAILED", "Echec"],
  ["CANCELLED", "Annule"],
] as const

const typeLabels = Object.fromEntries(typeOptions) as Record<string, string>
const statusLabels = Object.fromEntries(statusOptions) as Record<string, string>

function formatDate(value: Date | null) {
  if (!value) return "-"
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

function pageHref(
  page: number,
  params?: {
    type?: string
    status?: string
    source?: string
    from?: string
    to?: string
  },
) {
  const next = new URLSearchParams()
  if (params?.type) next.set("type", params.type)
  if (params?.status) next.set("status", params.status)
  if (params?.source) next.set("source", params.source)
  if (params?.from) next.set("from", params.from)
  if (params?.to) next.set("to", params.to)
  if (page > 1) next.set("page", String(page))
  const query = next.toString()
  return query ? `/admin/notifications?${query}` : "/admin/notifications"
}

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    type?: string
    status?: string
    source?: string
    from?: string
    to?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const data = await listNotificationCampaigns(params)
  const hasFilters = Boolean(
    params?.type || params?.status || params?.source || params?.from || params?.to,
  )
  const metrics = [
    {
      label: "Campagnes",
      value: data.counts.total,
      icon: Bell,
      tone: "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
    },
    {
      label: "En attente",
      value: data.counts.pending,
      icon: CalendarClock,
      tone:
        "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100",
    },
    {
      label: "Acceptees",
      value: data.counts.completed,
      icon: CheckCircle2,
      tone:
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
    },
    {
      label: "A verifier",
      value: data.counts.partial + data.counts.failed,
      icon: ShieldAlert,
      tone:
        "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-100",
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-700 dark:text-orange-200">
            Administration
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Notifications
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Suivez les campagnes, les tentatives acceptees par les services push
            et les echecs techniques sans exposer les cles des appareils.
          </p>
        </div>
        <form action={sendAdminTestNotificationAction}>
          <Button className="h-11 rounded-full px-5">
            <Send className="h-4 w-4" aria-hidden />
            Test sur mon appareil
          </Button>
        </form>
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
        <form className="grid gap-3 lg:grid-cols-[160px,160px,minmax(180px,1fr),150px,150px,auto] lg:items-end">
          <div className="space-y-2">
            <label htmlFor="type" className={labelClass}>
              Type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={params?.type ?? ""}
              className={selectClass}
            >
              <option value="">Tous</option>
              {typeOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="status" className={labelClass}>
              Statut
            </label>
            <select
              id="status"
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
            <label htmlFor="source" className={labelClass}>
              Source
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <Input
                id="source"
                name="source"
                defaultValue={params?.source ?? ""}
                placeholder="message, annonce, titre..."
                className="h-10 rounded-xl pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="from" className={labelClass}>
              Depuis
            </label>
            <Input
              id="from"
              name="from"
              type="date"
              defaultValue={params?.from ?? ""}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="to" className={labelClass}>
              Jusqu&apos;a
            </label>
            <Input
              id="to"
              name="to"
              type="date"
              defaultValue={params?.to ?? ""}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <Button variant="outline" className="h-10 rounded-full">
              <Filter className="h-4 w-4" aria-hidden />
              Filtrer
            </Button>
            {hasFilters ? (
              <Button asChild variant="ghost" className="h-10 rounded-full">
                <Link href="/admin/notifications">Reset</Link>
              </Button>
            ) : null}
          </div>
        </form>
      </AdminCard>

      {data.campaigns.length === 0 ? (
        <EmptyState
          title="Aucune campagne"
          description="Aucune notification ne correspond aux filtres actuels."
        />
      ) : (
        <div className="grid gap-3">
          {data.campaigns.map((campaign) => (
            <AdminCard key={campaign.id} className="p-0">
              <div className="grid gap-0 overflow-hidden rounded-2xl lg:grid-cols-[minmax(0,1fr),280px]">
                <div className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      value={campaign.type}
                      label={typeLabels[campaign.type]}
                    />
                    <StatusBadge
                      value={campaign.status}
                      label={statusLabels[campaign.status] ?? campaign.status}
                    />
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {campaign.audienceType.toLowerCase().replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">
                      {campaign.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {campaign.body}
                    </p>
                  </div>
                  <div className="grid gap-2 text-sm text-zinc-500 dark:text-zinc-400 sm:grid-cols-2">
                    <span>Source: {campaign.sourceType ?? "-"}</span>
                    <span>Creee: {formatDate(campaign.createdAt)}</span>
                    <span>Planifiee: {formatDate(campaign.scheduledFor)}</span>
                    <span>Terminee: {formatDate(campaign.completedAt)}</span>
                  </div>
                  {campaign.errorSummary.length ? (
                    <div className="rounded-2xl border border-orange-100 bg-orange-50 p-3 text-xs text-orange-900 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-100">
                      {campaign.errorSummary.map(([code, count]) => (
                        <span key={code} className="mr-3 inline-block">
                          {code}: {count}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50 lg:border-l lg:border-t-0">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Metric label="Dest." value={campaign.recipientCount} />
                    <Metric label="Lues" value={campaign.readCount} />
                    <Metric
                      label="Acceptees"
                      value={campaign.deliveryCounts.accepted}
                    />
                    <Metric
                      label="Echecs"
                      value={campaign.deliveryCounts.failed}
                    />
                    <Metric
                      label="Expirees"
                      value={campaign.deliveryCounts.expired}
                    />
                    <Metric
                      label="Ignorees"
                      value={campaign.deliveryCounts.skipped}
                    />
                  </div>

                  <div className="mt-4 grid gap-2">
                    <form action={retryNotificationCampaignAction}>
                      <input
                        type="hidden"
                        name="campaignId"
                        value={campaign.id}
                      />
                      <Button
                        variant="outline"
                        className="w-full rounded-full"
                        disabled={campaign.deliveryCounts.failed === 0}
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Relancer echecs
                      </Button>
                    </form>
                    <form action={cancelNotificationCampaignAction}>
                      <input
                        type="hidden"
                        name="campaignId"
                        value={campaign.id}
                      />
                      <Button
                        variant="ghost"
                        className="w-full rounded-full text-red-600 hover:text-red-700"
                        disabled={[
                          "COMPLETED",
                          "PARTIAL",
                          "FAILED",
                          "CANCELLED",
                        ].includes(campaign.status)}
                      >
                        <XCircle className="h-4 w-4" aria-hidden />
                        Annuler
                      </Button>
                    </form>
                    <form action={deleteNotificationCampaignAction}>
                      <input
                        type="hidden"
                        name="campaignId"
                        value={campaign.id}
                      />
                      <DeleteSubmitButton
                        confirmMessage={`Supprimer la notification "${campaign.title}" ?`}
                      />
                    </form>
                  </div>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <nav className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {compactNumber(data.pagination.filtered)} resultat
          {data.pagination.filtered > 1 ? "s" : ""} - {data.pagination.pageSize} par page
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild={data.pagination.hasPreviousPage}
            variant="outline"
            className="h-9 rounded-full"
            disabled={!data.pagination.hasPreviousPage}
          >
            {data.pagination.hasPreviousPage ? (
              <Link href={pageHref(data.pagination.page - 1, params)}>
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
          <Button
            asChild={data.pagination.hasNextPage}
            variant="outline"
            className="h-9 rounded-full"
            disabled={!data.pagination.hasNextPage}
          >
            {data.pagination.hasNextPage ? (
              <Link href={pageHref(data.pagination.page + 1, params)}>
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-3 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-semibold">{compactNumber(value)}</p>
    </div>
  )
}

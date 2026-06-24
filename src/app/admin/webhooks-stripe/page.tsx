import { RefreshCcw } from "lucide-react"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { retryStripeWebhookEventAction } from "@/lib/finance/actions"
import { listStripeWebhookEvents } from "@/lib/finance/data"

export default async function StripeWebhooksPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; type?: string }>
}) {
  const params = (await searchParams) ?? {}
  const events = await listStripeWebhookEvents(params)

  return (
    <div className="space-y-4">
      <AdminCard className="bg-gradient-to-br from-zinc-950 to-zinc-800 text-white dark:from-zinc-900 dark:to-zinc-950">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">
          Stripe
        </p>
        <h2 className="mt-3 text-3xl font-semibold">Webhooks Stripe</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">
          Suivi operationnel des evenements verifies. Le payload complet et les
          secrets ne sont jamais affiches.
        </p>
      </AdminCard>

      <AdminCard>
        <form className="grid gap-2 sm:grid-cols-[1fr,180px,auto]">
          <input
            name="type"
            defaultValue={params.type ?? ""}
            placeholder="Type d'evenement"
            className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          />
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="">Tous statuts</option>
            <option value="FAILED">Echoues</option>
            <option value="PROCESSED">Traites</option>
            <option value="IGNORED">Ignores</option>
            <option value="PROCESSING">En traitement</option>
          </select>
          <Button className="h-11 rounded-2xl">Filtrer</Button>
        </form>
      </AdminCard>

      <div className="space-y-3">
        {events.length ? (
          events.map((event) => (
            <article
              key={event.id}
              className="rounded-[1.35rem] border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{event.eventType}</h3>
                    <StatusBadge value={event.processingStatus} />
                  </div>
                  <p className="mt-2 break-all text-xs text-zinc-500">
                    {event.stripeEventId}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Objet: {event.stripeObjectId ?? "n/a"} - Tentatives:{" "}
                    {event.attemptCount}
                  </p>
                  {event.lastErrorCode ? (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                      {event.lastErrorCode}
                    </p>
                  ) : null}
                </div>
                <div className="text-sm text-zinc-500 sm:text-right">
                  <p>{event.receivedAt.toLocaleString("fr-FR")}</p>
                  <p>{event.livemode ? "Live" : "Test"}</p>
                  {event.processingStatus === "FAILED" ? (
                    <AdminActionForm
                      action={retryStripeWebhookEventAction}
                      className="mt-3"
                    >
                      <input type="hidden" name="id" value={event.id} />
                      <Button size="sm" className="rounded-full">
                        <RefreshCcw className="h-4 w-4" aria-hidden />
                        Relancer
                      </Button>
                    </AdminActionForm>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            title="Aucun webhook"
            description="Les evenements Stripe apparaitront apres configuration du endpoint."
          />
        )}
      </div>
    </div>
  )
}

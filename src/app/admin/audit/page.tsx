import { Search } from "lucide-react"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { listAuditLogs } from "@/lib/admin/data"

export default async function AuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ action?: string; entityType?: string }>
}) {
  const params = await searchParams
  const logs = await listAuditLogs({
    action: params?.action,
    entityType: params?.entityType,
  })

  return (
    <div className="space-y-5">
      <AdminCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-200">
              Audit
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Journal d&apos;activite</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Lecture seule. Les secrets, tokens et contenus confidentiels
              complets ne doivent jamais etre stockes ici.
            </p>
          </div>
          <form className="grid gap-2 sm:grid-cols-[1fr,1fr,auto] lg:min-w-[560px]">
            <Input name="action" placeholder="Action" defaultValue={params?.action ?? ""} />
            <Input
              name="entityType"
              placeholder="Type entite"
              defaultValue={params?.entityType ?? ""}
            />
            <Button variant="outline">
              <Search className="h-4 w-4" aria-hidden />
              Filtrer
            </Button>
          </form>
        </div>
      </AdminCard>

      {logs.length === 0 ? (
        <EmptyState
          title="Aucun audit visible"
          description="Les actions sensibles apparaitront ici apres leur execution."
        />
      ) : (
        <AdminCard>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {logs.map((log) => (
              <div key={log.id} className="grid gap-2 py-4 lg:grid-cols-[220px,1fr,180px]">
                <div>
                  <p className="font-semibold">{log.action}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {log.entityType}
                  </p>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  <p>{log.summary ?? "Action enregistree."}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Acteur:{" "}
                    {log.actor?.profile?.displayName ||
                      [log.actor?.firstName, log.actor?.lastName].filter(Boolean).join(" ") ||
                      log.actor?.email ||
                      "Systeme"}
                  </p>
                </div>
                <time className="text-sm text-zinc-500 dark:text-zinc-400">
                  {log.createdAt.toLocaleString("fr-FR")}
                </time>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </div>
  )
}

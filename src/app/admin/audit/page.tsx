import { Search } from "lucide-react"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminPageHero } from "@/components/admin/admin-page-hero"
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
      <AdminPageHero
        eyebrow="Sécurité"
        title="Journal d'activité"
        description="Lecture seule. Les secrets, tokens et contenus confidentiels complets ne sont jamais stockés ici."
      />

      <AdminFilterBar description="Filtrez le journal par type d'action ou type d'entité.">
          <form className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <Input
              name="action"
              placeholder="Action"
              defaultValue={params?.action ?? ""}
              className="h-10 rounded-xl"
            />
            <Input
              name="entityType"
              placeholder="Type entite"
              defaultValue={params?.entityType ?? ""}
              className="h-10 rounded-xl"
            />
            <Button className="h-10">
              <Search className="h-4 w-4" aria-hidden />
              Filtrer
            </Button>
          </form>
      </AdminFilterBar>

      {logs.length === 0 ? (
        <EmptyState
          title="Aucun audit visible"
          description="Les actions sensibles apparaitront ici apres leur execution."
        />
      ) : (
        <AdminCard>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {logs.map((log) => (
              <div key={log.id} className="grid gap-2 py-4 xl:grid-cols-[220px_1fr_180px]">
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

import Link from "next/link"
import { Search } from "lucide-react"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { listMessages } from "@/lib/admin/data"

export default async function MessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string; confidentiality?: string }>
}) {
  const params = await searchParams
  const messages = await listMessages({
    search: params?.q,
    status: params?.status,
    confidentiality: params?.confidentiality,
  })

  return (
    <div className="space-y-5">
      <AdminCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-200">
              Messages
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Boite de reception</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Les reponses email restent en brouillon tant qu&apos;aucun provider
              email n&apos;est configure.
            </p>
          </div>
          <form className="grid gap-2 md:grid-cols-[1fr,150px,180px,auto] lg:min-w-[720px]">
            <Input
              name="q"
              placeholder="Nom, email, sujet..."
              defaultValue={params?.q ?? ""}
              className="h-10 rounded-xl"
            />
            <select
              name="status"
              defaultValue={params?.status ?? ""}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">Tous statuts</option>
              <option value="NEW">Nouveaux</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="ANSWERED">Repondus</option>
              <option value="ARCHIVED">Archives</option>
            </select>
            <select
              name="confidentiality"
              defaultValue={params?.confidentiality ?? ""}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">Toutes confidentialites</option>
              <option value="GENERAL">General</option>
              <option value="PASTORAL_CONFIDENTIAL">Pastoral confidentiel</option>
            </select>
            <Button variant="outline" className="h-10 rounded-full">
              <Search className="h-4 w-4" aria-hidden />
              Filtrer
            </Button>
          </form>
        </div>
      </AdminCard>

      {messages.length === 0 ? (
        <EmptyState
          title="Aucun message"
          description="Les messages du formulaire contact apparaitront ici."
        />
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <AdminCard key={message.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{message.subject}</h3>
                    <StatusBadge value={message.status} />
                    <StatusBadge value={message.confidentiality} />
                  </div>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {message.senderName} - {message.senderEmail} -{" "}
                    {message.createdAt.toLocaleString("fr-FR")}
                  </p>
                </div>
                <Button asChild variant="outline" className="w-full rounded-full lg:w-auto">
                  <Link href={`/admin/messages/${message.id}`}>Ouvrir</Link>
                </Button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}

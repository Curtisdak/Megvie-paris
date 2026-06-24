import { notFound } from "next/navigation"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { AdminCard } from "@/components/admin/admin-card"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  addMessageNoteAction,
  addMessageReplyDraftAction,
  updateMessageStatusAction,
} from "@/lib/admin/actions"
import { getMessageDetail } from "@/lib/admin/data"

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const message = await getMessageDetail(id)

  if (!message) notFound()

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr,420px]">
      <div className="space-y-5">
        <AdminCard>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold">{message.subject}</h2>
            <StatusBadge value={message.status} />
            <StatusBadge value={message.confidentiality} />
          </div>
          <dl className="mt-4 grid gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Expediteur
              </dt>
              <dd>{message.senderName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Email
              </dt>
              <dd>{message.senderEmail}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Telephone
              </dt>
              <dd>{message.senderPhone ?? "Non renseigne"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Recu
              </dt>
              <dd>{message.createdAt.toLocaleString("fr-FR")}</dd>
            </div>
          </dl>
          <div className="mt-5 whitespace-pre-wrap rounded-2xl bg-zinc-50 p-4 text-sm leading-6 dark:bg-zinc-950/50">
            {message.body}
          </div>
        </AdminCard>

        <AdminCard>
          <h3 className="text-lg font-semibold">Historique</h3>
          <div className="mt-4 space-y-3">
            {[...message.notes, ...message.replies]
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <p className="font-medium">
                    {"deliveryStatus" in entry
                      ? `Brouillon reponse - ${entry.deliveryStatus}`
                      : "Note interne"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
                    {entry.body}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
                    {entry.createdAt.toLocaleString("fr-FR")}
                  </p>
                </div>
              ))}
          </div>
        </AdminCard>
      </div>

      <aside className="space-y-5">
        <AdminCard>
          <h3 className="text-lg font-semibold">Statut</h3>
          <AdminActionForm action={updateMessageStatusAction} className="mt-4 space-y-3">
            <input type="hidden" name="messageId" value={message.id} />
            <select
              name="status"
              defaultValue={message.status}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="NEW">Nouveau</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="ANSWERED">Repondu</option>
              <option value="ARCHIVED">Archive</option>
            </select>
            <Button className="w-full rounded-full">Mettre a jour</Button>
          </AdminActionForm>
        </AdminCard>

        <AdminCard>
          <h3 className="text-lg font-semibold">Note interne</h3>
          <AdminActionForm action={addMessageNoteAction} className="mt-4 space-y-3">
            <input type="hidden" name="messageId" value={message.id} />
            <Textarea name="body" rows={5} required />
            <Button className="w-full rounded-full" variant="outline">
              Ajouter la note
            </Button>
          </AdminActionForm>
        </AdminCard>

        <AdminCard>
          <h3 className="text-lg font-semibold">Brouillon de reponse</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Aucun provider email n&apos;est configure, donc rien n&apos;est envoye.
          </p>
          <AdminActionForm action={addMessageReplyDraftAction} className="mt-4 space-y-3">
            <input type="hidden" name="messageId" value={message.id} />
            <input type="hidden" name="deliveryStatus" value="DRAFT" />
            <Textarea name="body" rows={7} required />
            <Button className="w-full rounded-full">Enregistrer le brouillon</Button>
          </AdminActionForm>
        </AdminCard>
      </aside>
    </div>
  )
}

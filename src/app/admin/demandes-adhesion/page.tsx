import { Check, Search, X } from "lucide-react"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  approveMemberAdminAction,
  rejectMemberAction,
} from "@/lib/admin/actions"
import { listPendingApplications } from "@/lib/admin/data"

export default async function MembershipRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const applications = await listPendingApplications(params?.q)

  return (
    <div className="space-y-5">
      <AdminCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-200">
              Adhesions
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Demandes en attente
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              L&apos;approbation genere l&apos;identifiant permanent Mv00001P dans la
              transaction existante.
            </p>
          </div>
          <form className="flex w-full gap-2 md:max-w-sm">
            <Input name="q" placeholder="Nom, email, ID..." defaultValue={params?.q ?? ""} />
            <Button type="submit" variant="outline" aria-label="Rechercher">
              <Search className="h-4 w-4" aria-hidden />
            </Button>
          </form>
        </div>
      </AdminCard>

      {applications.length === 0 ? (
        <EmptyState
          title="Aucune demande en attente"
          description="Les nouvelles inscriptions verifiees apparaitront ici."
        />
      ) : (
        <div className="grid gap-4">
          {applications.map((member) => (
            <AdminCard key={member.id}>
              <div className="grid gap-4 lg:grid-cols-[1fr,360px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {[member.firstName, member.lastName].filter(Boolean).join(" ") ||
                        member.email}
                    </h3>
                    <StatusBadge value={member.membershipStatus} />
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                        Email
                      </dt>
                      <dd>{member.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                        Telephone
                      </dt>
                      <dd>{member.privateDetails?.phone ?? "Non renseigne"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                        Ville
                      </dt>
                      <dd>{member.privateDetails?.city ?? "Non renseignee"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                        Inscription
                      </dt>
                      <dd>{member.createdAt.toLocaleDateString("fr-FR")}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-3 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-950/40">
                  <AdminActionForm action={approveMemberAdminAction}>
                    <input type="hidden" name="userId" value={member.id} />
                    <Button className="w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-500">
                      <Check className="h-4 w-4" aria-hidden />
                      Approuver
                    </Button>
                  </AdminActionForm>

                  <AdminActionForm action={rejectMemberAction} className="space-y-2">
                    <input type="hidden" name="userId" value={member.id} />
                    <Textarea
                      name="reason"
                      placeholder="Raison du refus"
                      className="min-h-20"
                      required
                    />
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4" aria-hidden />
                      Refuser
                    </Button>
                  </AdminActionForm>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}

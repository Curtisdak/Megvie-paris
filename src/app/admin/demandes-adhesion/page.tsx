import { Check, Search, X } from "lucide-react"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminPageHero } from "@/components/admin/admin-page-hero"
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
      <AdminPageHero
        eyebrow="Adhésions"
        title="Demandes en attente"
        description="Validez les inscriptions et attribuez automatiquement un identifiant membre permanent."
      />

      <AdminFilterBar title="Rechercher une demande" description="Trouvez une demande par nom, email ou identifiant.">
          <form className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-2 md:max-w-sm">
            <Input
              name="q"
              placeholder="Nom, email, ID..."
              defaultValue={params?.q ?? ""}
              className="h-10 rounded-xl"
            />
            <Button type="submit" aria-label="Rechercher" className="h-10">
              <Search className="h-4 w-4" aria-hidden />
            </Button>
          </form>
      </AdminFilterBar>

      {applications.length === 0 ? (
        <EmptyState
          title="Aucune demande en attente"
          description="Les nouvelles inscriptions verifiees apparaitront ici."
        />
      ) : (
        <div className="grid gap-4">
          {applications.map((member) => (
            <AdminCard key={member.id}>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
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

                <div className="space-y-3 border-l border-zinc-200 pl-4 dark:border-white/10">
                  <AdminActionForm action={approveMemberAdminAction}>
                    <input type="hidden" name="userId" value={member.id} />
                    <Button className="w-full rounded-lg bg-emerald-600 text-white shadow-none hover:bg-emerald-500">
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
                      className="w-full rounded-lg border-red-200 text-red-700 shadow-none hover:bg-red-50 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10"
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

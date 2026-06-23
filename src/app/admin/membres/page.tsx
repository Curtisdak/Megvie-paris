import { Search } from "lucide-react"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateMemberStatusAction } from "@/lib/admin/actions"
import { listMembers } from "@/lib/admin/data"
import { hasPermission } from "@/lib/auth/permissions"

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string; role?: string }>
}) {
  const params = await searchParams
  const data = await listMembers({
    search: params?.q,
    status: params?.status,
    role: params?.role,
  })
  const canSuspend = hasPermission(data.actorRole, "members.suspend")

  return (
    <div className="space-y-5">
      <AdminCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-200">
              Repertoire
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Membres</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Les champs sensibles sont charges uniquement pour Master et
              Creator.
            </p>
          </div>
          <form className="grid gap-2 md:grid-cols-[1fr,150px,130px,auto] lg:min-w-[680px]">
            <Input
              name="q"
              placeholder="Nom, email, ID..."
              defaultValue={params?.q ?? ""}
              className="h-10 rounded-xl"
            />
            <select
              name="status"
              defaultValue={params?.status ?? ""}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">Tous statuts</option>
              <option value="ACTIVE">Actifs</option>
              <option value="PENDING">En attente</option>
              <option value="SUSPENDED">Suspendus</option>
              <option value="ARCHIVED">Archives</option>
              <option value="REJECTED">Refuses</option>
            </select>
            <select
              name="role"
              defaultValue={params?.role ?? ""}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">Tous roles</option>
              <option value="MEMBER">Member</option>
              <option value="RESPO">Respo</option>
              <option value="FINANCE">Finance</option>
              <option value="MASTER">Master</option>
              <option value="CREATOR">Creator</option>
            </select>
            <Button type="submit" variant="outline" className="h-10 rounded-full">
              <Search className="h-4 w-4" aria-hidden />
              Filtrer
            </Button>
          </form>
        </div>
      </AdminCard>

      {data.members.length === 0 ? (
        <EmptyState
          title="Aucun membre trouve"
          description="Modifiez les filtres pour elargir la recherche."
        />
      ) : (
        <div className="grid gap-4">
          {data.members.map((member) => (
            <AdminCard key={member.id}>
              <div className="grid gap-4 xl:grid-cols-[1fr,360px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {[member.firstName, member.lastName].filter(Boolean).join(" ") ||
                        member.email ||
                        "Membre"}
                    </h3>
                    <StatusBadge value={member.membershipStatus} />
                    <StatusBadge value={member.role} />
                  </div>
                  <dl className="mt-3 grid gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                        ID membre
                      </dt>
                      <dd>{member.profile?.memberId ?? "En attente"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                        Email
                      </dt>
                      <dd>{member.email ?? "Restreint"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                        Approbation
                      </dt>
                      <dd>
                        {member.profile?.approvedAt
                          ? member.profile.approvedAt.toLocaleDateString("fr-FR")
                          : "Non approuve"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                        Contact
                      </dt>
                      <dd>{member.privateDetails?.phone ?? "Restreint"}</dd>
                    </div>
                    {data.canSensitive ? (
                      <>
                        <div>
                          <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                            Naissance
                          </dt>
                          <dd>
                            {member.privateDetails?.dateOfBirth
                              ? member.privateDetails.dateOfBirth.toLocaleDateString("fr-FR")
                              : "Non renseignee"}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                            Adresse
                          </dt>
                          <dd>
                            {[
                              member.privateDetails?.addressLine1,
                              member.privateDetails?.postalCode,
                              member.privateDetails?.city,
                              member.privateDetails?.countryCode,
                            ]
                              .filter(Boolean)
                              .join(" ") || "Non renseignee"}
                          </dd>
                        </div>
                      </>
                    ) : null}
                  </dl>
                </div>

                {canSuspend ? (
                  <AdminActionForm action={updateMemberStatusAction} className="space-y-2 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-950/40">
                    <input type="hidden" name="userId" value={member.id} />
                    <select
                      name="status"
                      defaultValue={member.membershipStatus}
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <option value="ACTIVE">Activer</option>
                      <option value="SUSPENDED">Suspendre</option>
                      <option value="ARCHIVED">Archiver</option>
                    </select>
                    <Textarea
                      name="reason"
                      placeholder="Raison obligatoire pour suspension/archive"
                      className="min-h-20"
                    />
                    <Button className="w-full rounded-full">Mettre a jour</Button>
                  </AdminActionForm>
                ) : null}
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}

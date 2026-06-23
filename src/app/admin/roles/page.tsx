import { Search } from "lucide-react"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateRoleAction } from "@/lib/admin/actions"
import { listRoleAdministrators, listRoleCandidates } from "@/lib/admin/data"

export default async function RolesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const [administrators, candidates] = await Promise.all([
    listRoleAdministrators(),
    listRoleCandidates(params?.q),
  ])

  return (
    <div className="space-y-5">
      <AdminCard>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-200">
            Roles
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Gestion des administrateurs
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Creator peut attribuer MEMBER, RESPO, FINANCE ou MASTER. Creator
            n&apos;est jamais attribue via cette interface.
          </p>
        </div>
      </AdminCard>

      <AdminCard>
        <h3 className="text-lg font-semibold">Administrateurs actuels</h3>
        <div className="mt-4 grid gap-3">
          {administrators.map((admin) => (
            <div
              key={admin.id}
              className="flex flex-col gap-2 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-950/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {[admin.firstName, admin.lastName].filter(Boolean).join(" ") ||
                    admin.email}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {admin.profile?.memberId ?? "ID en attente"} - {admin.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={admin.role} />
                <StatusBadge value={admin.membershipStatus} />
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Attribuer un role</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Seuls les membres actifs peuvent recevoir un role admin.
            </p>
          </div>
          <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 lg:w-96">
            <Input
              name="q"
              placeholder="Chercher un membre actif"
              defaultValue={params?.q ?? ""}
              className="h-10 rounded-xl"
            />
            <Button variant="outline" className="h-10 rounded-full" aria-label="Rechercher">
              <Search className="h-4 w-4" aria-hidden />
            </Button>
          </form>
        </div>

        {candidates.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Aucun candidat"
              description="Cherchez par nom, email ou ID membre."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {candidates.map((member) => (
              <div
                key={member.id}
                className="grid gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40 xl:grid-cols-[minmax(0,1fr),380px]"
              >
                <div>
                  <p className="font-medium">
                    {[member.firstName, member.lastName].filter(Boolean).join(" ") ||
                      member.email}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {member.profile?.memberId ?? "ID en attente"} - {member.email}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <StatusBadge value={member.role} />
                    <StatusBadge value={member.membershipStatus} />
                  </div>
                </div>
                <AdminActionForm action={updateRoleAction} className="grid gap-2">
                  <input type="hidden" name="userId" value={member.id} />
                  <select
                    name="role"
                    defaultValue={member.role}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="RESPO">Respo</option>
                    <option value="FINANCE">Finance</option>
                    <option value="MASTER">Master</option>
                  </select>
                  <Textarea
                    name="reason"
                    placeholder="Raison du changement"
                    className="min-h-20"
                    required
                  />
                  <Button className="rounded-full">Mettre a jour le role</Button>
                </AdminActionForm>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  )
}

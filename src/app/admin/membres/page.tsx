import Link from "next/link"
import {
  Archive,
  BadgeCheck,
  CalendarCheck,
  Cake,
  ChevronDown,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  Users,
} from "lucide-react"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { EmptyState } from "@/components/admin/admin-card"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateMemberStatusAction, updateRoleAction } from "@/lib/admin/actions"
import { listMembers, pageSize } from "@/lib/admin/data"
import { hasPermission } from "@/lib/auth/permissions"

const statusOptions = [
  { value: "", label: "Tous" },
  { value: "ACTIVE", label: "Actifs" },
  { value: "PENDING", label: "Attente" },
  { value: "SUSPENDED", label: "Suspendus" },
  { value: "ARCHIVED", label: "Archives" },
  { value: "REJECTED", label: "Refuses" },
]

const roleOptions = [
  { value: "", label: "Tous roles" },
  { value: "MEMBER", label: "Member" },
  { value: "RESPO", label: "Respo" },
  { value: "FINANCE", label: "Finance" },
  { value: "MASTER", label: "Master" },
  { value: "CREATOR", label: "Creator" },
]

const statusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  PENDING: "En attente",
  SUSPENDED: "Suspendu",
  ARCHIVED: "Archive",
  REJECTED: "Refuse",
}

const roleLabels: Record<string, string> = {
  MEMBER: "Membre",
  RESPO: "Respo",
  FINANCE: "Finance",
  MASTER: "Master",
  CREATOR: "Creator",
}

function buildMembersHref({
  q,
  status,
  role,
}: {
  q?: string
  status?: string
  role?: string
}) {
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (status) params.set("status", status)
  if (role) params.set("role", role)
  const query = params.toString()

  return query ? `/admin/membres?${query}` : "/admin/membres"
}

function formatDate(value?: Date | null) {
  return value ? value.toLocaleDateString("fr-FR") : null
}

function getMemberName(member: {
  firstName: string | null
  lastName: string | null
  email?: string | boolean | null
  profile: { displayName: string | null } | null
}) {
  return (
    member.profile?.displayName ||
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    (typeof member.email === "string" ? member.email : null) ||
    "Membre"
  )
}

function getInitials(name: string) {
  const letters = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return letters || "M"
}

function getAddress(member: {
  privateDetails:
    | {
        addressLine1?: string | null
        postalCode?: string | null
        city?: string | null
        countryCode?: string | null
      }
    | null
}) {
  return (
    [
      member.privateDetails?.addressLine1,
      member.privateDetails?.postalCode,
      member.privateDetails?.city,
      member.privateDetails?.countryCode,
    ]
      .filter(Boolean)
      .join(" ") || "Non renseignee"
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  href?: string
}) {
  const content = href ? (
    <Link href={href} className="break-words hover:text-amber-600">
      {value}
    </Link>
  ) : (
    <span className="break-words">{value}</span>
  )

  return (
    <div className="flex min-w-0 gap-3 rounded-2xl border border-zinc-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          {label}
        </dt>
        <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {content}
        </dd>
      </div>
    </div>
  )
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string; role?: string }>
}) {
  const params = await searchParams
  const activeSearch = params?.q?.trim() ?? ""
  const activeStatus = params?.status ?? ""
  const activeRole = params?.role ?? ""
  const data = await listMembers({
    search: activeSearch,
    status: activeStatus,
    role: activeRole,
  })
  const canSuspend = hasPermission(data.actorRole, "members.suspend")
  const canManageRoles = hasPermission(data.actorRole, "roles.manage")
  const hasActiveFilters = Boolean(activeSearch || activeStatus || activeRole)
  const statCards = [
    {
      label: "Total",
      value: data.counts.total,
      icon: Users,
      tone: "from-zinc-900 to-zinc-700 text-white dark:from-zinc-100 dark:to-zinc-400 dark:text-zinc-950",
    },
    {
      label: "Actifs",
      value: data.counts.status.ACTIVE,
      icon: UserCheck,
      tone: "from-emerald-600 to-teal-500 text-white",
    },
    {
      label: "En attente",
      value: data.counts.status.PENDING,
      icon: CalendarCheck,
      tone: "from-amber-500 to-orange-500 text-white",
    },
    {
      label: "Admin",
      value:
        data.counts.role.RESPO +
        data.counts.role.FINANCE +
        data.counts.role.MASTER +
        data.counts.role.CREATOR,
      icon: ShieldCheck,
      tone: "from-indigo-600 to-sky-500 text-white",
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="overflow-hidden rounded-[1.6rem] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
        <div className="grid gap-0 xl:grid-cols-[1fr,0.9fr]">
          <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950 p-5 text-white sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200">
              Repertoire
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Membres
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
                  Retrouvez les membres, leurs statuts et les informations
                  autorisees pour votre role.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-300">
                  Resultats
                </p>
                <p className="mt-1 text-3xl font-semibold">
                  {data.counts.filtered}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-4 dark:bg-zinc-950/50 sm:p-5">
            {statCards.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.label}
                  className={`rounded-3xl bg-gradient-to-br p-4 shadow-sm ${item.tone}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium opacity-80">
                      {item.label}
                    </p>
                    <Icon className="h-5 w-5 opacity-75" />
                  </div>
                  <p className="mt-5 text-3xl font-semibold">{item.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[1.45rem] border border-zinc-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900/80 sm:p-4">
        <div className="flex items-center gap-2 px-1 pb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          <SlidersHorizontal className="h-4 w-4 text-amber-600" />
          Filtres rapides
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusOptions.map((item) => {
            const active = activeStatus === item.value

            return (
              <Button
                key={item.value || "all"}
                asChild
                size="sm"
                variant={active ? "default" : "outline"}
                className="shrink-0 rounded-full"
              >
                <Link
                  href={buildMembersHref({
                    q: activeSearch,
                    status: item.value,
                    role: activeRole,
                  })}
                >
                  {item.label}
                  {item.value ? (
                    <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[0.65rem] dark:bg-white/15">
                      {
                        data.counts.status[
                          item.value as keyof typeof data.counts.status
                        ]
                      }
                    </span>
                  ) : null}
                </Link>
              </Button>
            )
          })}
        </div>

        <form className="mt-2 grid gap-2 lg:grid-cols-[1fr,180px,170px,auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              name="q"
              placeholder="Nom, email, ID membre..."
              defaultValue={activeSearch}
              className="h-11 rounded-2xl pl-9"
            />
          </div>
          <select
            name="status"
            defaultValue={activeStatus}
            className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {statusOptions.map((item) => (
              <option key={item.value || "all"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            name="role"
            defaultValue={activeRole}
            className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {roleOptions.map((item) => (
              <option key={item.value || "all"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Button type="submit" className="h-11 rounded-2xl">
            <Search className="h-4 w-4" aria-hidden />
            Filtrer
          </Button>
        </form>

        {hasActiveFilters ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Filtres actifs</span>
            {activeSearch ? (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                Recherche: {activeSearch}
              </span>
            ) : null}
            {activeStatus ? (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                Statut: {statusLabels[activeStatus] ?? activeStatus}
              </span>
            ) : null}
            {activeRole ? (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                Role: {roleLabels[activeRole] ?? activeRole}
              </span>
            ) : null}
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/admin/membres">Reinitialiser</Link>
            </Button>
          </div>
        ) : null}
      </section>

      {!data.canSensitive ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
          Les informations sensibles restent masquees. Seuls Master et Creator
          peuvent voir la date de naissance et l&apos;adresse complete.
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
              Liste des membres
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {data.members.length} affiche(s) sur {data.counts.filtered}
              {data.counts.filtered > pageSize
                ? `, ${pageSize} maximum par page`
                : ""}
              .
            </p>
          </div>
        </div>

        {data.members.length === 0 ? (
          <EmptyState
            title="Aucun membre trouve"
            description="Modifiez les filtres pour elargir la recherche."
          />
        ) : (
          <div className="grid gap-3">
            {data.members.map((member) => {
              const memberName = getMemberName(member)
              const email =
                typeof member.email === "string" ? member.email : "Restreint"
              const phone = member.privateDetails?.phone ?? "Restreint"
              const memberId = member.profile?.memberId ?? "En attente"
              const approvedAt =
                formatDate(member.profile?.approvedAt) ?? "Non approuve"
              const dateOfBirth =
                data.canSensitive && "dateOfBirth" in (member.privateDetails ?? {})
                  ? formatDate(member.privateDetails?.dateOfBirth) ??
                    "Non renseignee"
                  : null

              return (
                <article
                  key={member.id}
                  className="overflow-hidden rounded-[1.45rem] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/80"
                >
                  <div className="grid gap-0 xl:grid-cols-[1fr,320px]">
                    <div className="p-4 sm:p-5">
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-lg font-semibold text-white shadow-sm">
                            {member.profile?.avatarUrl || member.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={member.profile?.avatarUrl ?? member.imageUrl ?? ""}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getInitials(memberName)
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="truncate text-xl font-semibold text-zinc-950 dark:text-white">
                              {memberName}
                            </h4>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <StatusBadge
                                value={member.membershipStatus}
                                label={
                                  statusLabels[member.membershipStatus] ??
                                  member.membershipStatus
                                }
                              />
                              <StatusBadge
                                value={member.role}
                                label={roleLabels[member.role] ?? member.role}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                          {memberId}
                        </div>
                      </div>

                      <dl className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        <DetailItem
                          icon={Mail}
                          label="Email"
                          value={email}
                          href={email !== "Restreint" ? `mailto:${email}` : undefined}
                        />
                        <DetailItem
                          icon={Phone}
                          label="Telephone"
                          value={phone}
                          href={phone !== "Restreint" ? `tel:${phone}` : undefined}
                        />
                        <DetailItem
                          icon={CalendarCheck}
                          label="Approbation"
                          value={approvedAt}
                        />
                        <DetailItem
                          icon={MapPin}
                          label="Ville"
                          value={member.privateDetails?.city ?? "Non renseignee"}
                        />
                        {data.canSensitive ? (
                          <>
                            <DetailItem
                              icon={Cake}
                              label="Naissance"
                              value={dateOfBirth ?? "Non renseignee"}
                            />
                            <DetailItem
                              icon={MapPin}
                              label="Adresse"
                              value={getAddress(member)}
                            />
                          </>
                        ) : null}
                      </dl>
                    </div>

                    <div className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950/45 xl:border-l xl:border-t-0">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                            Gestion
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Statut et role du compte membre.
                          </p>
                        </div>
                        {member.membershipStatus === "ACTIVE" ? (
                          <BadgeCheck className="h-5 w-5 text-emerald-500" />
                        ) : member.membershipStatus === "ARCHIVED" ? (
                          <Archive className="h-5 w-5 text-zinc-400" />
                        ) : (
                          <ShieldCheck className="h-5 w-5 text-amber-500" />
                        )}
                      </div>

                      <div className="mt-4 space-y-3">
                        {canSuspend ? (
                          <details className="group rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold">
                              Modifier le statut
                              <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                            </summary>
                            <AdminActionForm
                              action={updateMemberStatusAction}
                              className="space-y-3 border-t border-zinc-200 p-3 dark:border-white/10"
                            >
                              <input
                                type="hidden"
                                name="userId"
                                value={member.id}
                              />
                              <select
                                name="status"
                                defaultValue={member.membershipStatus}
                                className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                              >
                                <option value="ACTIVE">Activer</option>
                                <option value="SUSPENDED">Suspendre</option>
                                <option value="ARCHIVED">Archiver</option>
                              </select>
                              <Textarea
                                name="reason"
                                placeholder="Raison obligatoire pour suspension/archive"
                                className="min-h-24 rounded-2xl"
                              />
                              <Button className="h-11 w-full rounded-2xl">
                                Mettre a jour
                              </Button>
                            </AdminActionForm>
                          </details>
                        ) : (
                          <p className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
                            Votre role ne permet pas de modifier les statuts.
                          </p>
                        )}
                        {canManageRoles ? (
                          member.id === data.actorId ? (
                            <p className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
                              Votre propre role n&apos;est pas modifiable ici.
                            </p>
                          ) : member.role === "CREATOR" ? (
                            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
                              Le role Creator est protege et ne se modifie pas
                              depuis cette interface.
                            </p>
                          ) : member.membershipStatus !== "ACTIVE" ? (
                            <p className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
                              Activez ce membre avant de lui attribuer un role.
                            </p>
                          ) : (
                            <details className="group rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900">
                              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold">
                                Modifier le role
                                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                              </summary>
                              <AdminActionForm
                                action={updateRoleAction}
                                className="space-y-3 border-t border-zinc-200 p-3 dark:border-white/10"
                              >
                                <input
                                  type="hidden"
                                  name="userId"
                                  value={member.id}
                                />
                                <select
                                  name="role"
                                  defaultValue={member.role}
                                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                                >
                                  <option value="MEMBER">Member</option>
                                  <option value="RESPO">Respo</option>
                                  <option value="FINANCE">Finance</option>
                                  <option value="MASTER">Master</option>
                                </select>
                                <Textarea
                                  name="reason"
                                  placeholder="Raison du changement de role"
                                  className="min-h-24 rounded-2xl"
                                  required
                                />
                                <Button className="h-11 w-full rounded-2xl">
                                  Mettre a jour le role
                                </Button>
                              </AdminActionForm>
                            </details>
                          )
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

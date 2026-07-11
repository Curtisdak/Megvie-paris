import Link from "next/link"
import {
  Archive,
  BadgeCheck,
  CalendarCheck,
  Cake,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { EmptyState } from "@/components/admin/admin-card"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminPageHero } from "@/components/admin/admin-page-hero"
import { MemberProfileDisclosure } from "@/components/admin/member-profile-disclosure"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
    <div className="flex min-h-[5.25rem] min-w-0 gap-3 bg-white p-4 dark:bg-[#111114]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-50 text-orange-700 dark:from-amber-400/15 dark:to-orange-500/10 dark:text-amber-100">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          {label}
        </dt>
        <dd className="mt-1 text-sm font-semibold leading-5 text-zinc-900 dark:text-zinc-100">
          {content}
        </dd>
      </div>
    </div>
  )
}

function MemberStatusDialog({
  userId,
  memberName,
  currentStatus,
}: {
  userId: string
  memberName: string
  currentStatus: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-white/10 dark:bg-[#111114] dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/5"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Modifier le statut</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">Activer, suspendre ou archiver</span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%_-_1.5rem)] rounded-2xl p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-zinc-200 bg-gradient-to-r from-emerald-50 via-white to-orange-50 px-5 py-5 text-left dark:border-white/10 dark:from-emerald-500/10 dark:via-zinc-950 dark:to-orange-500/10">
          <DialogTitle>Modifier le statut</DialogTitle>
          <DialogDescription>
            Mettez à jour l&apos;accès de {memberName}. Les changements sensibles sont enregistrés dans l&apos;audit.
          </DialogDescription>
        </DialogHeader>
        <AdminActionForm action={updateMemberStatusAction} className="space-y-4 p-5">
          <input type="hidden" name="userId" value={userId} />
          <div className="space-y-2">
            <label htmlFor={`status-${userId}`} className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">Nouveau statut</label>
            <select
              id={`status-${userId}`}
              name="status"
              defaultValue={currentStatus}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="ACTIVE">Activer</option>
              <option value="SUSPENDED">Suspendre</option>
              <option value="ARCHIVED">Archiver</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor={`status-reason-${userId}`} className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">Motif</label>
            <Textarea id={`status-reason-${userId}`} name="reason" placeholder="Obligatoire pour une suspension ou un archivage" className="min-h-24 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-xl shadow-none">Annuler</Button>
            </DialogClose>
            <Button className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-none hover:from-orange-700 hover:to-amber-600">Confirmer</Button>
          </div>
        </AdminActionForm>
      </DialogContent>
    </Dialog>
  )
}

function MemberRoleDialog({
  userId,
  memberName,
  currentRole,
}: {
  userId: string
  memberName: string
  currentRole: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-orange-300 hover:bg-orange-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-white/10 dark:bg-[#111114] dark:hover:border-orange-500/30 dark:hover:bg-orange-500/5"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
              <ShieldCheck className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Modifier le rôle</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">Changer les autorisations</span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%_-_1.5rem)] rounded-2xl p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-zinc-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 px-5 py-5 text-left dark:border-white/10 dark:from-orange-500/10 dark:via-zinc-950 dark:to-amber-500/10">
          <DialogTitle>Modifier le rôle</DialogTitle>
          <DialogDescription>
            Attribuez de nouvelles responsabilités à {memberName}. Cette action sera enregistrée dans l&apos;audit.
          </DialogDescription>
        </DialogHeader>
        <AdminActionForm action={updateRoleAction} className="space-y-4 p-5">
          <input type="hidden" name="userId" value={userId} />
          <div className="space-y-2">
            <label htmlFor={`role-${userId}`} className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">Nouveau rôle</label>
            <select
              id={`role-${userId}`}
              name="role"
              defaultValue={currentRole}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="MEMBER">Membre</option>
              <option value="RESPO">Responsable</option>
              <option value="FINANCE">Finance</option>
              <option value="MASTER">Administrateur</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor={`role-reason-${userId}`} className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">Motif</label>
            <Textarea id={`role-reason-${userId}`} name="reason" placeholder="Expliquez la raison du changement" className="min-h-24 rounded-xl" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-xl shadow-none">Annuler</Button>
            </DialogClose>
            <Button className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-none hover:from-orange-700 hover:to-amber-600">Confirmer</Button>
          </div>
        </AdminActionForm>
      </DialogContent>
    </Dialog>
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
      <AdminPageHero
        eyebrow="Communauté"
        title="Répertoire des membres"
        description="Retrouvez les membres, leurs statuts et les informations autorisées pour votre rôle."
        action={
          <div className="flex items-baseline gap-2 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <span className="text-3xl font-bold text-white">{data.counts.filtered}</span>
            <span className="text-xs text-white/65">résultat(s)</span>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Statistiques membres">
        {statCards.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#111114]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{item.label}</p>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight">{item.value}</p>
            </div>
          )
        })}
      </section>

      <AdminFilterBar description="Recherchez une personne et filtrez par statut ou rôle.">
        <div className="flex snap-x gap-2 overflow-x-auto pb-2">
          {statusOptions.map((item) => {
            const active = activeStatus === item.value

            return (
              <Button
                key={item.value || "all"}
                asChild
                size="sm"
                variant={active ? "default" : "outline"}
                className="shrink-0 snap-start rounded-lg shadow-none"
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

        <form className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              name="q"
              placeholder="Nom, email, ID membre..."
              defaultValue={activeSearch}
              className="h-10 rounded-lg pl-9"
            />
          </div>
          <input type="hidden" name="status" value={activeStatus} />
          <select
            name="role"
            defaultValue={activeRole}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {roleOptions.map((item) => (
              <option key={item.value || "all"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Button type="submit" className="h-10 px-4">
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
      </AdminFilterBar>

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
                  className="group/member overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)] transition-[border-color,box-shadow] duration-300 hover:border-orange-200 hover:shadow-[0_20px_55px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-[#111114] dark:hover:border-orange-500/30"
                >
                  <MemberProfileDisclosure
                    summary={
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-400 to-emerald-500 text-lg font-bold text-white shadow-lg shadow-orange-500/20 ring-4 ring-white dark:ring-zinc-900">
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
                            <span
                              className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                                member.membershipStatus === "ACTIVE"
                                  ? "bg-emerald-500"
                                  : member.membershipStatus === "SUSPENDED"
                                    ? "bg-orange-500"
                                    : "bg-zinc-400"
                              }`}
                              aria-hidden
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">Profil membre</p>
                            <h4 className="mt-1 truncate text-xl font-bold text-zinc-950 dark:text-white">
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
                        <div className="flex items-center gap-2 self-start">
                          <div className="flex items-center gap-2 rounded-xl bg-zinc-950 px-3 py-2 text-sm font-bold text-white shadow-sm dark:bg-white dark:text-zinc-950">
                            <BadgeCheck className="h-4 w-4 text-amber-400 dark:text-orange-600" aria-hidden />
                            <span>{memberId}</span>
                          </div>
                        </div>
                      </div>
                    }
                  >

                    <div className="divide-y divide-zinc-200/80 dark:divide-white/10">
                      <div className="p-4 sm:p-5">
                      <dl className="grid gap-px overflow-hidden rounded-xl bg-zinc-200/80 ring-1 ring-zinc-200/80 dark:bg-white/10 dark:ring-white/10 sm:grid-cols-2 xl:grid-cols-3">
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

                    <div className="bg-zinc-50/80 p-4 dark:bg-black/15 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-zinc-950 dark:text-white">
                            Gestion du compte
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Modifiez le statut ou les responsabilités de ce membre.
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

                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {canSuspend ? (
                          <MemberStatusDialog
                            userId={member.id}
                            memberName={memberName}
                            currentStatus={member.membershipStatus}
                          />
                        ) : (
                          <p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
                            Votre role ne permet pas de modifier les statuts.
                          </p>
                        )}
                        {canManageRoles ? (
                          member.id === data.actorId ? (
                            <p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
                              Votre propre role n&apos;est pas modifiable ici.
                            </p>
                          ) : member.role === "CREATOR" ? (
                            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
                              Le role Creator est protege et ne se modifie pas
                              depuis cette interface.
                            </p>
                          ) : member.membershipStatus !== "ACTIVE" ? (
                            <p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
                              Activez ce membre avant de lui attribuer un role.
                            </p>
                          ) : (
                            <MemberRoleDialog
                              userId={member.id}
                              memberName={memberName}
                              currentRole={member.role}
                            />
                          )
                        ) : null}
                      </div>
                    </div>
                    </div>
                  </MemberProfileDisclosure>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

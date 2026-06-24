import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  BadgeEuro,
  CalendarClock,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Undo2,
  XCircle,
} from "lucide-react"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { AdminCard } from "@/components/admin/admin-card"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrencyFromCents } from "@/lib/finance/config"
import {
  cancelDirectDonationAction,
  correctVerifiedDirectDonationAction,
  getDirectDonationDetail,
  getDirectDonationFormData,
  verifyDirectDonationAction,
} from "@/lib/finance/direct"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Don direct",
}

const statusLabels: Record<string, string> = {
  RECORDED: "A verifier",
  VERIFIED: "Verifie",
  CANCELLED: "Annule",
}

const kindLabels: Record<string, string> = {
  IDENTIFIED: "Don membre identifie",
  ANONYMOUS_COLLECTION: "Collecte anonyme",
}

function fullName(user: {
  email: string
  firstName: string | null
  lastName: string | null
  profile: { displayName: string | null; memberId: string | null } | null
}) {
  return (
    user.profile?.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email
  )
}

function displayDate(value: Date | null | undefined) {
  if (!value) return "Non renseigne"

  return value.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function toDateTimeLocal(date: Date | null | undefined) {
  const value = date ?? new Date()
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

function newRequestId() {
  return `correction-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default async function DirectDonationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ actor, donation, auditLogs, canCancelVerified, canCorrect }, formData] =
    await Promise.all([getDirectDonationDetail(id), getDirectDonationFormData()])
  const isRecorded = donation.directStatus === "RECORDED"
  const isVerified = donation.directStatus === "VERIFIED"
  const isCancelled = donation.directStatus === "CANCELLED"
  const canCancel = isRecorded || canCancelVerified

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Button asChild variant="outline" className="rounded-full">
        <Link href="/admin/dons/directs">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour aux dons directs
        </Link>
      </Button>

      <section className="rounded-[1.35rem] bg-gradient-to-br from-zinc-950 via-amber-950 to-emerald-950 p-5 text-white shadow-xl sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
              Don direct
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {donation.donorNameSnapshot ??
                donation.collectionLabel ??
                "Collecte anonyme"}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge
                value={donation.directStatus ?? "RECORDED"}
                label={statusLabels[donation.directStatus ?? ""] ?? "A verifier"}
              />
              <StatusBadge
                value="GENERAL"
                label={kindLabels[donation.directKind ?? ""] ?? "Direct"}
              />
            </div>
          </div>
          <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 lg:text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-300">
              Montant
            </p>
            <p className="mt-2 text-4xl font-semibold">
              {formatCurrencyFromCents(donation.amountCents, donation.currency)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),22rem]">
        <div className="space-y-4">
          <AdminCard>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Date recue",
                  value: displayDate(donation.receivedAt),
                  icon: CalendarClock,
                },
                {
                  label: "Categorie",
                  value: donation.category.label,
                  icon: BadgeEuro,
                },
                {
                  label: "Membre",
                  value: donation.memberIdSnapshot ?? "Collecte anonyme",
                  icon: CheckCircle2,
                },
                {
                  label: "Evenement",
                  value: donation.event?.title ?? "Aucun evenement lie",
                  icon: FileText,
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      <Icon className="h-4 w-4" aria-hidden />
                      {item.label}
                    </div>
                    <p className="mt-2 font-semibold">{item.value}</p>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Notes internes
              </p>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                {donation.internalNote || "Aucune note interne."}
              </p>
              {donation.manualReference ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Reference: {donation.manualReference}
                </p>
              ) : null}
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="text-lg font-semibold">Historique administratif</h2>
            <div className="mt-3 space-y-2">
              {auditLogs.length ? (
                auditLogs.map((log) => (
                  <article
                    key={log.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold">{log.summary}</p>
                      <p className="text-xs text-zinc-500">
                        {displayDate(log.createdAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {log.actor ? fullName(log.actor) : "Systeme"} - {log.action}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-500 dark:bg-zinc-950/50">
                  Aucun journal pour ce don.
                </p>
              )}
            </div>
          </AdminCard>
        </div>

        <aside className="space-y-4">
          <AdminCard>
            <h2 className="text-lg font-semibold">Actions</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Connecte: {actor.profile?.displayName ?? actor.email}
            </p>

            <div className="mt-4 space-y-3">
              {isRecorded ? (
                <AdminActionForm
                  action={verifyDirectDonationAction}
                  className="space-y-3"
                >
                  <input type="hidden" name="id" value={donation.id} />
                  <Button className="h-11 w-full rounded-2xl bg-emerald-700 text-white hover:bg-emerald-800">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Verifier
                  </Button>
                </AdminActionForm>
              ) : null}

              {canCancel && !isCancelled ? (
                <AdminActionForm
                  action={cancelDirectDonationAction}
                  className="space-y-3 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <input type="hidden" name="id" value={donation.id} />
                  <Textarea
                    name="reason"
                    required
                    minLength={4}
                    placeholder={
                      isVerified
                        ? "Motif obligatoire pour annuler un don verifie"
                        : "Motif obligatoire"
                    }
                    className="min-h-20 rounded-2xl"
                  />
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-2xl border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10"
                  >
                    <XCircle className="h-4 w-4" aria-hidden />
                    Annuler
                  </Button>
                </AdminActionForm>
              ) : null}

              {isCancelled ? (
                <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-100">
                  Ce don direct est annule et ne compte pas dans les totaux.
                </div>
              ) : null}
            </div>
          </AdminCard>

          {canCorrect ? (
            <AdminCard>
              <details>
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
                      <Undo2 className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h2 className="font-semibold">Corriger ce don</h2>
                      <p className="text-sm text-zinc-500">
                        Annule le don verifie et cree un remplacement.
                      </p>
                    </div>
                  </div>
                </summary>
                <AdminActionForm
                  action={correctVerifiedDirectDonationAction}
                  className="mt-4 space-y-3"
                >
                  <input type="hidden" name="id" value={donation.id} />
                  <input
                    type="hidden"
                    name="directEntryRequestId"
                    value={newRequestId()}
                  />
                  <Input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    defaultValue={(donation.amountCents / 100).toFixed(2)}
                    className="h-11 rounded-2xl"
                  />
                  <select
                    name="categoryId"
                    defaultValue={donation.categoryId}
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    {formData.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    name="receivedAt"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(donation.receivedAt)}
                    required
                    className="h-11 rounded-2xl"
                  />
                  <Textarea
                    name="reason"
                    required
                    minLength={4}
                    placeholder="Motif de correction"
                    className="min-h-20 rounded-2xl"
                  />
                  <Button className="h-11 w-full rounded-2xl">
                    <ShieldAlert className="h-4 w-4" aria-hidden />
                    Creer la correction
                  </Button>
                </AdminActionForm>
              </details>
            </AdminCard>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

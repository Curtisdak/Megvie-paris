"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, Search, ShieldCheck, UserRound, UsersRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  createDirectDonationAction,
  type DirectDonationActionState,
} from "@/lib/finance/direct"
import { cn } from "@/lib/utils"

type DirectDonationCategory = {
  id: string
  label: string
  slug: string
}

type DirectDonationEvent = {
  id: string
  title: string
  startsAt: string
}

type MemberSearchResult = {
  id: string
  name: string
  email: string
  imageUrl: string | null
  memberId: string | null
}

const initialState: DirectDonationActionState = {
  ok: false,
  message: "",
}

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatEventDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function DirectDonationForm({
  categories,
  events,
  defaultReceivedAt,
}: {
  categories: DirectDonationCategory[]
  events: DirectDonationEvent[]
  defaultReceivedAt: string
}) {
  const router = useRouter()
  const [kind, setKind] = useState<"IDENTIFIED" | "ANONYMOUS_COLLECTION">(
    "IDENTIFIED",
  )
  const [query, setQuery] = useState("")
  const [members, setMembers] = useState<MemberSearchResult[]>([])
  const [selectedMember, setSelectedMember] =
    useState<MemberSearchResult | null>(null)
  const [requestId] = useState(createRequestId)
  const [state, formAction, pending] = useActionState(
    createDirectDonationAction,
    initialState,
  )
  const firstCategory = categories[0]?.id ?? ""

  useEffect(() => {
    if (!state.ok || !state.donationId) return
    router.push(`/admin/dons/directs/${state.donationId}`)
  }, [router, state])

  useEffect(() => {
    if (kind !== "IDENTIFIED") return

    const trimmed = query.trim()
    if (trimmed.length < 2 || selectedMember?.name === trimmed) {
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/direct-donations/member-search?q=${encodeURIComponent(
            trimmed,
          )}`,
          { signal: controller.signal },
        )

        if (!response.ok) return
        const payload = (await response.json()) as {
          members?: MemberSearchResult[]
        }
        setMembers(payload.members ?? [])
      } catch (error) {
        if ((error as Error).name !== "AbortError") setMembers([])
      }
    }, 240)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [kind, query, selectedMember?.name])

  const amountHelp = useMemo(
    () =>
      kind === "IDENTIFIED"
        ? "Le don sera rattache au membre choisi apres verification."
        : "La collecte restera anonyme et ne sera pas visible dans un historique membre.",
    [kind],
  )

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="directEntryRequestId" value={requestId} />
      <input type="hidden" name="memberUserId" value={selectedMember?.id ?? ""} />

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setKind("IDENTIFIED")}
          className={cn(
            "flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
            kind === "IDENTIFIED"
              ? "border-amber-500 bg-amber-50 text-amber-950 shadow-sm dark:bg-amber-500/10 dark:text-amber-50"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200",
          )}
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-700 shadow-sm dark:bg-zinc-900">
            <UserRound className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-semibold">Don d&apos;un membre</span>
            <span className="mt-1 block text-sm opacity-75">
              Rattacher un don direct a un membre actif.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setKind("ANONYMOUS_COLLECTION")
            setSelectedMember(null)
          }}
          className={cn(
            "flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
            kind === "ANONYMOUS_COLLECTION"
              ? "border-amber-500 bg-amber-50 text-amber-950 shadow-sm dark:bg-amber-500/10 dark:text-amber-50"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200",
          )}
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-700 shadow-sm dark:bg-zinc-900">
            <UsersRound className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-semibold">Collecte anonyme</span>
            <span className="mt-1 block text-sm opacity-75">
              Comptabiliser une enveloppe ou une collecte sans membre.
            </span>
          </span>
        </button>
      </div>

      {kind === "IDENTIFIED" ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
          <Label htmlFor="member-search">Membre actif</Label>
          <div className="relative mt-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <Input
              id="member-search"
              value={query}
              onChange={(event) => {
                const value = event.target.value
                setQuery(value)
                setSelectedMember(null)
                if (value.trim().length < 2) setMembers([])
              }}
              placeholder="Nom, email ou identifiant membre"
              className="h-12 rounded-2xl bg-white pl-10 dark:bg-zinc-950"
            />
          </div>

          {selectedMember ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white p-3 dark:bg-zinc-900">
              <div className="min-w-0">
                <p className="truncate font-semibold">{selectedMember.name}</p>
                <p className="mt-1 truncate text-sm text-zinc-500">
                  {selectedMember.memberId ?? "Sans ID"} - {selectedMember.email}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setSelectedMember(null)}
              >
                Changer
              </Button>
            </div>
          ) : null}

          {members.length ? (
            <div className="mt-2 grid gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setSelectedMember(member)
                    setQuery(member.name)
                    setMembers([])
                  }}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-left transition hover:border-amber-400 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {member.name}
                    </span>
                    <span className="mt-1 block truncate text-sm text-zinc-500">
                      {member.memberId ?? "Sans ID"} - {member.email}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-200">
                    Choisir
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="direct-amount">Montant recu</Label>
          <Input
            id="direct-amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            placeholder="50"
            className="mt-2 h-12 rounded-2xl"
          />
          <p className="mt-1 text-xs text-zinc-500">{amountHelp}</p>
        </div>

        <div>
          <Label htmlFor="direct-category">Categorie</Label>
          <select
            id="direct-category"
            name="categoryId"
            defaultValue={firstCategory}
            required
            className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="direct-received-at">Date de reception</Label>
          <Input
            id="direct-received-at"
            name="receivedAt"
            type="datetime-local"
            defaultValue={defaultReceivedAt}
            required
            className="mt-2 h-12 rounded-2xl"
          />
        </div>

        <div>
          <Label htmlFor="direct-event">Evenement lie</Label>
          <select
            id="direct-event"
            name="eventId"
            className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="">Aucun evenement</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} - {formatEventDate(event.startsAt)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="direct-collection-label">Libelle de collecte</Label>
          <Input
            id="direct-collection-label"
            name="collectionLabel"
            placeholder="Collecte culte du dimanche"
            className="mt-2 h-12 rounded-2xl"
          />
        </div>
        <div>
          <Label htmlFor="direct-manual-reference">Reference interne</Label>
          <Input
            id="direct-manual-reference"
            name="manualReference"
            placeholder="Carnet, enveloppe, caisse..."
            className="mt-2 h-12 rounded-2xl"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="direct-internal-note">Note interne</Label>
        <Textarea
          id="direct-internal-note"
          name="internalNote"
          placeholder="Visible uniquement par les roles finances autorises."
          className="mt-2 min-h-24 rounded-2xl"
        />
      </div>

      {state.message ? (
        <p
          className={cn(
            "rounded-2xl px-3 py-2 text-sm font-medium",
            state.ok
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100"
              : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-100",
          )}
        >
          {state.message}
        </p>
      ) : null}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Ce don sera d&apos;abord enregistre. Il comptera dans les totaux officiels
            uniquement apres verification.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending || (kind === "IDENTIFIED" && !selectedMember)}
        className="h-12 w-full rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
      >
        <CalendarDays className="h-4 w-4" aria-hidden />
        {pending ? "Enregistrement..." : "Enregistrer le don direct"}
      </Button>
    </form>
  )
}

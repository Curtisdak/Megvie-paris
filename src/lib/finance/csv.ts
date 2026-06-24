import "server-only"

import { formatCurrencyFromCents } from "@/lib/finance/config"

type ExportDonation = {
  id: string
  source: string
  donatedAt: Date | null
  receivedAt: Date | null
  createdAt: Date
  memberIdSnapshot: string | null
  donorNameSnapshot: string | null
  donorEmailSnapshot: string | null
  frequency: string
  status: string
  directKind: string | null
  directStatus: string | null
  amountCents: number
  refundedAmountCents: number
  currency: string
  collectionLabel: string | null
  manualReference: string | null
  cancellationReason: string | null
  verifiedAt: Date | null
  cancelledAt: Date | null
  stripePaymentIntentId: string | null
  stripeInvoiceId: string | null
  category: { label: string }
  event: { title: string; startsAt: Date } | null
  user: {
    email: string
    firstName: string | null
    lastName: string | null
    profile: { memberId: string | null; displayName: string | null } | null
  } | null
  enteredBy: ExportActor | null
  verifiedBy: ExportActor | null
  cancelledBy: ExportActor | null
}

type ExportActor = {
  email: string
  firstName: string | null
  lastName: string | null
  profile: { memberId: string | null; displayName: string | null } | null
}

function sanitizeCell(value: string) {
  const normalized = value.replace(/\r?\n/g, " ").trim()
  const safe = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized
  return `"${safe.replace(/"/g, '""')}"`
}

function row(cells: Array<string | number | null | undefined>) {
  return cells.map((cell) => sanitizeCell(String(cell ?? ""))).join(",")
}

function displayName(donation: ExportDonation) {
  return (
    donation.donorNameSnapshot ||
    donation.user?.profile?.displayName ||
    [donation.user?.firstName, donation.user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    ""
  )
}

function actorName(actor: ExportActor | null) {
  if (!actor) return ""

  return (
    actor.profile?.displayName ||
    [actor.firstName, actor.lastName].filter(Boolean).join(" ") ||
    actor.email
  )
}

function displaySource(donation: ExportDonation) {
  return donation.source === "DIRECT" ? "Direct" : "Stripe"
}

function displayDonationType(donation: ExportDonation) {
  if (donation.source === "DIRECT") {
    return donation.directKind === "ANONYMOUS_COLLECTION"
      ? "Collecte anonyme"
      : "Membre identifie"
  }

  return donation.frequency === "MONTHLY" ? "Don mensuel" : "Don unique"
}

export function donationsToCsv(donations: ExportDonation[]) {
  const lines = [
    row([
      "Date",
      "Source",
      "Identifiant membre",
      "Nom",
      "E-mail",
      "Categorie",
      "Type de don",
      "Statut direct",
      "Montant brut",
      "Montant rembourse",
      "Montant net",
      "Devise",
      "Statut",
      "Reference Stripe",
      "Evenement",
      "Libelle collecte",
      "Reference interne",
      "Saisi par",
      "Verifie par",
      "Date verification",
      "Annule par",
      "Date annulation",
      "Motif annulation",
    ]),
  ]

  for (const donation of donations) {
    const gross = donation.amountCents
    const refunded = donation.refundedAmountCents
    const net = gross - refunded

    lines.push(
      row([
        (donation.source === "DIRECT"
          ? donation.receivedAt ?? donation.createdAt
          : donation.donatedAt ?? donation.createdAt
        ).toISOString(),
        displaySource(donation),
        donation.memberIdSnapshot ?? donation.user?.profile?.memberId ?? "",
        displayName(donation),
        donation.donorEmailSnapshot ?? donation.user?.email ?? "",
        donation.category.label,
        displayDonationType(donation),
        donation.directStatus ?? "",
        formatCurrencyFromCents(gross, donation.currency),
        formatCurrencyFromCents(refunded, donation.currency),
        formatCurrencyFromCents(net, donation.currency),
        donation.currency.toUpperCase(),
        donation.status,
        donation.source === "ONLINE"
          ? donation.stripeInvoiceId ?? donation.stripePaymentIntentId ?? ""
          : "",
        donation.event?.title ?? "",
        donation.collectionLabel ?? "",
        donation.manualReference ?? "",
        actorName(donation.enteredBy),
        actorName(donation.verifiedBy),
        donation.verifiedAt?.toISOString() ?? "",
        actorName(donation.cancelledBy),
        donation.cancelledAt?.toISOString() ?? "",
        donation.cancellationReason ?? "",
      ]),
    )
  }

  return `\uFEFF${lines.join("\n")}\n`
}

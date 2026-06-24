import "server-only"

export const DONATION_CURRENCY = (
  process.env.DONATION_CURRENCY?.trim().toLowerCase() || "eur"
)

const DEFAULT_MIN_CENTS = 500
const DEFAULT_MAX_CENTS = 500000

function readPositiveInteger(name: string, fallback: number) {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const value = Number(raw)

  return Number.isInteger(value) && value > 0 ? value : fallback
}

export function getDonationAmountLimits() {
  const minCents = readPositiveInteger("DONATION_MIN_CENTS", DEFAULT_MIN_CENTS)
  const maxCents = readPositiveInteger("DONATION_MAX_CENTS", DEFAULT_MAX_CENTS)

  return {
    minCents,
    maxCents: Math.max(minCents, maxCents),
  }
}

export function formatCurrencyFromCents(
  amountCents: number,
  currency = DONATION_CURRENCY,
) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100)
}

export function normalizeCurrency(value: unknown) {
  if (typeof value !== "string") return DONATION_CURRENCY
  const currency = value.trim().toLowerCase()

  return currency || DONATION_CURRENCY
}

export function assertSupportedCurrency(currency: string) {
  if (currency !== DONATION_CURRENCY) {
    throw new Error("Devise non prise en charge.")
  }
}

export function normalizeAmountCents(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null
  }

  const { minCents, maxCents } = getDonationAmountLimits()

  if (value < minCents || value > maxCents) return null

  return value
}

export function eurosToCents(value: unknown) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return null

  const amountCents = Math.round(numberValue * 100)

  return normalizeAmountCents(amountCents)
}

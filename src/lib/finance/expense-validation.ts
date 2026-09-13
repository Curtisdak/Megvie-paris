export const expenseCategories = {
  PREMISES: "Locaux et charges",
  EQUIPMENT: "Matériel et entretien",
  EVENTS: "Cultes et événements",
  SOLIDARITY: "Entraide et missions",
  TRANSPORT: "Transport",
  SERVICES: "Services et frais",
  OTHER: "Autre",
} as const

export type ExpenseCategory = keyof typeof expenseCategories

export function parseExpenseAmount(value: unknown): number | null {
  if (typeof value !== "string") return null
  const raw = value.trim().replace(",", ".")
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(raw)) return null
  const [whole, fraction = ""] = raw.split(".")
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
  return cents > 0 && cents <= 2147483647 ? cents : null
}

export function parseExpenseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return value >= "1900-01-01" &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? date
    : null
}

export function validateExpense(form: FormData) {
  const text = (name: string, max: number) => {
    const value = form.get(name)
    return typeof value === "string" ? value.trim().slice(0, max) : ""
  }
  const title = text("title", 160)
  const category = text("category", 30)
  const amountCents = parseExpenseAmount(form.get("amount"))
  const occurredAt = parseExpenseDate(form.get("occurredAt"))
  if (title.length < 2)
    throw new Error("Indiquez un libellé de deux caractères minimum.")
  if (!Object.hasOwn(expenseCategories, category))
    throw new Error("Sélectionnez une catégorie.")
  if (amountCents === null)
    throw new Error("Saisissez un montant positif avec deux décimales maximum.")
  if (!occurredAt) throw new Error("Indiquez une date valide.")
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Paris",
  }).format(new Date())
  if (occurredAt.toISOString().slice(0, 10) > today)
    throw new Error(
      "Une dépense doit correspondre à un paiement déjà effectué.",
    )
  return {
    title,
    category,
    amountCents,
    occurredAt,
    payee: text("payee", 160) || null,
    reference: text("reference", 160) || null,
    note: text("note", 2000) || null,
  }
}

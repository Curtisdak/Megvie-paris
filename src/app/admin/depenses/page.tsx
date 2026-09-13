import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ReceiptText,
  ArrowUpRight,
} from "lucide-react"
import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { requireFinancePermission } from "@/lib/finance/data"
import {
  expenseCategories,
  parseExpenseDate,
} from "@/lib/finance/expense-validation"
import { formatCurrencyFromCents } from "@/lib/finance/config"
import { AdminPageHero } from "@/components/admin/admin-page-hero"
import { ExpenseDialog } from "@/components/admin/expense-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireFinancePermission("expenses.manage", "/admin/depenses")
  const params = Object.fromEntries(
    Object.entries(await searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  )
  const query = params.q?.trim().slice(0, 160)
  const from = parseExpenseDate(params.from)
  const to = parseExpenseDate(params.to)
  const where: Prisma.FinanceExpenseWhereInput = {
    status:
      params.status === "all"
        ? undefined
        : params.status === "CANCELLED"
          ? "CANCELLED"
          : "RECORDED",
    category:
      params.category && Object.hasOwn(expenseCategories, params.category)
        ? params.category
        : undefined,
    occurredAt:
      from || to ? { gte: from ?? undefined, lte: to ?? undefined } : undefined,
    OR: query
      ? ["title", "payee", "reference"].map((field) => ({
          [field]: { contains: query, mode: "insensitive" },
        }))
      : undefined,
  }
  const [count, aggregate] = await Promise.all([
    prisma.financeExpense.count({ where }),
    prisma.financeExpense.aggregate({
      where: { AND: [where, { status: "RECORDED" }] },
      _sum: { amountCents: true },
    }),
  ])
  const pages = Math.max(1, Math.ceil(count / 12))
  const page = Math.min(
    pages,
    Math.max(1, Math.floor(Number(params.page)) || 1),
  )
  const expenses = await prisma.financeExpense.findMany({
    where,
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: 12,
    skip: (page - 1) * 12,
  })
  const pageHref = (next: number) => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params))
      if (value && key !== "page") query.set(key, value)
    query.set("page", String(next))
    return `/admin/depenses?${query}`
  }
  const selectClass =
    "h-11 min-w-0 rounded-lg border border-input bg-background px-3 text-sm"
  return (
    <div className="space-y-5">
      <AdminPageHero
        eyebrow="Finance"
        title="Dépenses"
        description="Le suivi des paiements de l'église, au même endroit."
        action={<ExpenseDialog />}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-white/10">
        <div>
          <p className="text-sm text-muted-foreground">
            Dépenses comptabilisées dans cette sélection
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatCurrencyFromCents(aggregate._sum.amountCents ?? 0, "eur")}
          </p>
        </div>
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/admin/finance">
            Vue financière
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
      <form className="grid gap-3 border-b border-zinc-200 pb-5 dark:border-white/10 sm:grid-cols-2 xl:grid-cols-6">
        <label className="grid gap-1.5 text-xs font-medium sm:col-span-2">
          Recherche
          <Input
            name="q"
            defaultValue={query}
            placeholder="Libellé, bénéficiaire, référence..."
            className="h-11"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium">
          Catégorie
          <select
            name="category"
            defaultValue={params.category ?? ""}
            className={selectClass}
          >
            <option value="">Toutes les catégories</option>
            {Object.entries(expenseCategories).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-medium">
          Statut
          <select
            name="status"
            defaultValue={params.status ?? "RECORDED"}
            className={selectClass}
          >
            <option value="RECORDED">Comptabilisées</option>
            <option value="CANCELLED">Annulées</option>
            <option value="all">Tous les statuts</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-medium">
          Du
          <Input
            type="date"
            name="from"
            defaultValue={params.from}
            className="h-11"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium">
          Au
          <Input
            type="date"
            name="to"
            defaultValue={params.to}
            className="h-11"
          />
        </label>
        <div className="flex gap-2 sm:col-span-2 xl:col-span-6">
          <Button type="submit" className="min-h-11">
            <Search className="size-4" />
            Rechercher
          </Button>
          <Button asChild variant="ghost" className="min-h-11">
            <Link href="/admin/depenses">Réinitialiser</Link>
          </Button>
        </div>
      </form>
      <section aria-label="Historique des dépenses" className="space-y-3">
        <p className="text-sm text-muted-foreground">{count} dépense(s)</p>
        {expenses.map((expense) => {
          const cancelled = expense.status === "CANCELLED"
          const value = {
            ...expense,
            occurredAt: expense.occurredAt.toISOString().slice(0, 10),
          }
          return (
            <article
              key={expense.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 basis-48">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words font-semibold">
                      {expense.title}
                    </h2>
                    {cancelled && (
                      <span className="text-xs text-red-600 dark:text-red-300">
                        Annulée
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {expenseCategories[
                      expense.category as keyof typeof expenseCategories
                    ] ?? expense.category}{" "}
                    ·{" "}
                    {expense.occurredAt.toLocaleDateString("fr-FR", {
                      timeZone: "UTC",
                    })}
                  </p>
                  {expense.payee && (
                    <p className="mt-1 break-words text-sm">{expense.payee}</p>
                  )}
                </div>
                <p
                  className={`text-xl font-semibold tabular-nums ${cancelled ? "text-muted-foreground line-through" : "text-rose-700 dark:text-rose-300"}`}
                >
                  {formatCurrencyFromCents(expense.amountCents, "eur")}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-white/10">
                <p className="min-w-0 break-all text-xs text-muted-foreground">
                  {expense.reference || "Sans référence"}
                </p>
                {!cancelled && (
                  <div className="flex gap-2">
                    <ExpenseDialog expense={value} />
                    <ExpenseDialog expense={value} cancel />
                  </div>
                )}
              </div>
              {(expense.note || expense.cancellationReason) && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-muted-foreground">
                    Détails
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap break-words">
                    {expense.note}
                  </p>
                  {expense.cancellationReason && (
                    <p className="mt-2">Motif : {expense.cancellationReason}</p>
                  )}
                </details>
              )}
            </article>
          )
        })}
        {!expenses.length && (
          <div className="py-12 text-center">
            <ReceiptText className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="font-medium">Aucune dépense dans cette sélection</p>
          </div>
        )}
      </section>
      <nav
        aria-label="Pagination des dépenses"
        className="flex items-center justify-between border-t pt-4"
      >
        {page > 1 ? (
          <Button asChild variant="outline" size="icon">
            <Link href={pageHref(page - 1)} aria-label="Page précédente">
              <ChevronLeft />
            </Link>
          </Button>
        ) : (
          <Button
            disabled
            variant="outline"
            size="icon"
            aria-label="Page précédente"
          >
            <ChevronLeft />
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          {page} / {pages}
        </span>
        {page < pages ? (
          <Button asChild variant="outline" size="icon">
            <Link href={pageHref(page + 1)} aria-label="Page suivante">
              <ChevronRight />
            </Link>
          </Button>
        ) : (
          <Button
            disabled
            variant="outline"
            size="icon"
            aria-label="Page suivante"
          >
            <ChevronRight />
          </Button>
        )}
      </nav>
    </div>
  )
}

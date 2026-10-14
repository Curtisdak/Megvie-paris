"use client"

import Link from "next/link"
import { FinanceMonthlyChart } from "@/components/admin/finance-monthly-chart"
import {
  ArrowUpRight,
  Banknote,
  CreditCard,
  ReceiptText,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { expenseCategories } from "@/lib/finance/expense-validation"
import type { getFinanceAnalytics } from "@/lib/finance/analytics"

type Analytics = Awaited<ReturnType<typeof getFinanceAnalytics>>
const money = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    value / 100,
  )
export function FinanceOverview({ data }: { data: Analytics }) {
  const { totals } = data
  const cards = [
    {
      label: "Dons directs",
      value: totals.directCents,
      helper: "Dons vérifiés",
      icon: Banknote,
      color: "text-emerald-700 dark:text-emerald-300",
      href: "/admin/dons/directs",
    },
    {
      label: "Via Stripe",
      value: totals.stripeCents,
      helper: "Après remboursements",
      icon: CreditCard,
      color: "text-sky-700 dark:text-sky-300",
      href: "/admin/finance?source=ONLINE",
    },
    {
      label: "Total dépenses",
      value: totals.expenseCents,
      helper: "Paiements comptabilisés",
      icon: ReceiptText,
      color: "text-rose-700 dark:text-rose-300",
      href: "/admin/depenses",
    },
    {
      label: "Total restant",
      value: totals.balanceCents,
      helper: "Dons nets moins dépenses",
      icon: Wallet,
      color:
        totals.balanceCents < 0
          ? "text-red-700 dark:text-red-300"
          : "text-zinc-950 dark:text-white",
      href: null,
    },
  ]
  return (
    <section aria-label="Analyse financière" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">
          Vue d&apos;ensemble{" "}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Depuis le début · EUR
          </span>
        </h2>
        {!data.liveMode && (
          <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
            Stripe en mode test
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, helper, icon: Icon, color, href }) => (
          <article
            key={label}
            className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`size-4 shrink-0 ${color}`} />
            </div>
            <p
              className={`mt-3 break-words text-2xl font-semibold tabular-nums ${color}`}
            >
              {money(value)}
            </p>
            {href ? (
              <Link
                href={href}
                className="mt-2 inline-flex min-h-8 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {helper}
                <ArrowUpRight className="size-3" />
              </Link>
            ) : (
              <p className="mt-2 py-2 text-xs text-muted-foreground">
                {helper}
              </p>
            )}
          </article>
        ))}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Solde du registre en euros, avant frais Stripe non saisis en dépenses.
        Remboursements déduits : {money(totals.refundedCents)}. Les dons en
        attente et les dépenses annulées sont exclus.
      </p>
      <div className="grid gap-6 border-y border-zinc-200 py-5 dark:border-white/10 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <FinanceMonthlyChart months={data.months} />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Répartition des dépenses</h3>
          <p className="mt-1 text-xs text-muted-foreground">Depuis le début</p>
          <div className="mt-5 space-y-4">
            {data.categories.map(([category, amount]) => (
              <div key={category}>
                <div className="flex flex-wrap justify-between gap-2 text-xs">
                  <span>
                    {expenseCategories[
                      category as keyof typeof expenseCategories
                    ] ?? category}
                  </span>
                  <span className="font-medium tabular-nums">
                    {money(amount)} ·{" "}
                    {Math.round(
                      (amount / Math.max(1, totals.expenseCents)) * 100,
                    )}{" "}
                    %
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                  <div
                    className="h-full bg-rose-400"
                    style={{
                      width: `${(amount / Math.max(1, totals.expenseCents)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {!data.categories.length && (
              <p className="py-8 text-sm text-muted-foreground">
                Aucune dépense comptabilisée.
              </p>
            )}
          </div>
          <Button asChild variant="outline" className="mt-5 min-h-11 w-full">
            <Link href="/admin/depenses">
              Historique des dépenses
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

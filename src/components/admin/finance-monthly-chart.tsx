"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import type { getFinanceAnalytics } from "@/lib/finance/analytics"

type Month = Awaited<ReturnType<typeof getFinanceAnalytics>>["months"][number]
const money = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value / 100)
const date = (month: string) => new Date(`${month}-01T12:00:00Z`)
const monthName = (month: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date(month))
const series = [
  {
    key: "directCents",
    label: "Dons directs",
    color: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  {
    key: "stripeCents",
    label: "Via Stripe",
    color: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
  },
  {
    key: "expenseCents",
    label: "Dépenses",
    color: "bg-rose-400",
    text: "text-rose-700 dark:text-rose-300",
  },
] as const

export function FinanceMonthlyChart({ months }: { months: Month[] }) {
  const [range, setRange] = useState(6)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const descriptionId = useId()
  const points = months.slice(-range)
  const selected =
    points.find((point) => point.month === selectedMonth) ??
    [...points]
      .reverse()
      .find(
        (point) => point.directCents || point.stripeCents || point.expenseCents,
      ) ??
    points.at(-1)
  const maximum = Math.max(
    0,
    ...points.flatMap((point) => series.map(({ key }) => point[key])),
  )
  const magnitude = maximum ? 10 ** Math.floor(Math.log10(maximum)) : 10000
  const ceiling = maximum ? Math.ceil(maximum / magnitude) * magnitude : 10000
  const periodBalance = points.reduce(
    (total, point) => total + point.netCents,
    0,
  )

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Évolution des finances</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Solde sur la période :{" "}
            <span
              className={
                periodBalance < 0
                  ? "font-semibold text-rose-700 dark:text-rose-300"
                  : "font-semibold text-foreground"
              }
            >
              {money(periodBalance)}
            </span>
          </p>
        </div>
        <div
          className="flex shrink-0 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-white/5"
          role="group"
          aria-label="Période du graphique"
        >
          {[3, 6, 12].map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              className={`h-11 px-3 ${range === value ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-muted-foreground"}`}
              variant="ghost"
              onClick={() => setRange(value)}
              aria-pressed={range === value}
            >
              {value} mois
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {series.map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${color}`} aria-hidden />
            {label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: Math.max(280, range * 42 + 52) }}>
          <div className="flex h-48 gap-2 sm:h-56">
            <div
              className="relative w-12 shrink-0 text-right text-[10px] text-muted-foreground"
              aria-hidden
            >
              {[1, 0.5, 0].map((ratio) => (
                <span
                  key={ratio}
                  className="absolute right-0"
                  style={{
                    bottom: `${ratio * 100}%`,
                    transform:
                      ratio === 1 ? "translateY(100%)" : "translateY(50%)",
                  }}
                >
                  {new Intl.NumberFormat("fr-FR", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format((ceiling * ratio) / 100)}{" "}
                  €
                </span>
              ))}
            </div>
            <div className="relative min-w-0 flex-1">
              <div
                className="pointer-events-none absolute inset-0 flex flex-col justify-between"
                aria-hidden
              >
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="border-t border-dashed border-zinc-200 dark:border-white/10"
                  />
                ))}
              </div>
              <div
                className="relative grid h-full gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${points.length || 1}, minmax(0, 1fr))`,
                }}
              >
                {points.map((point) => (
                  <button
                    key={point.month}
                    type="button"
                    onClick={() => setSelectedMonth(point.month)}
                    aria-pressed={selected?.month === point.month}
                    aria-describedby={descriptionId}
                    aria-label={`${monthName(point.month)} : ${series.map(({ key, label }) => `${label} ${money(point[key])}`).join(", ")}`}
                    title={`${monthName(point.month)} · Solde ${money(point.netCents)}`}
                    className={`group flex h-full min-w-0 items-end justify-center gap-1 rounded-t-sm px-1 outline-none transition-colors hover:bg-zinc-100/70 focus-visible:ring-2 focus-visible:ring-teal-500 dark:hover:bg-white/5 ${selected?.month === point.month ? "bg-zinc-100/70 dark:bg-white/5" : ""}`}
                  >
                    {series.map(({ key, color }) => (
                      <span
                        key={key}
                        aria-hidden
                        className={`w-3 max-w-[27%] rounded-t-sm transition-[height] duration-500 motion-reduce:transition-none sm:w-5 ${color}`}
                        style={{
                          height: `${(Math.max(0, point[key]) / ceiling) * 100}%`,
                          minHeight: point[key] > 0 ? 2 : 0,
                        }}
                      />
                    ))}
                  </button>
                ))}
              </div>
              {!maximum && (
                <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-muted-foreground">
                  Aucun mouvement sur cette période.
                </p>
              )}
            </div>
          </div>
          <div
            className="ml-14 mt-2 grid gap-1.5 text-center text-[10px] leading-4 text-muted-foreground"
            style={{
              gridTemplateColumns: `repeat(${points.length || 1}, minmax(0, 1fr))`,
            }}
            aria-hidden
          >
            {points.map((point) => (
              <span key={point.month}>
                <span className="block">
                  {new Intl.DateTimeFormat("fr-FR", {
                    month: "short",
                    timeZone: "UTC",
                  }).format(date(point.month))}
                </span>
                <span>{date(point.month).getUTCFullYear()}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      {selected && (
        <div
          id={descriptionId}
          className="border-y border-border py-3"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="mb-3 text-xs font-semibold capitalize">
            {monthName(selected.month)}
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            {series.map(({ key, label, text }) => (
              <div key={key} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd
                  className={`mt-1 break-words text-sm font-semibold tabular-nums ${text}`}
                >
                  {money(selected[key])}
                </dd>
              </div>
            ))}
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Solde du mois</dt>
              <dd
                className={`mt-1 break-words text-sm font-semibold tabular-nums ${selected.netCents < 0 ? "text-rose-700 dark:text-rose-300" : "text-foreground"}`}
              >
                {money(selected.netCents)}
              </dd>
            </div>
          </dl>
        </div>
      )}
      <details>
        <summary className="min-h-11 cursor-pointer py-3 text-xs font-medium">
          Chiffres mensuels
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <caption className="sr-only">
              Dons directs, Stripe, dépenses et solde mensuel en euros
            </caption>
            <thead>
              <tr>
                {["Mois", "Direct", "Stripe", "Dépenses", "Solde"].map(
                  (label) => (
                    <th
                      key={label}
                      scope="col"
                      className="whitespace-nowrap px-2 py-3 font-medium"
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((point) => (
                <tr key={point.month} className="border-t border-border">
                  <th
                    scope="row"
                    className="whitespace-nowrap px-2 py-3 font-medium capitalize"
                  >
                    {monthName(point.month)}
                  </th>
                  {[
                    point.directCents,
                    point.stripeCents,
                    point.expenseCents,
                    point.netCents,
                  ].map((value, index) => (
                    <td
                      key={index}
                      className="whitespace-nowrap px-2 py-3 tabular-nums"
                    >
                      {money(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

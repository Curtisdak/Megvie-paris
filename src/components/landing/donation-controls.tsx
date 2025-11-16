"use client"

import { type ChangeEvent } from "react"
import { MAX_DONATION, MIN_DONATION } from "@/lib/donation"

type DonationControlsProps = {
  amount: number
  formattedAmount: string
  onSliderChange: (value: number) => void
  onManualChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export function DonationControls({
  amount,
  formattedAmount,
  onSliderChange,
  onManualChange,
}: DonationControlsProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
            Montant du don
          </p>
          <p className="text-sm text-zinc-500">
            Ajustez le curseur ou saisissez un montant
          </p>
        </div>
        <p className="text-3xl font-semibold text-amber-600 dark:text-amber-300">
          {formattedAmount}
        </p>
      </div>
      <input
        type="range"
        min={MIN_DONATION}
        max={MAX_DONATION}
        value={amount}
        onChange={(event) => onSliderChange(Number(event.target.value))}
        className="mt-6 h-2 w-full cursor-pointer rounded-full bg-amber-200 accent-amber-600"
        aria-label="Choisir le montant du don"
      />
      <div className="mt-4 flex items-center gap-3">
        <input
          type="number"
          min={MIN_DONATION}
          max={MAX_DONATION}
          value={amount}
          onChange={onManualChange}
          className="w-full rounded-2xl border border-zinc-300 bg-transparent px-4 py-2 text-lg font-medium dark:border-zinc-700"
          aria-label="Montant du don en euros"
        />
        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          EUR
        </span>
      </div>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Entre {MIN_DONATION} € et {MAX_DONATION} € par transaction.
      </p>
    </div>
  )
}

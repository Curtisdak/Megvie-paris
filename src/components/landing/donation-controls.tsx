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
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Montant du don
          </p>
        </div>
        <p className="text-2xl font-semibold text-amber-600 dark:text-amber-300 sm:text-3xl">
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
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-base font-medium"
          aria-label="Montant du don en euros"
        />
        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          EUR
        </span>
      </div>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Entre {MIN_DONATION} EUR et {MAX_DONATION} EUR par transaction.
      </p>
    </div>
  )
}

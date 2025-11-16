"use client"

import { type ChangeEvent, useMemo, useState } from "react"
import { MAX_DONATION, MIN_DONATION } from "@/lib/donation"

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

export function useDonationAmount(initialAmount = 50) {
  const [amount, setAmount] = useState(initialAmount)

  const clampAmount = (value: number) =>
    Math.min(MAX_DONATION, Math.max(MIN_DONATION, Math.round(value)))

  const updateAmount = (value: number) => {
    if (Number.isNaN(value)) return
    setAmount(clampAmount(value))
  }

  const handleManualChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value
    if (rawValue === "") {
      setAmount(MIN_DONATION)
      return
    }
    updateAmount(Number(rawValue))
  }

  const formattedAmount = useMemo(
    () => currencyFormatter.format(amount),
    [amount],
  )

  return {
    amount,
    formattedAmount,
    updateAmount,
    handleManualChange,
  }
}

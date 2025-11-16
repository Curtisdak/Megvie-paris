"use client"

import { useCheckoutStatus } from "@/hooks/use-checkout-status"

export function CheckoutStatusListener() {
  useCheckoutStatus()
  return null
}

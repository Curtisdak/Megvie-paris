"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

export function useCheckoutStatus() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const statusValue = searchParams.get("status")
    if (!statusValue) return

    const amountValue = searchParams.get("amount")

    if (statusValue === "success") {
      toast.success("Merci pour votre don !", {
        description: amountValue
          ? `Votre paiement de ${amountValue} € a bien ete confirme.`
          : "Votre paiement a bien ete confirme.",
      })
    } else if (statusValue === "cancel") {
      toast.info("Paiement interrompu", {
        description:
          "La fenetre Stripe a ete fermee. Vous pouvez retenter plus tard.",
      })
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("status")
      url.searchParams.delete("amount")
      window.history.replaceState(null, "", url.toString())
    }
  }, [searchParams])
}

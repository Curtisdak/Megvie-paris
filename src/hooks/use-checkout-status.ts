"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

type CheckoutSessionStatus = {
  status?: string | null
  paymentStatus?: string | null
  amountTotal?: number | null
  currency?: string | null
  ledgerStatus?: string | null
  error?: string
}

function clearCheckoutParams() {
  if (typeof window === "undefined") return

  const url = new URL(window.location.href)
  url.searchParams.delete("status")
  url.searchParams.delete("amount")
  url.searchParams.delete("session_id")
  url.searchParams.delete("checkout_status")
  window.history.replaceState(null, "", url.toString())
}

function formatStripeAmount(
  amountTotal?: number | null,
  currency?: string | null,
) {
  if (typeof amountTotal !== "number" || !currency) {
    return null
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountTotal / 100)
}

export function useCheckoutStatus() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const statusValue =
      searchParams.get("status") ?? searchParams.get("checkout_status")
    const sessionId = searchParams.get("session_id")

    if (!statusValue && !sessionId) return

    if (sessionId) {
      let isActive = true
      const loadingToast = toast.loading("Verification du paiement Stripe...")

      const verifyCheckoutSession = async () => {
        try {
          const response = await fetch(
            `/api/donate?session_id=${encodeURIComponent(sessionId)}`,
          )
          const data = (await response.json().catch(() => null)) as
            | CheckoutSessionStatus
            | null

          if (!isActive) return

          if (!response.ok) {
            throw new Error(
              data?.error ?? "Impossible de verifier le paiement Stripe.",
            )
          }

          if (data?.ledgerStatus === "SUCCEEDED") {
            const formattedAmount = formatStripeAmount(
              data.amountTotal,
              data.currency,
            )

            toast.success("Merci pour votre don !", {
              description: formattedAmount
                ? `Votre paiement de ${formattedAmount} a bien ete confirme.`
                : "Votre paiement a bien ete confirme.",
            })
          } else if (data?.paymentStatus === "paid") {
            toast.info("Confirmation en cours", {
              description:
                "Stripe a recu le paiement. L'historique sera mis a jour apres traitement du webhook.",
            })
          } else if (data?.status === "open") {
            toast.info("Paiement en attente", {
              description:
                "La session Stripe est encore ouverte. Vous pouvez reprendre le paiement depuis Stripe.",
            })
          } else {
            toast.info("Paiement non confirme", {
              description:
                "Stripe n'a pas confirme le paiement. Vous pouvez retenter le don.",
            })
          }
        } catch (error) {
          if (!isActive) return

          const message =
            error instanceof Error
              ? error.message
              : "Impossible de verifier le paiement Stripe."

          toast.error("Verification du paiement impossible", {
            description: message,
          })
        } finally {
          if (isActive) {
            toast.dismiss(loadingToast)
            clearCheckoutParams()
          }
        }
      }

      void verifyCheckoutSession()

      return () => {
        isActive = false
        toast.dismiss(loadingToast)
      }
    }

    if (statusValue === "success") {
      toast.info("Retour Stripe recu", {
        description:
          "La confirmation finale du don arrive par webhook Stripe.",
      })
    } else if (statusValue === "cancel" || statusValue === "canceled") {
      toast.info("Paiement interrompu", {
        description:
          "La fenetre Stripe a ete fermee. Vous pouvez retenter plus tard.",
      })
    }

    clearCheckoutParams()
  }, [searchParams])
}

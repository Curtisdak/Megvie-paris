"use client"

import { useState } from "react"
import { CreditCard } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function CustomerPortalButton() {
  const [isLoading, setIsLoading] = useState(false)

  const openPortal = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
      })
      const data = (await response.json().catch(() => null)) as {
        url?: string
        error?: string
      } | null

      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? "Portail Stripe indisponible.")
      }

      window.location.href = data.url
    } catch (error) {
      toast.error("Impossible d'ouvrir Stripe", {
        description:
          error instanceof Error
            ? error.message
            : "Merci de reessayer plus tard.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={openPortal}
      disabled={isLoading}
      className="rounded-full"
    >
      <CreditCard className="h-4 w-4" aria-hidden />
      {isLoading ? "Ouverture..." : "Gerer mon don mensuel"}
    </Button>
  )
}

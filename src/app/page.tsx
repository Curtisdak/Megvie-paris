"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { HeroSection } from "@/components/landing/hero-section"
import { HighlightsSection } from "@/components/landing/highlights-section"
import { LeadersSection } from "@/components/landing/leaders-section"
import { SiteHeader } from "@/components/landing/site-header"
import { ClosingCta } from "@/components/landing/closing-cta"
import { WelcomeOverlay } from "@/components/welcome-overlay"
import { useDonationAmount } from "@/hooks/use-donation-amount"
import { useCheckoutStatus } from "@/hooks/use-checkout-status"
import { createDonationSession } from "@/lib/donation-client"

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const { amount, formattedAmount, updateAmount, handleManualChange } =
    useDonationAmount()

  useCheckoutStatus()

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowWelcome(false), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [])

  const handleDonationClick = async () => {
    setIsProcessing(true)
    const loadingToast = toast.loading("Creation du paiement Stripe...")

    try {
      const url = await createDonationSession(amount)
      toast.dismiss(loadingToast)
      toast.success("Redirection vers Stripe...")
      window.location.href = url
    } catch (error) {
      console.error(error)
      toast.dismiss(loadingToast)
      toast.error("Impossible d'ouvrir le paiement Stripe.", {
        description: "Merci de verifier votre connexion et de reessayer.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-4 py-10 font-sans text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50">
      <WelcomeOverlay visible={showWelcome} />
      <main className="relative z-0 mx-auto flex w-full max-w-6xl flex-col gap-16">
        <SiteHeader />
        <HeroSection
          amount={amount}
          formattedAmount={formattedAmount}
          isProcessing={isProcessing}
          onSliderChange={updateAmount}
          onManualChange={handleManualChange}
          onDonate={handleDonationClick}
        />
        <HighlightsSection />
        <LeadersSection />
        <ClosingCta
          isProcessing={isProcessing}
          formattedAmount={formattedAmount}
          onDonate={handleDonationClick}
        />
      </main>
    </div>
  )
}

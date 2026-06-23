"use client"

import { Suspense, useEffect, useState } from "react"
import { toast } from "sonner"
import { CheckoutStatusListener } from "@/components/checkout-status-listener"
import { Footer } from "@/components/footer"
import { ChurchLifeSection } from "@/components/landing/church-life-section"
import { ClosingCta } from "@/components/landing/closing-cta"
import { HeroSection } from "@/components/landing/hero-section"
import { LeadersSection } from "@/components/landing/leaders-section"
import { PwaEngagementSection } from "@/components/pwa/pwa-engagement-section"
import { WelcomeOverlay } from "@/components/welcome-overlay"
import { useDonationAmount } from "@/hooks/use-donation-amount"
import { createDonationSession } from "@/lib/donation-client"

export function HomePageClient({ children }: { children?: React.ReactNode }) {
  const [showWelcome, setShowWelcome] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const { amount, formattedAmount, updateAmount, handleManualChange } =
    useDonationAmount()

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowWelcome(false), 1000)
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
      const message =
        error instanceof Error
          ? error.message
          : "Merci de verifier votre connexion et de reessayer."

      toast.dismiss(loadingToast)
      toast.error("Impossible d'ouvrir le paiement Stripe.", {
        description: message,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="app-edge-to-edge relative min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#ecfeff_32%,#fff_58%,#fafafa_100%)] py-5 font-sans text-zinc-900 dark:bg-[linear-gradient(180deg,#09090b_0%,#172554_34%,#111827_62%,#09090b_100%)] dark:text-zinc-50 sm:py-10">
      <Suspense fallback={null}>
        <CheckoutStatusListener />
      </Suspense>
      <WelcomeOverlay visible={showWelcome} />
      <main className="relative z-0 mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-10">
        <HeroSection
          amount={amount}
          formattedAmount={formattedAmount}
          isProcessing={isProcessing}
          onSliderChange={updateAmount}
          onManualChange={handleManualChange}
          onDonate={handleDonationClick}
        />
        <ChurchLifeSection />
        {children}
        <PwaEngagementSection />
        <LeadersSection />
        <ClosingCta
          isProcessing={isProcessing}
          formattedAmount={formattedAmount}
          onDonate={handleDonationClick}
        />
        <Footer />
      </main>
    </div>
  )
}

"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, BookOpen, Sun, UserRound } from "lucide-react"
import { toast } from "sonner"
import { CheckoutStatusListener } from "@/components/checkout-status-listener"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/landing/hero-section"
import { LeadersSection } from "@/components/landing/leaders-section"
import { PwaEngagementSection } from "@/components/pwa/pwa-engagement-section"
import { useDonationAmount } from "@/hooks/use-donation-amount"
import { createDonationSession } from "@/lib/donation-client"

export function HomePageClient({
  featuredContent,
  children,
}: {
  featuredContent?: React.ReactNode
  children?: React.ReactNode
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { amount, formattedAmount, updateAmount, handleManualChange } =
    useDonationAmount()

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
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={null}>
        <CheckoutStatusListener />
      </Suspense>
      <main className="relative z-0 mx-auto flex w-full max-w-[1440px] flex-col">
        {featuredContent}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-card">
          {[
            { href: "/bible", label: "Lire la Bible", icon: BookOpen },
            { href: "/verset-du-jour", label: "Verset du jour", icon: Sun },
            { href: "/espace-membre", label: "Mon espace", icon: UserRound },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-w-0 flex-col items-center gap-2 px-2 py-5 text-center text-xs font-medium transition hover:bg-muted sm:flex-row sm:justify-center sm:gap-3 sm:text-sm"
            >
              <Icon
                className="size-5 shrink-0 text-teal-700 dark:text-teal-300"
                aria-hidden
              />
              <span>{label}</span>
              <ArrowUpRight
                className="hidden size-4 text-muted-foreground sm:block"
                aria-hidden
              />
            </Link>
          ))}
        </div>
        <div className="space-y-10 px-4 py-8 sm:space-y-12 sm:px-8">
          <HeroSection
            amount={amount}
            formattedAmount={formattedAmount}
            isProcessing={isProcessing}
            onSliderChange={updateAmount}
            onManualChange={handleManualChange}
            onDonate={handleDonationClick}
          />
          {children}
          <PwaEngagementSection />
          <LeadersSection />
          <Footer />
        </div>
      </main>
    </div>
  )
}

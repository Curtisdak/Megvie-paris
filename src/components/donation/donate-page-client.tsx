"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { HeartHandshake, Lock, Mail, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { CheckoutStatusListener } from "@/components/checkout-status-listener"
import { DonationControls } from "@/components/landing/donation-controls"
import { Button } from "@/components/ui/button"
import { useDonationAmount } from "@/hooks/use-donation-amount"
import { createDonationSession } from "@/lib/donation-client"

const donationImpacts = [
  {
    label: "Repas solidaires",
    description: "Aider les familles et les personnes accompagnees.",
  },
  {
    label: "Cultes et enseignements",
    description: "Soutenir la vie spirituelle et l'accueil du dimanche.",
  },
  {
    label: "Jeunesse et communaute",
    description: "Investir dans les activites, visites et accompagnements.",
  },
]

export function DonatePageClient() {
  const [isProcessing, setIsProcessing] = useState(false)
  const { amount, formattedAmount, updateAmount, handleManualChange } =
    useDonationAmount(50)

  const handleDonationClick = async () => {
    setIsProcessing(true)
    const loadingToast = toast.loading("Creation du paiement Stripe...")

    try {
      const url = await createDonationSession(amount)
      toast.dismiss(loadingToast)
      toast.success("Redirection vers Stripe...")
      window.location.href = url
    } catch (error) {
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
    <>
      <Suspense fallback={null}>
        <CheckoutStatusListener />
      </Suspense>

      <section className="overflow-hidden rounded-[28px] border border-amber-100 bg-white/95 shadow-xl dark:border-amber-400/25 dark:bg-zinc-900/85 sm:rounded-[32px]">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex min-h-[260px] flex-col justify-between bg-gradient-to-br from-amber-700 via-amber-600 to-amber-400 p-6 text-white sm:min-h-[320px] sm:p-8">
            <div>
              <span className="inline-flex rounded-full bg-white/15 p-3">
                <HeartHandshake className="h-6 w-6" />
              </span>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.35em] text-white/80">
                Soutenir MegVie Paris
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
                Faire un don
              </h1>
            </div>
            <p className="mt-8 max-w-sm text-sm leading-6 text-white/85">
              Votre generosite aide l&apos;eglise a accueillir, servir et
              annoncer l&apos;esperance avec constance.
            </p>
          </div>

          <div className="p-5 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
              <Lock className="h-4 w-4" />
              Paiement securise avec Stripe
            </div>

            <h2 className="mt-6 text-2xl font-semibold text-zinc-900 dark:text-white sm:text-3xl">
              Choisissez le montant de votre soutien.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
              Vous serez redirige vers Stripe pour finaliser le paiement. MegVie
              Paris ne conserve pas vos donnees bancaires.
            </p>

            <div className="mt-6">
              <DonationControls
                amount={amount}
                formattedAmount={formattedAmount}
                onManualChange={handleManualChange}
                onSliderChange={updateAmount}
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-13 rounded-full bg-amber-600 px-8 text-base font-semibold text-white shadow-md hover:bg-amber-500"
                onClick={handleDonationClick}
                disabled={isProcessing}
                aria-busy={isProcessing}
              >
                {isProcessing
                  ? "Redirection en cours..."
                  : `Donner ${formattedAmount}`}
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-13 rounded-full border-zinc-300 bg-white/80 px-8 text-base dark:border-zinc-700 dark:bg-zinc-950/40"
              >
                <Link href="/contact">
                  <Mail className="h-4 w-4" />
                  Nous contacter
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {donationImpacts.map((item, index) => (
          <motion.article
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            className="rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100">
              <Sparkles className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
              {item.label}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {item.description}
            </p>
          </motion.article>
        ))}
      </section>
    </>
  )
}

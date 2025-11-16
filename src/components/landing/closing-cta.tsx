"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { fadeInUp } from "@/lib/motion"

type ClosingCtaProps = {
  isProcessing: boolean
  formattedAmount: string
  onDonate: () => void
}

export function ClosingCta({
  isProcessing,
  formattedAmount,
  onDonate,
}: ClosingCtaProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      variants={fadeInUp}
      transition={{ duration: 0.6 }}
      className="rounded-3xl border border-amber-100 bg-amber-500/10 p-10 text-center shadow-lg dark:border-amber-500/30 dark:bg-amber-500/20"
    >
      <h3 className="text-3xl font-semibold text-amber-800 dark:text-amber-100">
        Ensemble, investissons dans la vision de MegVie Paris.
      </h3>
      <p className="mt-3 text-lg text-amber-900 dark:text-amber-50">
        Merci pour votre confiance et votre generosite envers l&apos;eglise.
        Votre don fait avancer la mission a travers la capitale.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <Button
          size="lg"
          className="h-14 rounded-full bg-amber-600 px-10 text-lg font-semibold text-white shadow-md transition hover:bg-amber-500"
          onClick={onDonate}
          disabled={isProcessing}
          aria-busy={isProcessing}
        >
          {isProcessing
            ? "Redirection en cours..."
            : `faire un don de ${formattedAmount}`}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 rounded-full border-white/50 bg-transparent px-10 text-lg text-amber-800 dark:border-amber-200 dark:text-amber-50"
        >
          En savoir plus
        </Button>
      </div>
    </motion.section>
  )
}

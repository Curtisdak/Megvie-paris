"use client"

import Link from "next/link"
import { HeartHandshake, Mail, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { fadeInUp } from "@/lib/motion"

type ClosingCtaProps = {
  isProcessing: boolean
  formattedAmount: string
  onDonate: () => void
}

const reassuranceItems = [
  {
    label: "Don libre",
    icon: HeartHandshake,
  },
  {
    label: "Paiement securise",
    icon: ShieldCheck,
  },
  {
    label: "Nous contacter",
    icon: Mail,
  },
]

export function ClosingCta({
  isProcessing,
  formattedAmount,
  onDonate,
}: ClosingCtaProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35 }}
      variants={fadeInUp}
      transition={{ duration: 0.6 }}
      className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-center">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            Soutenir la mission
          </p>
          <h3 className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-white">
            Un geste simple pour soutenir MegVie Paris.
          </h3>
          <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-300">
            Votre don nous aide a poursuivre les cultes, l&apos;accueil et
            l&apos;accompagnement de la communaute. Donnez maintenant ou
            contactez-nous si vous avez une question.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {reassuranceItems.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-amber-100 bg-amber-50/80 p-5 shadow-sm dark:border-amber-400/20 dark:bg-amber-400/10 sm:p-6">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-100">
            Montant selectionne
          </p>
          <p className="mt-2 text-4xl font-semibold text-amber-700 dark:text-amber-200">
            {formattedAmount}
          </p>
          <p className="mt-3 text-sm leading-6 text-amber-900/80 dark:text-amber-100/80">
            Paiement en ligne via Stripe. Vous pouvez aussi nous ecrire depuis
            la page contact.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <Button
              size="lg"
              className="h-13 w-full rounded-full bg-amber-600 px-6 text-base font-semibold text-white shadow-md transition hover:bg-amber-500"
              onClick={onDonate}
              disabled={isProcessing}
              aria-busy={isProcessing}
            >
              {isProcessing
                ? "Redirection en cours..."
                : `Faire un don de ${formattedAmount}`}
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-13 w-full rounded-full border-zinc-300 bg-white/80 px-6 text-base text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

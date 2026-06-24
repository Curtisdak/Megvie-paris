"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { DonationControls } from "@/components/landing/donation-controls"
import { JoinServiceDialog } from "@/components/landing/join-service-dialog"
import { heroStats } from "@/lib/donation"
import { fadeInUp } from "@/lib/motion"

type HeroSectionProps = {
  amount: number
  formattedAmount: string
  isProcessing: boolean
  onSliderChange: (value: number) => void
  onManualChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDonate: () => void
}

export function HeroSection({
  amount,
  formattedAmount,
  isProcessing,
  onSliderChange,
  onManualChange,
  onDonate,
}: HeroSectionProps) {
  return (
    <motion.section
      id="don"
      initial="hidden"
      animate="show"
      variants={fadeInUp}
      transition={{ duration: 0.6 }}
      className="overflow-hidden border-y border-orange-200/60 bg-white/90 p-4 text-zinc-950 shadow-lg shadow-orange-950/5 dark:border-white/10 dark:bg-zinc-950/80 dark:text-white sm:rounded-[1.5rem] sm:border sm:p-5"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:items-center">
        <div className="space-y-4">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="text-xs font-black uppercase text-orange-600 dark:text-amber-200"
          >
            Une eglise pour vous
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="space-y-3"
          >
            <h2 className="max-w-3xl text-2xl font-black leading-tight sm:text-4xl">
              Prier, servir et soutenir la mission MegVie Paris.
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base">
              Choisissez librement votre participation, soutenez les projets de
              l&apos;eglise ou retrouvez les informations du culte.
            </p>
          </motion.div>
          <div className="grid gap-3 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-xl font-black text-orange-600 dark:text-amber-200">
                  {stat.value}
                </p>
                <p className="text-[0.68rem] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-zinc-200 bg-white p-3 shadow-xl shadow-orange-950/5 dark:border-white/10 dark:bg-zinc-900/90">
          <DonationControls
            amount={amount}
            formattedAmount={formattedAmount}
            onSliderChange={onSliderChange}
            onManualChange={onManualChange}
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button
              size="lg"
              className="h-12 w-full rounded-full bg-orange-500 px-6 text-sm font-black text-white shadow-md transition hover:bg-orange-600"
              onClick={onDonate}
              disabled={isProcessing}
              aria-busy={isProcessing}
            >
              {isProcessing
                ? "Redirection..."
                : `Donner ${formattedAmount}`}
            </Button>
            <JoinServiceDialog />
          </div>
        </div>
      </div>
    </motion.section>
  )
}

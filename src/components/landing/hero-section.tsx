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
      className="py-2 text-foreground"
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
            <h2 className="max-w-3xl text-2xl font-semibold leading-tight">
              Ensemble, soutenons la mission.
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base">
              Choisissez librement votre participation, soutenez les projets de
              l&apos;eglise ou retrouvez les informations du culte.
            </p>
          </motion.div>
          <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="min-w-0 py-2"
              >
                <p className="text-xl font-semibold text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <DonationControls
            amount={amount}
            formattedAmount={formattedAmount}
            onSliderChange={onSliderChange}
            onManualChange={onManualChange}
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button
              size="lg"
              className="min-h-12 w-full bg-teal-700 px-4 text-sm text-white hover:bg-teal-800"
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

"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { DonationControls } from "@/components/landing/donation-controls"
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
      initial="hidden"
      animate="show"
      variants={fadeInUp}
      transition={{ duration: 0.6 }}
      className="grid gap-10 rounded-3xl border border-zinc-200 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 lg:grid-cols-2"
    >
      <div className="flex flex-col justify-center gap-6">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-600">
          Une eglise pour Paris
        </p>
        <h2 className="text-4xl font-semibold leading-tight">
          Un lieu de priere, de compassion et d&apos;inspiration pour toute la
          ville.
        </h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-300">
          MegVie Paris rassemble des personnes de tous horizons pour celebrer la
          presence de Dieu et servir la cite. Ensemble, nous accompagnons les
          familles, equipons les jeunes et investissons nos ressources pour une
          transformation durable. Choisissez librement votre participation et
          soutenez les projets qui font la difference.
        </p>
        <DonationControls
          amount={amount}
          formattedAmount={formattedAmount}
          onSliderChange={onSliderChange}
          onManualChange={onManualChange}
        />
        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            className="h-14 rounded-full bg-amber-600 px-8 text-lg font-semibold text-white shadow-md transition hover:bg-amber-500"
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
            className="h-14 rounded-full border-zinc-300 bg-transparent px-8 text-lg dark:border-zinc-700"
          >
            Rejoindre un culte
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-center dark:border-amber-400/20 dark:bg-amber-400/10"
            >
              <p className="text-2xl font-semibold text-amber-700 dark:text-amber-300">
                {stat.value}
              </p>
              <p className="text-xs uppercase tracking-widest text-amber-900/80 dark:text-amber-200/90">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative overflow-hidden rounded-[32px] border border-zinc-200 shadow-2xl dark:border-zinc-800"
      >
        <Image
          src="https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80"
          alt="Communautes en priere"
          width={1200}
          height={800}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
        <p className="absolute bottom-4 left-4 text-sm font-medium text-white">
          Moments de louange avec la famille MegVie Paris.
        </p>
      </motion.div>
    </motion.section>
  )
}

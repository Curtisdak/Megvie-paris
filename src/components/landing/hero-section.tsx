"use client"

import Image from "next/image"
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
      className="grid gap-7 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#111827_0%,#7c2d12_42%,#0f766e_100%)] p-5 text-white shadow-2xl shadow-zinc-950/20 sm:p-8 lg:grid-cols-2 lg:gap-10"
    >
      <div className="flex flex-col justify-center gap-6">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="text-sm font-medium uppercase tracking-[0.3em] text-amber-100"
        >
          Une eglise pour Vous
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="text-3xl font-semibold leading-tight sm:text-5xl"
        >
          Un lieu de priere, de compassion et d&apos;inspiration pour toute la
          ville.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.29 }}
          className="text-base leading-7 text-white/78 sm:text-lg"
        >
          MegVie Paris rassemble des personnes de tous horizons pour celebrer la
          presence de Dieu et servir la cite. Ensemble, nous accompagnons les
          familles, equipons les jeunes et investissons nos ressources pour une
          transformation durable. Choisissez librement votre participation et
          soutenez les projets qui font la difference.
        </motion.p>
        <div className="rounded-[1.75rem] border border-white/15 bg-white/12 p-2 backdrop-blur-xl">
          <DonationControls
            amount={amount}
            formattedAmount={formattedAmount}
            onSliderChange={onSliderChange}
            onManualChange={onManualChange}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            size="lg"
            className="h-14 w-full rounded-full bg-amber-600 px-8 text-base font-semibold text-white shadow-md transition hover:bg-amber-500 sm:w-auto sm:text-lg"
            onClick={onDonate}
            disabled={isProcessing}
            aria-busy={isProcessing}
          >
            {isProcessing
              ? "Redirection en cours..."
              : `faire un don de ${formattedAmount}`}
          </Button>
          <JoinServiceDialog />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur"
            >
              <p className="text-2xl font-semibold text-amber-100">
                {stat.value}
              </p>
              <p className="text-xs uppercase tracking-widest text-white/75">
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
        className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-white/15 shadow-2xl sm:rounded-[2rem] lg:aspect-auto"
      >
        <Image
          src="https://images.unsplash.com/photo-1620763935115-3e08804489ca?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
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

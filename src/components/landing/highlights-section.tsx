"use client"

import { motion } from "framer-motion"
import { donationHighlights } from "@/lib/donation"
import { fadeInUp } from "@/lib/motion"

export function HighlightsSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
      transition={{ duration: 0.6 }}
      className="rounded-3xl border border-zinc-200 bg-white/90 p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
        Pourquoi donner ?
      </p>
      <h3 className="mt-3 text-3xl font-semibold">
        Chaque don cree une nouvelle histoire de grace.
      </h3>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {donationHighlights.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 text-sm text-amber-900 shadow-sm dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-50"
          >
            {item}
          </div>
        ))}
      </div>
    </motion.section>
  )
}

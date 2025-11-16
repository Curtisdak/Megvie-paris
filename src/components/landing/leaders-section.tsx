"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { leaders } from "@/lib/donation"
import { fadeInUp } from "@/lib/motion"

export function LeadersSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
      transition={{ duration: 0.6 }}
      className="rounded-3xl border border-zinc-200 bg-white/95 p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/85"
    >
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
          Nos leaders
        </p>
        <h3 className="text-3xl font-semibold">
          Une equipe a l&apos;ecoute de la vision de Dieu.
        </h3>
        <p className="text-base text-zinc-600 dark:text-zinc-300">
          Des responsables inspires qui equipent la communaute et portent la
          vision de MegVie Paris.
        </p>
      </div>
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {leaders.map((leader) => (
          <motion.article
            key={leader.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col items-center rounded-3xl border border-zinc-200 bg-white/80 p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70"
          >
            <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-full border-4 border-amber-200 dark:border-amber-500/60">
              <Image
                src={leader.image}
                alt={leader.name}
                width={200}
                height={200}
                className="h-full w-full object-cover"
              />
            </div>
            <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {leader.name}
            </h4>
            <p className="text-sm uppercase tracking-widest text-amber-700 dark:text-amber-300">
              {leader.role}
            </p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  )
}

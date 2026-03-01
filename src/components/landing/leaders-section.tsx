"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { leaders } from "@/lib/donation"
import { fadeInUp } from "@/lib/motion"

export function LeadersSection() {
  if (leaders.length === 0) {
    return null
  }

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={fadeInUp}
      transition={{ duration: 0.6 }}
      className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-8"
    >
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
          Nos leaders
        </p>
        <h3 className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-white">
          Une equipe au service de la communaute.
        </h3>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-300">
          Rencontrez les responsables qui accompagnent MegVie Paris dans la
          priere, l&apos;accueil et l&apos;enseignement.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {leaders.map((leader, index) => (
          <motion.article
            key={leader.name}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60"
          >
            <div className="relative aspect-[4/5] bg-zinc-100 dark:bg-zinc-900">
              <Image
                src={leader.image}
                alt={leader.name}
                fill
                sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 100vw"
                className="object-cover object-top"
                priority={index === 0}
              />
            </div>

            <div className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600 dark:text-amber-300">
                {leader.role}
              </p>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                {leader.name}
              </h4>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Disponible pour accueillir, prier et accompagner la
                communaute.
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  )
}

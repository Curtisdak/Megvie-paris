"use client"

import { useRef, useState, type TouchEvent } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { leaders } from "@/lib/donation"
import { fadeInUp } from "@/lib/motion"
import { cn } from "@/lib/utils"

const leaderCommitments = ["Accueil", "Priere", "Enseignement"]

const leaderCopyContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
}

const leaderCopyItem = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(4px)" },
}

export function LeadersSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  if (leaders.length === 0) {
    return null
  }

  const activeLeader = leaders[activeIndex]
  const hasMultipleLeaders = leaders.length > 1
  const totalLeadersLabel = String(leaders.length).padStart(2, "0")

  const showLeader = (nextIndex: number) => {
    setActiveIndex((nextIndex + leaders.length) % leaders.length)
  }

  const showPreviousLeader = () => {
    showLeader(activeIndex - 1)
  }

  const showNextLeader = () => {
    showLeader(activeIndex + 1)
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) {
      return
    }

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const swipeDistance = touchStartX.current - touchEndX
    touchStartX.current = null

    if (Math.abs(swipeDistance) < 40) {
      return
    }

    if (swipeDistance > 0) {
      showNextLeader()
      return
    }

    showPreviousLeader()
  }

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={fadeInUp}
      transition={{ duration: 0.6 }}
      className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-8"
      aria-label="Leaders de MegVie Paris"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            Nos leaders
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-white sm:text-3xl">
            Une equipe au service de la communaute.
          </h3>
          <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-300">
            Rencontrez les responsables qui accompagnent MegVie Paris dans la
            priere, l&apos;accueil et l&apos;enseignement.
          </p>
        </div>

        {hasMultipleLeaders ? (
          <div className="flex items-center gap-2">
            <span
              className="rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
              aria-live="polite"
            >
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {totalLeadersLabel}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full border-zinc-200 bg-white/90 text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:hover:bg-zinc-900"
              onClick={showPreviousLeader}
              aria-label="Afficher le leader precedent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full border-zinc-200 bg-white/90 text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:hover:bg-zinc-900"
              onClick={showNextLeader}
              aria-label="Afficher le leader suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <div
        className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-950 shadow-xl dark:border-zinc-800 sm:mt-8"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-roledescription="carousel"
        aria-label="Presentation des leaders"
      >
        <AnimatePresence mode="wait">
          <motion.article
            key={activeLeader.name}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative isolate grid min-h-[500px] overflow-hidden bg-zinc-950 text-white lg:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]"
            aria-live="polite"
          >
            <div className="relative z-10 min-h-[330px] overflow-hidden bg-zinc-900 sm:min-h-[420px] lg:min-h-[500px]">
              <Image
                src={activeLeader.image}
                alt={activeLeader.name}
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover object-top"
                priority={activeIndex === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent lg:bg-[linear-gradient(90deg,rgba(9,9,11,0)_0%,rgba(9,9,11,0)_74%,rgba(9,9,11,0.18)_100%)]" />
            </div>

            <div className="relative z-20 flex min-h-[330px] flex-col justify-center bg-zinc-950 p-5 sm:p-8 lg:-ml-24 lg:min-h-[500px] lg:p-10 lg:pl-32">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-32 hidden w-32 bg-gradient-to-r from-transparent via-zinc-950/68 to-zinc-950 lg:block"
              />
              <motion.div
                className="relative z-10 flex max-w-xl flex-col gap-5"
                initial="hidden"
                animate="show"
                exit="exit"
                variants={leaderCopyContainer}
              >
                <motion.p
                  variants={leaderCopyItem}
                  transition={{ duration: 0.42, ease: "easeOut" }}
                  className="inline-flex w-fit rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase text-amber-100 shadow-lg shadow-amber-950/20"
                >
                  {activeLeader.role}
                </motion.p>
                <motion.div
                  variants={leaderCopyItem}
                  transition={{ duration: 0.48, ease: "easeOut" }}
                >
                  <h4 className="text-4xl font-black leading-tight text-white sm:text-5xl">
                    {activeLeader.name}
                  </h4>
                  <p className="mt-4 max-w-lg text-base leading-7 text-zinc-200 sm:text-lg">
                    Disponible pour accueillir, prier et accompagner la
                    communaute avec attention et fidelite.
                  </p>
                </motion.div>

                <motion.div
                  variants={leaderCopyItem}
                  transition={{ duration: 0.42, ease: "easeOut" }}
                  className="grid gap-3 pt-2 sm:grid-cols-3"
                >
                  {leaderCommitments.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.24 + index * 0.06,
                        ease: "easeOut",
                      }}
                      className="flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.08] px-4 py-3 text-center text-sm font-semibold text-zinc-100 shadow-lg shadow-black/10 backdrop-blur"
                    >
                      {item}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {hasMultipleLeaders ? (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
          {leaders.map((leader, index) => {
            const isActive = index === activeIndex

            return (
              <button
                key={leader.name}
                type="button"
                className={cn(
                  "flex min-h-20 min-w-[13rem] items-center gap-3 rounded-2xl border p-2 text-left transition focus-visible:ring-[3px] focus-visible:ring-amber-500/40 focus-visible:outline-none sm:min-w-0",
                  isActive
                    ? "border-amber-300 bg-amber-50 text-amber-950 shadow-sm dark:border-amber-300/60 dark:bg-amber-300/15 dark:text-amber-50"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-amber-200 hover:bg-amber-50/60 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10"
                )}
                onClick={() => showLeader(index)}
                aria-current={isActive}
                aria-label={`Afficher ${leader.name}`}
              >
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
                  <Image
                    src={leader.image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover object-top"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {leader.name}
                  </span>
                  <span className="mt-1 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {leader.role}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </motion.section>
  )
}

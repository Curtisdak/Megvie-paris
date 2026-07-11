"use client"

import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ChevronRight } from "lucide-react"

export function MemberProfileDisclosure({
  summary,
  children,
}: {
  summary: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion()

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 bg-[linear-gradient(120deg,#ffffff_0%,#fff7ed_58%,#ecfdf5_100%)] p-4 text-left outline-none transition hover:brightness-[0.99] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 dark:bg-[linear-gradient(120deg,#111114_0%,#1d120c_58%,#0a1913_100%)] sm:p-5"
      >
        <div className="min-w-0 flex-1">{summary}</div>
        <motion.span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white/80 text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
          animate={{ rotate: open ? 90 : 0, scale: open ? 1.04 : 1 }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 32 }}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="member-details"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { height: { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }, opacity: { duration: 0.14 } }}
            className="overflow-hidden"
          >
            <motion.div
              initial={reduceMotion ? false : { y: -5 }}
              animate={{ y: 0 }}
              exit={reduceMotion ? undefined : { y: -3 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

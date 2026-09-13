"use client"

import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

export function AdminRouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduceMotion = usePrefersReducedMotion()

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={pathname}
        className="admin-page-motion"
        initial={reduceMotion ? false : { opacity: 0.72, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
        transition={{
          duration: reduceMotion ? 0 : 0.16,
          ease: [0.2, 0.8, 0.2, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

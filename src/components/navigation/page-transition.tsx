"use client"

import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  // AdminShell owns its viewport-level fixed navigation. A transformed parent
  // would make that sidebar scroll with the document instead of the viewport.
  if (pathname.startsWith("/admin")) {
    return children
  }

  return (
    <>
      {reduceMotion ? null : (
        <motion.div
          key={`route-bar-${pathname}`}
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 origin-left bg-gradient-to-r from-orange-600 via-amber-400 to-emerald-500 shadow-[0_0_22px_rgba(245,158,11,0.55)]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 0.72, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      )}
      <motion.div
        key={pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 8, filter: "blur(2px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </>
  )
}

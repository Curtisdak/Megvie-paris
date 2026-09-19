"use client"

import { MotionConfig } from "framer-motion"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const reduceMotion = usePrefersReducedMotion()
  return (
    <MotionConfig
      reducedMotion={reduceMotion ? "always" : "never"}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      {children}
    </MotionConfig>
  )
}

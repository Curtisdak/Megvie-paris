"use client"

import { AnimatePresence, motion } from "framer-motion"

type WelcomeOverlayProps = {
  visible: boolean
}

export function WelcomeOverlay({ visible }: WelcomeOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-amber-700 via-amber-500 to-amber-300 text-white"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-sm uppercase tracking-[0.5em] text-white/80">
              Bienvenue
            </p>
            <h1 className="mt-4 text-4xl font-semibold">MegVie Paris</h1>
            <p className="mt-2 text-lg text-white/90">
              Merci de soutenir la mission de l&apos;eglise.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

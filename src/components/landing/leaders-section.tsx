"use client"

"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { leaders } from "@/lib/donation"
import { fadeInUp } from "@/lib/motion"

const CARD_WIDTH = 320
const CARD_OFFSET = 240

const visibleSlots = [-1, 0, 1]

export function LeadersSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  const getLeaderByOffset = (offset: number) => {
    const index = (activeIndex + offset + leaders.length) % leaders.length
    return leaders[index]
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? leaders.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === leaders.length - 1 ? 0 : prev + 1))
  }

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeInUp}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950/90 p-10 text-white shadow-2xl dark:border-zinc-800"
    >
      <div className="absolute inset-0">
        <Image
          src={leaders[activeIndex].image}
          alt={leaders[activeIndex].name}
          fill
          className="object-cover opacity-20 blur-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/90 to-zinc-950" />
      </div>

      <div className="relative z-10 flex flex-col gap-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
          Nos leaders
        </p>
        <h3 className="text-3xl font-semibold">
          Une equipe a l&apos;ecoute de la vision de Dieu.
        </h3>
        <p className="text-base text-zinc-300">
          Des responsables inspires qui equipent la communaute et portent la
          vision de MegVie Paris.
        </p>
      </div>

      <div className="relative z-10 mt-12 flex items-center justify-center">
        <button
          className="rounded-full border border-white/20 bg-white/10 p-3 text-white transition hover:bg-white/20"
          onClick={handlePrev}
          aria-label="Leader precedent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="relative h-[450px] w-full max-w-5xl">
          {visibleSlots.map((slot) => {
            const leader = getLeaderByOffset(slot)
            const isActive = slot === 0
            const translateX = slot * CARD_OFFSET
            const scale = isActive ? 1.08 : 0.76
            const rotateY = slot * -25
            const blur = Math.abs(slot) === 1 ? "brightness-90" : "brightness-75"

            return (
              <motion.article
                key={`${leader.name}-${slot}`}
                animate={{
                  x: translateX,
                  scale,
                  rotateY,
                  opacity: isActive ? 1 : 0.5,
                }}
                transition={{
                  type: "spring",
                  stiffness: 110,
                  damping: 18,
                }}
                className="absolute left-1/2 top-0 -translate-x-1/2"
                style={{
                  perspective: "1200px",
                  zIndex: isActive ? 40 : 20 + slot,
                }}
                whileHover={isActive ? { scale: 1.04 } : undefined}
              >
                <div
                  className="flex w-[320px] flex-col overflow-hidden rounded-[32px] border border-white/10 text-white shadow-[0_25px_50px_rgba(0,0,0,0.45)] backdrop-blur"
                  style={{ filter: isActive ? "none" : blur }}
                >
                  <div className="relative h-80">
                    <Image
                      src={leader.image}
                      alt={leader.name}
                      width={CARD_WIDTH}
                      height={400}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  </div>
                  <div className="space-y-2 px-5 py-5">
                    <p className="text-2xl font-semibold">{leader.name}</p>
                    <p className="text-xs uppercase tracking-[0.35em] text-amber-200">
                      {leader.role}
                    </p>
                    <p className="text-sm text-zinc-200">
                      Inspire par la vision de MegVie Paris pour servir et
                      equiper chaque membre.
                    </p>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
        <button
          className="rounded-full border border-white/20 bg-white/10 p-3 text-white transition hover:bg-white/20"
          onClick={handleNext}
          aria-label="Leader suivant"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

  op: apply_patch
  patch: |-
    *** Begin Patch
    *** Update File: src/components/landing/leaders-section.tsx
    @@
       <div className="mt-6 flex justify-center gap-2">
         {leaders.map((_, index) => (
           <button
             key={index}
             onClick={() => setActiveIndex(index)}
             className={`h-1.5 w-4 rounded-full transition ${
               index === activeIndex ? "bg-amber-400" : "bg-white/20"
             }`}
             aria-label={`Aller au leader ${index + 1}`}
           />
         ))}
       </div>
     </motion.section>
   )
 }

"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HomeEventSlide } from "@/lib/home-event-slide-types"
import { cn } from "@/lib/utils"

type EventImageSliderClientProps = {
  slides: HomeEventSlide[]
}

function twoDigits(value: number) {
  return String(value).padStart(2, "0")
}

export function EventImageSliderClient({ slides }: EventImageSliderClientProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [loadedImageIds, setLoadedImageIds] = useState<Set<string>>(
    () => new Set(),
  )
  const shouldReduceMotion = useReducedMotion()
  const slideCount = slides.length
  const activeIndex = slideCount
    ? Math.min(selectedIndex, slideCount - 1)
    : 0
  const activeSlide = slides[activeIndex] ?? slides[0]

  useEffect(() => {
    if (slides.length <= 1) return

    const intervalId = window.setInterval(() => {
      setSelectedIndex((current) => {
        const safeCurrent = Math.min(current, slides.length - 1)
        return (safeCurrent + 1) % slides.length
      })
    }, 7000)

    return () => window.clearInterval(intervalId)
  }, [slides.length])

  if (!activeSlide) return null

  const markImageLoaded = (slideId: string) => {
    setLoadedImageIds((current) => {
      if (current.has(slideId)) return current

      const next = new Set(current)
      next.add(slideId)
      return next
    })
  }

  const markImageFailed = (slideId: string) => {
    setFailedImageIds((current) => {
      if (current.has(slideId)) return current

      const next = new Set(current)
      next.add(slideId)
      return next
    })
  }

  const showPrevious = () => {
    setSelectedIndex((current) => {
      const safeCurrent = Math.min(current, slides.length - 1)
      return safeCurrent === 0 ? slides.length - 1 : safeCurrent - 1
    })
  }

  const showNext = () => {
    setSelectedIndex((current) => {
      const safeCurrent = Math.min(current, slides.length - 1)
      return (safeCurrent + 1) % slides.length
    })
  }

  const locationText = [activeSlide.locationLabel, activeSlide.address]
    .filter(Boolean)
    .join(" - ")
  const actionGridClass =
    activeSlide.actions.length === 1 ? "sm:grid-cols-1" : "sm:grid-cols-2"

  return (
    <section
      aria-label="Evenements MegVie Paris"
      className="relative isolate h-[760px] overflow-hidden border-y border-white/35 bg-zinc-950 text-white shadow-2xl shadow-orange-950/20 sm:h-[680px] sm:rounded-[2rem] sm:border lg:h-[620px]"
    >
      {slides.map((slide, index) => {
        const isActive = index === activeIndex
        const canShowImage = Boolean(slide.imageUrl && !failedImageIds.has(slide.id))
        const isLoaded = loadedImageIds.has(slide.id)

        return (
          <motion.div
            key={`background-${slide.id}`}
            className="absolute inset-0 overflow-hidden"
            style={{ backgroundImage: slide.gradient }}
            initial={false}
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.72,
              ease: "easeOut",
            }}
            aria-hidden={!isActive}
          >
            {canShowImage ? (
              <motion.img
                src={slide.imageUrl ?? ""}
                alt=""
                className="h-full w-full object-cover object-center"
                loading={index <= 1 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                onLoad={() => markImageLoaded(slide.id)}
                onError={() => markImageFailed(slide.id)}
                initial={false}
                animate={{
                  opacity: isLoaded || isActive ? 1 : 0,
                  scale:
                    isActive && !shouldReduceMotion ? [1.02, 1.12] : 1.04,
                }}
                transition={{
                  opacity: {
                    duration: shouldReduceMotion ? 0 : 0.35,
                    ease: "easeOut",
                  },
                  scale: {
                    duration: shouldReduceMotion ? 0 : 7.4,
                    ease: "linear",
                  },
                }}
              />
            ) : null}
          </motion.div>
        )
      })}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(250,204,21,0.24),transparent_30%),linear-gradient(180deg,rgba(3,7,18,0.16),rgba(3,7,18,0.82))]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 to-transparent" />

      <div className="relative flex h-full min-h-0 flex-col justify-between gap-5 px-4 py-5 sm:gap-7 sm:px-8 sm:py-8 lg:px-10">
        <div className="grid min-h-0 flex-1 items-end">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`copy-${activeSlide.id}`}
              aria-live="polite"
              className="max-w-2xl self-end"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: shouldReduceMotion ? 0 : 0.08,
                    delayChildren: shouldReduceMotion ? 0 : 0.1,
                  },
                },
                exit: {
                  transition: { staggerChildren: 0.03, staggerDirection: -1 },
                },
              }}
            >
              <motion.div
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-bold uppercase text-amber-100 shadow-lg backdrop-blur"
                variants={{
                  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
                  visible: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: shouldReduceMotion ? 0 : -10 },
                }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.45 }}
              >
                <Sparkles className="size-4" aria-hidden="true" />
                {activeSlide.eyebrow}
              </motion.div>

              <motion.h2
                className="text-4xl font-black leading-none text-white drop-shadow-xl sm:text-6xl lg:text-7xl"
                variants={{
                  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 26 },
                  visible: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: shouldReduceMotion ? 0 : -14 },
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.55,
                  ease: "easeOut",
                }}
              >
                {activeSlide.title}
              </motion.h2>

              <motion.p
                className="mt-5 max-w-xl text-base leading-8 text-white/88 sm:text-lg"
                style={{
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 3,
                  overflow: "hidden",
                }}
                variants={{
                  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
                  visible: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: shouldReduceMotion ? 0 : -10 },
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.5,
                  ease: "easeOut",
                }}
              >
                {activeSlide.description}
              </motion.p>

              <motion.dl
                className="mt-6 grid gap-3 text-sm text-white/86 sm:grid-cols-3"
                variants={{
                  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
                  visible: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: shouldReduceMotion ? 0 : -8 },
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.48,
                  ease: "easeOut",
                }}
              >
                {activeSlide.dateLabel ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-lg shadow-black/10 backdrop-blur-md">
                    <CalendarDays className="mt-0.5 size-4 text-amber-200" />
                    <div>
                      <dt className="font-bold text-white">Date</dt>
                      <dd>{activeSlide.dateLabel}</dd>
                    </div>
                  </div>
                ) : null}

                {activeSlide.timeLabel ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-lg shadow-black/10 backdrop-blur-md">
                    <Clock3 className="mt-0.5 size-4 text-amber-200" />
                    <div>
                      <dt className="font-bold text-white">Horaire</dt>
                      <dd>{activeSlide.timeLabel}</dd>
                    </div>
                  </div>
                ) : null}

                {locationText ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-lg shadow-black/10 backdrop-blur-md">
                    <MapPin className="mt-0.5 size-4 text-amber-200" />
                    <div>
                      <dt className="font-bold text-white">Lieu</dt>
                      <dd>{locationText}</dd>
                    </div>
                  </div>
                ) : null}
              </motion.dl>

              {activeSlide.actions.length ? (
                <motion.div
                  className={cn(
                    "mt-7 grid w-full max-w-xl grid-cols-1 gap-3",
                    actionGridClass,
                  )}
                  variants={{
                    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14 },
                    visible: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: shouldReduceMotion ? 0 : -8 },
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.45,
                    ease: "easeOut",
                  }}
                >
                  {activeSlide.actions.map((action) => (
                    <Button
                      key={`${activeSlide.id}-${action.href}-${action.label}`}
                      asChild
                      className={cn(
                        "h-12 w-full rounded-full px-5 text-sm font-extrabold shadow-xl transition-transform duration-300 hover:-translate-y-0.5",
                        action.variant === "secondary"
                          ? "border border-white/30 bg-white/10 text-white hover:bg-white/20"
                          : "bg-orange-500 text-white hover:bg-orange-600",
                      )}
                      variant="default"
                    >
                      <a
                        href={action.href}
                        rel={action.external ? "noreferrer" : undefined}
                        target={action.external ? "_blank" : undefined}
                      >
                        {action.label}
                        {action.external ? (
                          <ExternalLink
                            className="size-4"
                            aria-hidden="true"
                          />
                        ) : (
                          <Navigation className="size-4" aria-hidden="true" />
                        )}
                      </a>
                    </Button>
                  ))}
                </motion.div>
              ) : null}
            </motion.div>
          </AnimatePresence>

        </div>

        <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-t border-white/15 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/70"
              onClick={showPrevious}
              aria-label="Afficher l'evenement precedent"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/70"
              onClick={showNext}
              aria-label="Afficher l'evenement suivant"
            >
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="font-mono text-3xl font-black text-white drop-shadow">
            {twoDigits(activeIndex + 1)}
            <span className="text-base text-white/45">
              /{twoDigits(slides.length)}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

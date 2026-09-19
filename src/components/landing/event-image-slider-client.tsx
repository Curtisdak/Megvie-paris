"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  Pause,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import type { HomeEventSlide } from "@/lib/home-event-slide-types"
import { cn } from "@/lib/utils"

export function EventImageSliderClient({
  slides,
}: {
  slides: HomeEventSlide[]
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set())
  const reduceMotion = usePrefersReducedMotion()
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const activeIndex = Math.min(selectedIndex, Math.max(0, slides.length - 1))
  const active = slides[activeIndex]
  const playing =
    !paused && !hovered && !focused && !reduceMotion && slides.length > 1

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible")
        setSelectedIndex((value) => (value + 1) % slides.length)
    }, 8000)
    return () => window.clearInterval(timer)
  }, [playing, slides.length, activeIndex])

  useEffect(() => {
    copyRef.current?.scrollTo({ top: 0 })
  }, [activeIndex])
  if (!active) return null

  function move(direction: number) {
    setPaused(true)
    setSelectedIndex((activeIndex + direction + slides.length) % slides.length)
  }
  const location = [active.locationLabel, active.address]
    .filter(Boolean)
    .join(" · ")

  return (
    <section
      aria-label="Événements MegVie Paris"
      aria-roledescription="carrousel"
      className="relative isolate flex h-[min(620px,calc(100svh-10rem))] min-h-[440px] flex-col overflow-hidden bg-zinc-950 text-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false)
      }}
      onKeyDown={(event) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLSelectElement
        )
          return
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault()
          move(event.key === "ArrowRight" ? 1 : -1)
        }
      }}
      onTouchStart={(event) => {
        const touch = event.touches[0]
        touchStart.current = touch
          ? { x: touch.clientX, y: touch.clientY }
          : null
      }}
      onTouchEnd={(event) => {
        const touch = event.changedTouches[0],
          start = touchStart.current
        touchStart.current = null
        if (!start || !touch) return
        const dx = touch.clientX - start.x,
          dy = touch.clientY - start.y
        if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5)
          move(dx < 0 ? 1 : -1)
      }}
    >
      {slides.map((slide, index) => (
        <motion.div
          key={slide.id}
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{ backgroundImage: slide.gradient }}
          initial={false}
          animate={{ opacity: index === activeIndex ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.65 }}
        >
          {slide.imageUrl && !failedImages.has(slide.imageUrl) && (
            <motion.img
              src={slide.imageUrl}
              alt=""
              className="h-full w-full object-cover object-center"
              loading="eager"
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding="async"
              draggable={false}
              onError={() =>
                setFailedImages((current) =>
                  new Set(current).add(slide.imageUrl!),
                )
              }
              initial={false}
              animate={{
                scale: index === activeIndex && !reduceMotion ? 1.06 : 1,
              }}
              transition={{ duration: reduceMotion ? 0 : 8.5, ease: "linear" }}
            />
          )}
        </motion.div>
      ))}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,9,11,0.8),rgba(9,9,11,0.15)),linear-gradient(0deg,rgba(9,9,11,0.8),transparent_75%)]"
      />
      <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-9 sm:pt-7">
        <span className="text-xs font-medium text-white/85">MegVie Paris</span>
        <span className="text-xs tabular-nums text-white/65">
          {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(slides.length).padStart(2, "0")}
        </span>
      </div>
      <div
        ref={copyRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-8 sm:px-9"
      >
        <div className="flex min-h-full items-end">
          <motion.div
            key={active.id}
            className="max-w-2xl pb-5"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            aria-live={playing ? "off" : "polite"}
          >
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-amber-200">
              <span className="size-1.5 rounded-full bg-amber-300" />
              {active.eyebrow}
            </p>
            <h1 className="text-3xl font-semibold leading-[1.12] sm:text-5xl">
              {active.title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/85">
              {active.description}
            </p>
            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/85">
              {active.dateLabel && (
                <div className="flex items-center gap-2">
                  <CalendarDays
                    className="size-4 shrink-0 text-amber-200"
                    aria-hidden
                  />
                  <dt className="sr-only">Date</dt>
                  <dd>{active.dateLabel}</dd>
                </div>
              )}
              {active.timeLabel && (
                <div className="flex items-center gap-2">
                  <Clock3
                    className="size-4 shrink-0 text-amber-200"
                    aria-hidden
                  />
                  <dt className="sr-only">Horaire</dt>
                  <dd>{active.timeLabel}</dd>
                </div>
              )}
              {location && (
                <div className="flex min-w-0 items-start gap-2">
                  <MapPin
                    className="size-4 shrink-0 text-amber-200"
                    aria-hidden
                  />
                  <dt className="sr-only">Lieu</dt>
                  <dd className="break-words">{location}</dd>
                </div>
              )}
            </dl>
            {active.actions.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {active.actions.map((action) => (
                  <Button
                    key={action.href + action.label}
                    asChild
                    className={cn(
                      "min-h-11 rounded-lg px-4 text-sm",
                      action.variant === "secondary"
                        ? "border border-white/30 bg-white/10 text-white hover:bg-white/20"
                        : "bg-white text-zinc-950 hover:bg-zinc-100",
                    )}
                  >
                    <a
                      href={action.href}
                      target={action.external ? "_blank" : undefined}
                      rel={action.external ? "noreferrer" : undefined}
                    >
                      {action.label}
                      {action.external ? (
                        <ExternalLink className="size-4" aria-hidden />
                      ) : (
                        <ArrowRight className="size-4" aria-hidden />
                      )}
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <div className="mx-5 flex min-h-16 shrink-0 items-center justify-between gap-3 border-t border-white/20 sm:mx-9">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            disabled={slides.length < 2}
            onClick={() => move(-1)}
            aria-label="Afficher l'événement précédent"
            title="Événement précédent"
            className="text-white hover:bg-white/15 hover:text-white"
          >
            <ArrowLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={slides.length < 2}
            onClick={() => move(1)}
            aria-label="Afficher l'événement suivant"
            title="Événement suivant"
            className="text-white hover:bg-white/15 hover:text-white"
          >
            <ArrowRight />
          </Button>
        </div>
        <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Afficher : ${slide.title}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => {
                setPaused(true)
                setSelectedIndex(index)
              }}
              className="grid h-11 w-7 shrink-0 place-items-center"
            >
              <span
                className={cn(
                  "h-1 rounded-full transition-[width,background-color]",
                  activeIndex === index ? "w-6 bg-white" : "w-2 bg-white/40",
                )}
              />
            </button>
          ))}
        </div>
        {!reduceMotion && slides.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setPaused((value) => !value)
              if (paused) {
                setHovered(false)
                setFocused(false)
              }
            }}
            aria-label={
              paused
                ? "Reprendre le défilement"
                : "Mettre le défilement en pause"
            }
            title={paused ? "Reprendre" : "Pause"}
            className="text-white hover:bg-white/15 hover:text-white"
          >
            {paused ? <Play /> : <Pause />}
          </Button>
        )}
      </div>
    </section>
  )
}

"use client"

import { useEffect, useRef, useState, type MouseEvent } from "react"
import { useReducedMotion } from "framer-motion"
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronsRight,
  Copy,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  formatBibleAnswerForCopy,
  revealBibleParagraph,
} from "@/lib/bible-assistant/presentation"
import type {
  BibleAssistantAnswer as Answer,
  BibleCitation,
} from "@/lib/bible-assistant/types"
import styles from "./bible-assistant.module.css"

export function BibleAssistantAnswer({
  answer,
  animate,
  onReferenceOpen,
}: {
  answer: Answer
  animate: boolean
  onReferenceOpen: (citation: BibleCitation) => void
}) {
  const reduceMotion = useReducedMotion()
  const total = answer.paragraphs.reduce((sum, text) => sum + text.length, 0)
  const [visible, setVisible] = useState(animate ? 0 : total)
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  )
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)
  const revealing = animate && !reduceMotion && visible < total

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!revealing) return
    const start = performance.now()
    const duration = Math.min(2400, Math.max(600, total * 4))
    let frame = 0
    const tick = (now: number) => {
      const fraction = Math.min(1, (now - start) / duration)
      setVisible(Math.floor(fraction * total))
      if (fraction < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [revealing, total])

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(formatBibleAnswerForCopy(answer))
      if (!mounted.current) return
      setCopyState("copied")
    } catch {
      if (!mounted.current) return
      setCopyState("error")
    }
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopyState("idle"), 2500)
  }

  function openReference(
    event: MouseEvent<HTMLAnchorElement>,
    citation: BibleCitation,
  ) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return
    if (!citation.bookId || !citation.chapter) return
    event.preventDefault()
    onReferenceOpen(citation)
  }

  const renderText = (text: string) =>
    text
      .replace(/\]\]\s*(?=\[\[)/g, "]], ")
      .split(/(\[\[[A-Z0-9]+\]\])/g)
      .map((part, index) => {
        const id = part.match(/^\[\[([A-Z0-9]+)\]\]$/)?.[1]
        if (!id) return part
        const citation = answer.citations.find((source) => source.id === id)
        if (!citation) return null
        return citation.href ? (
          <a
            key={`${id}-${index}`}
            href={citation.href}
            onClick={(event) => openReference(event, citation)}
            tabIndex={revealing ? -1 : undefined}
            className="rounded-sm font-semibold text-teal-800 underline decoration-teal-500/40 underline-offset-4 transition-colors hover:text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500 dark:text-teal-300 dark:hover:text-teal-200"
          >
            {citation.label}
          </a>
        ) : (
          <span key={`${id}-${index}`} className="text-muted-foreground">
            ({citation.label})
          </span>
        )
      })

  const paragraphs = answer.paragraphs.map((text, index) => {
    const offset = answer.paragraphs
      .slice(0, index)
      .reduce((sum, paragraph) => sum + paragraph.length, 0)
    return revealBibleParagraph(text, (revealing ? visible : total) - offset)
  })
  const lastVisible = paragraphs.findLastIndex((text) => text.length > 0)

  return (
    <div
      className="min-w-0 space-y-3"
      data-assistant-answer
      data-revealing={revealing}
    >
      <div className="flex min-h-11 items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-400/10 dark:text-teal-300">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <span className="text-sm font-semibold">Assistant biblique</span>
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {revealing && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title="Afficher toute la réponse"
              aria-label="Afficher toute la réponse"
              onClick={() => setVisible(total)}
            >
              <ChevronsRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
      {revealing && (
        <p className="sr-only">{formatBibleAnswerForCopy(answer)}</p>
      )}
      <div
        aria-hidden={revealing || undefined}
        aria-live="off"
        data-answer-text
        className="min-h-8 space-y-4 text-[15px] leading-7 break-words text-zinc-700 [overflow-wrap:anywhere] dark:text-zinc-200 sm:text-base sm:leading-8"
      >
        {paragraphs.map((paragraph, index) =>
          paragraph ? (
            <p
              key={index}
              className={
                revealing && index === lastVisible ? styles.cursor : undefined
              }
            >
              {renderText(paragraph)}
            </p>
          ) : null,
        )}
        {revealing && lastVisible < 0 && <span className={styles.cursor} />}
      </div>
      <div className="flex min-h-11 items-center gap-2" data-answer-actions>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => void copyAnswer()}
          title={
            copyState === "copied" ? "Réponse copiée" : "Copier la réponse"
          }
          aria-label={
            copyState === "copied" ? "Réponse copiée" : "Copier la réponse"
          }
          className={
            copyState === "copied"
              ? "text-teal-700 dark:text-teal-300"
              : "text-muted-foreground"
          }
        >
          {copyState === "copied" ? (
            <Check className={`size-4 ${styles.arrive}`} aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
        </Button>
        <span
          role="status"
          className={
            copyState === "error"
              ? "text-xs text-red-700 dark:text-red-300"
              : "text-xs text-muted-foreground"
          }
        >
          {copyState === "copied"
            ? "Réponse copiée"
            : copyState === "error"
              ? "Impossible de copier. Réessayez."
              : ""}
        </span>
      </div>
      {answer.citations.length > 0 && !revealing && (
        <details className={`group pt-1 ${animate ? styles.arrive : ""}`}>
          <summary className="flex min-h-11 w-fit max-w-full cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 [&::-webkit-details-marker]:hidden">
            <BookOpen
              className="size-4 shrink-0 text-teal-700 dark:text-teal-400"
              aria-hidden
            />
            Passages consultés ({answer.citations.length})
            <ChevronDown
              className="size-3.5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              aria-hidden
            />
          </summary>
          <div className={`space-y-5 pb-1 pt-4 ${styles.arrive}`}>
            {answer.citations.map((citation) => (
              <blockquote
                key={citation.id}
                className="space-y-2 border-l-2 border-teal-300 pl-4 text-sm dark:border-teal-800"
              >
                <div className="font-semibold">
                  {citation.href ? (
                    <a
                      href={citation.href}
                      onClick={(event) => openReference(event, citation)}
                      className="rounded-sm text-teal-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 dark:text-teal-300"
                    >
                      {citation.label}
                    </a>
                  ) : (
                    citation.label
                  )}
                </div>
                <p className="whitespace-pre-line leading-7 break-words text-muted-foreground">
                  {citation.text}
                </p>
              </blockquote>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

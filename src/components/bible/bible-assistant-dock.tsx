"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import styles from "./bible-assistant.module.css"

export function BibleAssistantDock({ children }: { children: ReactNode }) {
  const anchor = useRef<HTMLDivElement>(null)
  const dock = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!mounted || !anchor.current || !dock.current) return
    const placeholder = anchor.current
    const panel = dock.current
    const nav = document.querySelector<HTMLElement>(".app-bottom-nav")
    const viewport = window.visualViewport
    const measure = () => {
      const rect = placeholder.getBoundingClientRect()
      const keyboard = viewport && window.innerHeight - viewport.height > 140
      const viewportInset = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0
      const navHeight =
        nav && getComputedStyle(nav).display !== "none"
          ? nav.getBoundingClientRect().height
          : 0
      panel.style.left = `${rect.left}px`
      panel.style.width = `${rect.width}px`
      panel.style.bottom = `${viewportInset + (keyboard ? 0 : navHeight)}px`
      panel.dataset.keyboard = String(Boolean(keyboard))
      placeholder.style.height = `${panel.getBoundingClientRect().height + 24}px`
    }
    document.documentElement.classList.add(styles.composerActive)
    const observer = new ResizeObserver(measure)
    observer.observe(placeholder)
    observer.observe(panel)
    observer.observe(document.body)
    if (nav) observer.observe(nav)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, { passive: true })
    viewport?.addEventListener("resize", measure)
    viewport?.addEventListener("scroll", measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure)
      viewport?.removeEventListener("resize", measure)
      viewport?.removeEventListener("scroll", measure)
      document.documentElement.classList.remove(styles.composerActive)
    }
  }, [mounted])

  return (
    <>
      <div
        ref={anchor}
        data-composer-anchor
        className="mt-auto min-h-40 w-full shrink-0"
        aria-hidden
      />
      {mounted &&
        createPortal(
          <div
            ref={dock}
            data-assistant-composer
            className={`fixed z-40 border-t border-border/40 bg-background/95 pb-2 pt-3 backdrop-blur-xl sm:pb-3 ${styles.dock}`}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  )
}

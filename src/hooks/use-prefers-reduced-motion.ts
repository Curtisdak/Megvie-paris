"use client"

import { useSyncExternalStore } from "react"

const query = "(prefers-reduced-motion: reduce)"
const getSnapshot = () => window.matchMedia(query).matches
const getServerSnapshot = () => true

function subscribe(listener: () => void) {
  const media = window.matchMedia(query)
  media.addEventListener("change", listener)
  return () => media.removeEventListener("change", listener)
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

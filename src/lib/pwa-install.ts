export const PWA_INSTALL_STORAGE_KEY = "megvie-pwa-installed"

const standaloneDisplayModes = [
  "(display-mode: standalone)",
  "(display-mode: fullscreen)",
  "(display-mode: minimal-ui)",
  "(display-mode: window-controls-overlay)",
]

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false

  return (
    standaloneDisplayModes.some((query) => window.matchMedia(query).matches) ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  )
}

export function markPwaInstalled() {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(PWA_INSTALL_STORAGE_KEY, "true")
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

export function hasStoredPwaInstall() {
  if (typeof window === "undefined") return false

  try {
    return window.localStorage.getItem(PWA_INSTALL_STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

export function isPwaInstalled() {
  const standalone = isStandaloneDisplay()

  if (standalone) {
    markPwaInstalled()
  }

  return standalone || hasStoredPwaInstall()
}

export function getStandaloneDisplayModeQueries() {
  return standaloneDisplayModes
}

const fallbackPath = "/espace-membre"

export function getSafeRedirectPath(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string" || !value.trim()) {
    return fallbackPath
  }

  const candidate = value.trim()

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallbackPath
  }

  try {
    const url = new URL(candidate, "https://megvie.local")

    if (url.origin !== "https://megvie.local") {
      return fallbackPath
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallbackPath
  }
}

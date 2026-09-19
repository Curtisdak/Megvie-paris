"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { frFR } from "@clerk/localizations"
import { dark } from "@clerk/ui/themes"
import { useMemo, type ReactNode } from "react"
import { useTheme } from "@/components/theme-provider"

export function ThemedClerkProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  const appearance = useMemo(
    () => ({
      theme: resolvedTheme === "dark" ? dark : undefined,
      variables: {
        colorPrimary: resolvedTheme === "dark" ? "#5eead4" : "#0f766e",
        colorPrimaryForeground:
          resolvedTheme === "dark" ? "#18181b" : "#ffffff",
        colorBackground: resolvedTheme === "dark" ? "#18181b" : "#ffffff",
        colorForeground: resolvedTheme === "dark" ? "#fafafa" : "#18181b",
        colorMutedForeground: resolvedTheme === "dark" ? "#a1a1aa" : "#52525b",
        colorInput: resolvedTheme === "dark" ? "#27272a" : "#ffffff",
        colorInputForeground: resolvedTheme === "dark" ? "#fafafa" : "#18181b",
        colorNeutral: resolvedTheme === "dark" ? "#ffffff" : "#18181b",
        borderRadius: "0.5rem",
        fontFamily: "var(--font-geist-sans)",
      },
      elements: {
        cardBox: "border border-zinc-200 shadow-sm dark:border-zinc-700",
        formButtonPrimary: "min-h-11",
        formFieldInput: "min-h-11",
        userButtonPopoverCard: "border border-zinc-200 dark:border-zinc-700",
      },
    }),
    [resolvedTheme],
  )
  return (
    <ClerkProvider localization={frFR} appearance={appearance}>
      {children}
    </ClerkProvider>
  )
}

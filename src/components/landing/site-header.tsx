"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function SiteHeader() {
  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-lg backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-900/70 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
          MegVie Paris
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-white">
          Eglise MegVie Paris
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Une famille qui partage la foi, l&apos;esperance et la solidarite.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/contact" className="rounded-full">
          <Button variant="ghost" size="sm" className="rounded-full">
            Nous contacter
          </Button>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}

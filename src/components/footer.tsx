"use client"

import Link from "next/link"

export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-6 text-xs text-muted-foreground">
      <p className="font-semibold text-zinc-800 dark:text-zinc-100">
        MegVie Paris
      </p>
      <p className="mt-1">
        Created by{" "}
        <Link
          href="https://serik-website.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-amber-600 hover:underline dark:text-amber-300"
        >
          Curtis Dakouri
        </Link>{" "}
        - Ensemble, faisons grandir l&apos;esperance.
      </p>
    </footer>
  )
}

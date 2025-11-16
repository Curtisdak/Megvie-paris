"use client"

import Link from "next/link"

export function Footer() {
  return (
    <footer className=" rounded-3xl border border-zinc-200/70 bg-white/80 p-6 text-center text-sm text-zinc-600 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
      <p className="font-semibold text-zinc-800 dark:text-zinc-100">
        MegVie Paris
      </p>
      <p className="mt-1">
        Created by{" "}
        <Link
          href="https://www.curtisdakouri.com"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-amber-600 hover:underline dark:text-amber-300"
        >
          Curtis Dakouri
        </Link>{" "}
        · Ensemble, faisons grandir l&apos;esperance.
      </p>
    </footer>
  )
}

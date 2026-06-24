import type { ReactNode } from "react"

export function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-3 py-6 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50 sm:px-4 sm:py-12">
      <main className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="rounded-[28px] bg-gradient-to-br from-zinc-950 via-amber-900 to-emerald-800 p-6 text-white shadow-2xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-100">
            {eyebrow}
          </p>
          <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
            {description}
          </p>
        </section>
        <section className="rounded-[28px] border border-zinc-200 bg-white/95 p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/85 sm:p-7">
          {children}
        </section>
      </main>
    </div>
  )
}

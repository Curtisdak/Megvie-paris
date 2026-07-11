import { SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminFilterBar({
  children,
  title = "Recherche et filtres",
  description = "Affinez les résultats affichés.",
  className,
}: {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}) {
  return (
    <section
      className={cn(
        "admin-filter-bar overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.055)] dark:border-white/10 dark:bg-[#111114]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-zinc-200/80 bg-gradient-to-r from-zinc-50 via-white to-orange-50/60 px-4 py-3 dark:border-white/10 dark:from-white/5 dark:via-transparent dark:to-orange-500/10 sm:px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-950 text-white shadow-md dark:bg-white dark:text-zinc-950">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-zinc-950 dark:text-white">{title}</h3>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
        <span className="hidden rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 sm:inline-flex">
          Affiner
        </span>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  )
}

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
        "admin-filter-bar border-y border-border bg-card",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 pt-4 sm:px-5">
        <span className="grid size-7 shrink-0 place-items-center text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-zinc-950 dark:text-white">{title}</h3>
          <p className="sr-only">{description}</p>
        </div>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  )
}

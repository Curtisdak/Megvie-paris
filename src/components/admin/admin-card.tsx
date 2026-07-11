import { cn } from "@/lib/utils"

export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-zinc-200/80 bg-[linear-gradient(145deg,#ffffff_0%,#fffdfa_55%,#f8fffc_100%)] p-4 shadow-[0_12px_36px_rgba(15,23,42,0.055)] transition-[border-color,box-shadow] duration-300 dark:border-white/10 dark:bg-[linear-gradient(145deg,#111114_0%,#16110e_56%,#0b1511_100%)] sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center dark:border-zinc-700 dark:bg-white/[0.025] sm:p-6">
      <p className="font-semibold text-zinc-900 dark:text-white">{title}</p>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  )
}

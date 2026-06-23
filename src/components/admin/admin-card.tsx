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
        "rounded-[1.35rem] border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:rounded-2xl sm:p-5",
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
    <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center dark:border-zinc-700 dark:bg-zinc-900/60 sm:rounded-2xl sm:p-6">
      <p className="font-semibold text-zinc-900 dark:text-white">{title}</p>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  )
}

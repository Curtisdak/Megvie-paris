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
        "border-y border-border bg-card px-4 py-5 sm:px-5",
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
    <div className="flex min-h-36 flex-col items-center justify-center px-5 py-8 text-center">
      <p className="font-semibold text-zinc-900 dark:text-white">{title}</p>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  )
}

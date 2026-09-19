import type { ReactNode } from "react"

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <header className="page-heading flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold text-teal-700 dark:text-teal-300">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold leading-tight">{title}</h1>
        {description && (
          <div className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      )}
    </header>
  )
}

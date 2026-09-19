export function PageSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div role="status" aria-label="Chargement de la page" className="space-y-6">
      <span className="sr-only">Chargement en cours...</span>
      <div aria-hidden className="space-y-3 border-b border-border pb-6">
        <div className="app-skeleton h-3 w-24" />
        <div className="app-skeleton h-8 w-2/3 max-w-80" />
        <div className="app-skeleton h-4 w-4/5 max-w-lg" />
      </div>
      <div
        aria-hidden
        className={`grid gap-3 ${compact ? "grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"}`}
      >
        {[0, 1, 2, ...(compact ? [3] : [])].map((item) => (
          <div key={item} className="app-skeleton h-24" />
        ))}
      </div>
      <div
        aria-hidden
        className="space-y-4 rounded-lg border border-border bg-card p-4"
      >
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="app-skeleton h-12" />
        ))}
      </div>
    </div>
  )
}

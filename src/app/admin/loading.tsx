export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <section className="border-b border-zinc-200 pb-5 dark:border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-32 rounded-full bg-amber-200/80 dark:bg-amber-500/20" />
          <div className="h-8 w-2/3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-full max-w-xl rounded-full bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
      </section>
      <div className="grid animate-pulse gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#111114]"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#111114]" />
    </div>
  )
}

export default function Loading() {
  return (
    <main className="mx-auto min-h-[70svh] w-full max-w-6xl px-3 py-6 sm:px-6">
      <div className="animate-pulse space-y-5">
        <div className="h-44 rounded-[1.75rem] bg-zinc-200/80 dark:bg-zinc-800/80 sm:h-64" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-24 rounded-3xl bg-zinc-200/70 dark:bg-zinc-800/70" />
          <div className="h-24 rounded-3xl bg-zinc-200/70 dark:bg-zinc-800/70" />
          <div className="h-24 rounded-3xl bg-zinc-200/70 dark:bg-zinc-800/70" />
        </div>
        <div className="h-72 rounded-[1.75rem] bg-zinc-200/60 dark:bg-zinc-800/60" />
      </div>
    </main>
  )
}

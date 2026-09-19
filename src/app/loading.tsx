import { PageSkeleton } from "@/components/ui/page-skeleton"

export default function Loading() {
  return (
    <main className="app-page mx-auto w-full max-w-6xl">
      <PageSkeleton />
    </main>
  )
}

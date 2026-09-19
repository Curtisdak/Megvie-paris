import type { ReactNode } from "react"
import { PageHeading } from "@/components/ui/page-heading"

export function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="app-page">
      <main className="mx-auto w-full max-w-2xl space-y-6">
        <PageHeading eyebrow={eyebrow} title={title} description={description} />
        <section className="min-w-0 [&_.cl-rootBox]:mx-auto [&_.cl-rootBox]:max-w-full [&_.cl-cardBox]:max-w-full [&_.cl-card]:max-w-full">
          {children}
        </section>
      </main>
    </div>
  )
}

import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="app-page flex min-h-[60svh] flex-col items-center justify-center text-center">
      <Search className="size-9 text-teal-700 dark:text-teal-300" aria-hidden />
      <p className="mt-5 text-xs font-semibold text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Page introuvable</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Cette page a été déplacée ou n&apos;existe plus.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">
          <ArrowLeft aria-hidden />
          Retour à l&apos;accueil
        </Link>
      </Button>
    </main>
  )
}

"use client"

import Link from "next/link"
import { RefreshCw, ArrowLeft, CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section
      role="alert"
      className="app-page flex min-h-[60svh] flex-col items-center justify-center text-center"
    >
      <CircleAlert className="size-9 text-amber-600" aria-hidden />
      <h1 className="mt-5 text-2xl font-semibold">La page est indisponible</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        Nous ne pouvons pas afficher ce contenu pour le moment. Vous pouvez
        réessayer dans quelques instants.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RefreshCw aria-hidden />
          Réessayer
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft aria-hidden />
            Accueil
          </Link>
        </Button>
      </div>
    </section>
  )
}

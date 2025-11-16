"use client"

import Link from "next/link"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const campusAddress = {
  label: "MegVie Paris - Campus Central",
  street: "21 Rue de la Paix, 75002 Paris",
  schedule: "Dimanche · 10h30 & 14h00",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=21+Rue+de+la+Paix,+75002+Paris",
}

export function JoinServiceDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="h-14 rounded-full border-zinc-300 bg-transparent px-8 text-lg dark:border-zinc-700"
        >
          Rejoindre un culte
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-lg border-amber-100 bg-white/95 text-zinc-900 shadow-2xl dark:border-amber-400/30 dark:bg-zinc-950 dark:text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-amber-700 dark:text-amber-200">
            Nous serions heureux de vous accueillir
          </DialogTitle>
          <DialogDescription className="text-base text-zinc-600 dark:text-zinc-300">
            Venez partager un moment de foi et de fraternite avec la famille
            MegVie Paris. Chaque culte est une celebration pleine
            d&apos;esperance.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 dark:border-amber-400/30 dark:bg-amber-400/10">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-700">
            Campus principal
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
            {campusAddress.label}
          </p>
          <Link
            href={campusAddress.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-3 rounded-xl border border-amber-100 bg-white/90 px-4 py-3 text-left text-sm shadow-sm transition hover:border-amber-300 dark:border-amber-400/20 dark:bg-zinc-900/80"
          >
            <span className="rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-400/20 dark:text-amber-100">
              <MapPin className="h-4 w-4" />
            </span>
            <span>
              <span className="block font-medium">{campusAddress.street}</span>
              <span className="text-zinc-600 dark:text-zinc-300">
                {campusAddress.schedule}
              </span>
            </span>
          </Link>
          <p className="mt-3 text-sm text-amber-900 dark:text-amber-100">
            Cliquez sur l&apos;adresse pour ouvrir Google Maps et planifier
            votre venue. Nous avons hate de prier avec vous !
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

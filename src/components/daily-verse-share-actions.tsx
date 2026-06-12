"use client"

import Link from "next/link"
import { Copy, HeartHandshake, Share2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type DailyVerseShareActionsProps = {
  reference: string
  text: string
}

export function DailyVerseShareActions({
  reference,
  text,
}: DailyVerseShareActionsProps) {
  const shareText = `${text} \u2014 ${reference}`

  const copyVerse = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`)
    toast.success("Verset copie", {
      description: "Vous pouvez maintenant le partager.",
    })
  }

  const shareVerse = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Verset du jour \u2014 MegVie Paris",
          text: shareText,
          url: window.location.href,
        })
        return
      }

      await copyVerse()
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      toast.error("Partage impossible", {
        description: "Le verset n'a pas pu etre partage.",
      })
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Button
        type="button"
        className="w-full rounded-full bg-amber-600 px-6 text-white hover:bg-amber-500 sm:w-auto"
        onClick={shareVerse}
      >
        <Share2 className="mr-2 h-4 w-4" />
        Partager ce verset
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full border-zinc-300 sm:w-auto"
        onClick={copyVerse}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copier
      </Button>
      <Button
        asChild
        type="button"
        variant="outline"
        className="w-full rounded-full border-amber-200 text-amber-700 dark:border-amber-400/30 dark:text-amber-200 sm:w-auto"
      >
        <Link href="/#don">
          <HeartHandshake className="mr-2 h-4 w-4" />
          Faire un don
        </Link>
      </Button>
    </div>
  )
}

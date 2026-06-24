"use client"

import { useMemo, useState } from "react"
import {
  Copy,
  LinkIcon,
  Mail,
  MessageCircle,
  Share2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type VerseShareDialogProps = {
  reference: string
  text: string
  translation: string
  href: string
  triggerLabel?: string
  compact?: boolean
}

function safeRelativeHref(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/bible"

  try {
    const url = new URL(value, "https://megvie.local")
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return "/bible"
  }
}

export function VerseShareDialog({
  reference,
  text,
  translation,
  href,
  triggerLabel = "Partager",
  compact = false,
}: VerseShareDialogProps) {
  const [open, setOpen] = useState(false)
  const shareData = useMemo(() => {
    const relativeHref = safeRelativeHref(href)
    const origin =
      typeof window === "undefined" ? "https://megvieparis.com" : window.location.origin
    const url = `${origin}${relativeHref}`
    const shareText = `${text} - ${reference} (${translation})`

    return {
      url,
      text: shareText,
      encodedText: encodeURIComponent(shareText),
      encodedUrl: encodeURIComponent(url),
      mailSubject: encodeURIComponent(`Verset biblique - ${reference}`),
    }
  }, [href, reference, text, translation])

  const copyText = async () => {
    await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
    toast.success("Verset copie", {
      description: "Le texte et le lien sont prets a partager.",
    })
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareData.url)
    toast.success("Lien copie")
  }

  const nativeShare = async () => {
    try {
      if (!navigator.share) {
        await copyText()
        return
      }

      await navigator.share({
        title: `MegVie Paris - ${reference}`,
        text: shareData.text,
        url: shareData.url,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      toast.error("Partage impossible", {
        description: "Copiez le verset ou choisissez une autre option.",
      })
    }
  }

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${shareData.encodedText}%0A${shareData.encodedUrl}`,
      icon: MessageCircle,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareData.encodedUrl}`,
      icon: Share2,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${shareData.encodedText}&url=${shareData.encodedUrl}`,
      icon: Share2,
    },
    {
      label: "Email",
      href: `mailto:?subject=${shareData.mailSubject}&body=${shareData.encodedText}%0A${shareData.encodedUrl}`,
      icon: Mail,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={compact ? "ghost" : "outline"}
          size={compact ? "icon" : "sm"}
          className={compact ? "rounded-full" : "rounded-full"}
          aria-label={`Partager ${reference}`}
        >
          <Share2 className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} aria-hidden />
          {compact ? <span className="sr-only">{triggerLabel}</span> : triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.5rem] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Partager ce verset</DialogTitle>
          <DialogDescription>
            {reference} - {translation}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200">
          {text}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" className="rounded-full" onClick={nativeShare}>
            <Share2 className="h-4 w-4" aria-hidden />
            Partage natif
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={copyText}
          >
            <Copy className="h-4 w-4" aria-hidden />
            Copier le texte
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={copyLink}
          >
            <LinkIcon className="h-4 w-4" aria-hidden />
            Copier le lien
          </Button>
          {links.map((item) => {
            const Icon = item.icon

            return (
              <Button
                key={item.label}
                asChild
                type="button"
                variant="outline"
                className="rounded-full"
              >
                <a href={item.href} target="_blank" rel="noreferrer noopener">
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </a>
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

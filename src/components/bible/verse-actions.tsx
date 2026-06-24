"use client"

import { useOptimistic, useState, useTransition } from "react"
import { Heart, Loader2, NotebookPen, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
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
import { Textarea } from "@/components/ui/textarea"
import {
  deleteBibleNoteAction,
  toggleBibleFavoriteAction,
  upsertBibleNoteAction,
} from "@/lib/bible-actions"
import { cn } from "@/lib/utils"
import { VerseShareDialog } from "@/components/bible/verse-share-dialog"

export type VerseActionState = {
  favoriteId: string | null
  note: {
    id: string
    content: string
  } | null
}

type BibleVerseActionsProps = {
  authenticated: boolean
  book: string
  chapter: number
  verse: number
  reference: string
  text: string
  translation: string
  href: string
  state: VerseActionState
}

function createVerseFormData({
  book,
  chapter,
  verse,
  translation,
  content,
}: {
  book: string
  chapter: number
  verse: number
  translation: string
  content?: string
}) {
  const formData = new FormData()
  formData.set("book", book)
  formData.set("chapter", String(chapter))
  formData.set("verseStart", String(verse))
  formData.set("verseEnd", String(verse))
  formData.set("translation", translation)

  if (content !== undefined) {
    formData.set("content", content)
  }

  return formData
}

function showLoginToast() {
  toast.info("Connexion requise", {
    description: "Connectez-vous pour enregistrer ce verset dans votre espace.",
  })
}

export function BibleVerseActions({
  authenticated,
  book,
  chapter,
  verse,
  reference,
  text,
  translation,
  href,
  state,
}: BibleVerseActionsProps) {
  const router = useRouter()
  const [favoriteBase, setFavoriteBase] = useState(state.favoriteId)
  const [noteBase, setNoteBase] = useState(state.note)
  const [noteDraft, setNoteDraft] = useState(state.note?.content ?? "")
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [isFavoritePending, startFavoriteTransition] = useTransition()
  const [isNotePending, startNoteTransition] = useTransition()
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(
    favoriteBase,
    (_current, next: string | null) => next,
  )
  const [optimisticNote, setOptimisticNote] = useOptimistic(
    noteBase,
    (_current, next: VerseActionState["note"]) => next,
  )

  const isFavorited = Boolean(optimisticFavorite)
  const hasNote = Boolean(optimisticNote?.content.trim())

  const toggleFavorite = () => {
    if (!authenticated) {
      showLoginToast()
      return
    }

    const previous = favoriteBase
    const optimisticId = previous ? null : `optimistic-${book}-${chapter}-${verse}`

    startFavoriteTransition(async () => {
      setOptimisticFavorite(optimisticId)
      const result = await toggleBibleFavoriteAction(
        createVerseFormData({ book, chapter, verse, translation }),
      )

      if (!result.ok) {
        setOptimisticFavorite(previous)
        toast.error("Favori non enregistre", { description: result.message })
        return
      }

      setFavoriteBase(result.favoriteId)
      toast.success(result.message)
      router.refresh()
    })
  }

  const saveNote = () => {
    if (!authenticated) {
      showLoginToast()
      return
    }

    const content = noteDraft.trim()

    if (content.length < 1 || content.length > 2000) {
      toast.error("Note invalide", {
        description: "La note doit contenir entre 1 et 2000 caracteres.",
      })
      return
    }

    const previous = noteBase
    const optimistic = {
      id: previous?.id ?? `optimistic-${book}-${chapter}-${verse}`,
      content,
    }

    startNoteTransition(async () => {
      setOptimisticNote(optimistic)
      const result = await upsertBibleNoteAction(
        createVerseFormData({ book, chapter, verse, translation, content }),
      )

      if (!result.ok) {
        setOptimisticNote(previous)
        toast.error("Note non enregistree", { description: result.message })
        return
      }

      const next = { id: result.noteId, content: result.content }
      setNoteBase(next)
      setNoteDraft(result.content)
      setNoteDialogOpen(false)
      toast.success(result.message)
      router.refresh()
    })
  }

  const deleteNote = () => {
    if (!authenticated || !noteBase?.id) return

    const previous = noteBase

    startNoteTransition(async () => {
      setOptimisticNote(null)
      const formData = new FormData()
      formData.set("noteId", previous.id)
      const result = await deleteBibleNoteAction(formData)

      if (!result.ok) {
        setOptimisticNote(previous)
        toast.error("Note non supprimee", { description: result.message })
        return
      }

      setNoteBase(null)
      setNoteDraft("")
      setNoteDialogOpen(false)
      toast.success(result.message)
      router.refresh()
    })
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "rounded-full",
          isFavorited
            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-400/10 dark:text-rose-100"
            : "text-zinc-500 hover:text-rose-600 dark:text-zinc-300",
        )}
        disabled={isFavoritePending}
        onClick={toggleFavorite}
        aria-pressed={isFavorited}
      >
        {isFavoritePending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Heart
            className={cn("h-4 w-4", isFavorited && "fill-current")}
            aria-hidden
          />
        )}
        {isFavorited ? "Favori" : "Favoris"}
      </Button>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full",
              hasNote
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-400/10 dark:text-amber-100"
                : "text-zinc-500 dark:text-zinc-300",
            )}
          >
            <NotebookPen className="h-4 w-4" aria-hidden />
            {hasNote ? "Note" : "Ajouter note"}
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-[1.5rem] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Note biblique privee</DialogTitle>
            <DialogDescription>
              {reference} - visible uniquement dans votre espace membre.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-600 dark:bg-zinc-950/60 dark:text-zinc-300">
            {text}
          </div>
          <Textarea
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            maxLength={2000}
            rows={6}
            placeholder="Votre note personnelle..."
            className="min-h-36 rounded-2xl"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">{noteDraft.trim().length}/2000</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {noteBase ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full text-red-600"
                  disabled={isNotePending}
                  onClick={deleteNote}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Supprimer
                </Button>
              ) : null}
              <Button
                type="button"
                className="rounded-full bg-amber-600 text-white hover:bg-amber-500"
                disabled={isNotePending}
                onClick={saveNote}
              >
                {isNotePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VerseShareDialog
        compact
        reference={reference}
        text={text}
        translation={translation}
        href={href}
      />
    </div>
  )
}

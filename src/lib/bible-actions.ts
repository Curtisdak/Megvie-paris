"use server"

import { revalidatePath } from "next/cache"
import { requireCurrentAppUser } from "@/lib/auth/clerk-user"
import {
  validateBibleVerseSelection,
  type BibleVerseSelectionInput,
} from "@/lib/bible-member"
import { prisma } from "@/lib/prisma"

export type BibleActionResult<T extends object = object> =
  | ({ ok: true; message: string } & T)
  | { ok: false; message: string }

function inputFromFormData(formData: FormData): BibleVerseSelectionInput {
  return {
    book: String(formData.get("book") ?? ""),
    chapter: Number(formData.get("chapter") ?? 0),
    verseStart: Number(formData.get("verseStart") ?? 0),
    verseEnd: Number(formData.get("verseEnd") ?? formData.get("verseStart") ?? 0),
    translation: String(formData.get("translation") ?? ""),
  }
}

function getNoteContent(formData: FormData) {
  return String(formData.get("content") ?? "").trim()
}

export async function toggleBibleFavoriteAction(
  formData: FormData,
): Promise<BibleActionResult<{ favorited: boolean; favoriteId: string | null }>> {
  const user = await requireCurrentAppUser("/bible")

  try {
    const selection = validateBibleVerseSelection(inputFromFormData(formData))
    const existing = await prisma.bibleFavorite.findFirst({
      where: {
        userId: user.id,
        book: selection.book,
        chapter: selection.chapter,
        verseStart: selection.verseStart,
        verseEnd: selection.verseEnd,
        translation: selection.translation,
      },
      select: { id: true },
    })

    if (existing) {
      await prisma.bibleFavorite.deleteMany({
        where: { id: existing.id, userId: user.id },
      })
      revalidatePath("/espace-membre/versets-favoris")

      return {
        ok: true,
        message: "Favori retire.",
        favorited: false,
        favoriteId: null,
      }
    }

    const favorite = await prisma.bibleFavorite.create({
      data: {
        userId: user.id,
        book: selection.book,
        chapter: selection.chapter,
        verseStart: selection.verseStart,
        verseEnd: selection.verseEnd,
        reference: selection.reference,
        verseTextSnapshot: selection.text,
        translation: selection.translation,
      },
      select: { id: true },
    })

    revalidatePath("/espace-membre/versets-favoris")

    return {
      ok: true,
      message: "Verset ajoute aux favoris.",
      favorited: true,
      favoriteId: favorite.id,
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de modifier ce favori.",
    }
  }
}

export async function removeBibleFavoriteAction(
  formData: FormData,
): Promise<BibleActionResult> {
  const user = await requireCurrentAppUser("/espace-membre/versets-favoris")
  const favoriteId = String(formData.get("favoriteId") ?? "")

  if (!favoriteId) {
    return { ok: false, message: "Favori introuvable." }
  }

  await prisma.bibleFavorite.deleteMany({
    where: { id: favoriteId, userId: user.id },
  })

  revalidatePath("/espace-membre/versets-favoris")

  return { ok: true, message: "Favori supprime." }
}

export async function upsertBibleNoteAction(
  formData: FormData,
): Promise<BibleActionResult<{ noteId: string; content: string }>> {
  const user = await requireCurrentAppUser("/bible")
  const content = getNoteContent(formData)

  if (content.length < 1 || content.length > 2000) {
    return {
      ok: false,
      message: "La note doit contenir entre 1 et 2000 caracteres.",
    }
  }

  try {
    const selection = validateBibleVerseSelection(inputFromFormData(formData))
    const note = await prisma.bibleNote.upsert({
      where: {
        userId_book_chapter_verseStart_verseEnd_translation: {
          userId: user.id,
          book: selection.book,
          chapter: selection.chapter,
          verseStart: selection.verseStart,
          verseEnd: selection.verseEnd,
          translation: selection.translation,
        },
      },
      update: {
        reference: selection.reference,
        content,
      },
      create: {
        userId: user.id,
        book: selection.book,
        chapter: selection.chapter,
        verseStart: selection.verseStart,
        verseEnd: selection.verseEnd,
        reference: selection.reference,
        translation: selection.translation,
        content,
      },
      select: { id: true, content: true },
    })

    revalidatePath("/espace-membre/notes-bibliques")

    return {
      ok: true,
      message: "Note enregistree.",
      noteId: note.id,
      content: note.content,
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer cette note.",
    }
  }
}

export async function deleteBibleNoteAction(
  formData: FormData,
): Promise<BibleActionResult<{ noteId: string }>> {
  const user = await requireCurrentAppUser("/espace-membre/notes-bibliques")
  const noteId = String(formData.get("noteId") ?? "")

  if (!noteId) {
    return { ok: false, message: "Note introuvable." }
  }

  await prisma.bibleNote.deleteMany({
    where: { id: noteId, userId: user.id },
  })

  revalidatePath("/espace-membre/notes-bibliques")

  return { ok: true, message: "Note supprimee.", noteId }
}

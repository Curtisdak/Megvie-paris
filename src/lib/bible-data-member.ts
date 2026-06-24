import "server-only"

import { requireCurrentAppUser } from "@/lib/auth/clerk-user"
import { prisma } from "@/lib/prisma"

const biblePageSize = 50

function contains(value: string | null) {
  return value ? { contains: value, mode: "insensitive" as const } : undefined
}

export async function listCurrentUserBibleFavorites(options: {
  search?: string
  sort?: string
} = {}) {
  const user = await requireCurrentAppUser("/espace-membre/versets-favoris")
  const query = options.search?.trim() || null
  const search = contains(query)

  return prisma.bibleFavorite.findMany({
    where: {
      userId: user.id,
      OR: search
        ? [
            { reference: search },
            { verseTextSnapshot: search },
            { book: search },
          ]
        : undefined,
    },
    orderBy:
      options.sort === "reference"
        ? [{ book: "asc" }, { chapter: "asc" }, { verseStart: "asc" }]
        : [{ createdAt: "desc" }],
    take: biblePageSize,
  })
}

export async function listCurrentUserBibleNotes(options: {
  search?: string
  sort?: string
} = {}) {
  const user = await requireCurrentAppUser("/espace-membre/notes-bibliques")
  const query = options.search?.trim() || null
  const search = contains(query)

  return prisma.bibleNote.findMany({
    where: {
      userId: user.id,
      OR: search
        ? [{ reference: search }, { content: search }, { book: search }]
        : undefined,
    },
    orderBy:
      options.sort === "reference"
        ? [{ book: "asc" }, { chapter: "asc" }, { verseStart: "asc" }]
        : [{ updatedAt: "desc" }],
    take: biblePageSize,
  })
}

export async function getCurrentUserBibleStateForChapter(input: {
  userId: string
  book: string
  chapter: number
  translation: string
}) {
  const [favorites, notes] = await Promise.all([
    prisma.bibleFavorite.findMany({
      where: {
        userId: input.userId,
        book: input.book,
        chapter: input.chapter,
        translation: input.translation,
      },
      select: {
        id: true,
        verseStart: true,
        verseEnd: true,
      },
    }),
    prisma.bibleNote.findMany({
      where: {
        userId: input.userId,
        book: input.book,
        chapter: input.chapter,
        translation: input.translation,
      },
      select: {
        id: true,
        verseStart: true,
        verseEnd: true,
        content: true,
        updatedAt: true,
      },
    }),
  ])

  return { favorites, notes }
}

export const INSUFFICIENT_BIBLE_CONTEXT =
  "Je ne trouve pas suffisamment d'informations dans la Bible pour répondre à cette question."

export type BibleCitation = {
  id: string
  label: string
  text: string
  href: string | null
  bookId?: string
  chapter?: number
  verses?: number[]
}

export type BibleAssistantAnswer = {
  insufficient: boolean
  paragraphs: string[]
  citations: BibleCitation[]
}

export type BibleAssistantTurn = {
  id: string
  question: string
  answer: BibleAssistantAnswer
  input?: "voice"
}

export const BIBLE_QUESTION_MAX_LENGTH = 500
export const BIBLE_TRANSCRIPT_MAX_LENGTH = 3000
export const BIBLE_SESSION_MAX_TURNS = 12
export const BIBLE_HISTORY_MAX_TURNS = 6
export const BIBLE_HISTORY_ANSWER_MAX_LENGTH = 2000

export type BibleAssistantHistoryTurn = {
  question: string
  answer: string
  references: { book: string; chapter: number; verses: number[] }[]
}

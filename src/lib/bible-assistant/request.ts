import {
  BIBLE_QUESTION_MAX_LENGTH,
  BIBLE_TRANSCRIPT_MAX_LENGTH,
  BIBLE_HISTORY_MAX_TURNS,
  BIBLE_HISTORY_ANSWER_MAX_LENGTH,
  type BibleAssistantHistoryTurn,
} from "./types"
import { isRecord } from "./grounding"

export function validateAssistantRequest(value: unknown) {
  if (!isRecord(value) || typeof value.question !== "string") return null
  const question = value.question.trim()
  if (question.length < 3 || question.length > BIBLE_QUESTION_MAX_LENGTH)
    return null
  const previousQuestions = value.previousQuestions ?? []
  if (
    !Array.isArray(previousQuestions) ||
    previousQuestions.length > 3 ||
    previousQuestions.some(
      (item) =>
        typeof item !== "string" ||
        !item.trim() ||
        item.length > BIBLE_QUESTION_MAX_LENGTH,
    )
  )
    return null
  // Accept older open tabs during deployment; new clients send both sides of each turn.
  const rawHistory =
    value.history ??
    previousQuestions.map((item: string) => ({
      question: item.trim(),
      answer: "",
      references: [],
    }))
  if (!Array.isArray(rawHistory) || rawHistory.length > BIBLE_HISTORY_MAX_TURNS)
    return null
  const history: BibleAssistantHistoryTurn[] = []
  for (const turn of rawHistory) {
    if (
      !isRecord(turn) ||
      typeof turn.question !== "string" ||
      !turn.question.trim() ||
      turn.question.length > BIBLE_TRANSCRIPT_MAX_LENGTH ||
      typeof turn.answer !== "string" ||
      turn.answer.length > BIBLE_HISTORY_ANSWER_MAX_LENGTH ||
      !Array.isArray(turn.references) ||
      turn.references.length > 8
    )
      return null
    const references: BibleAssistantHistoryTurn["references"] = []
    for (const reference of turn.references) {
      if (
        !isRecord(reference) ||
        typeof reference.book !== "string" ||
        !reference.book.trim() ||
        reference.book.length > 60 ||
        typeof reference.chapter !== "number" ||
        !Number.isInteger(reference.chapter) ||
        reference.chapter < 1 ||
        reference.chapter > 150 ||
        !Array.isArray(reference.verses) ||
        reference.verses.length > 180 ||
        reference.verses.some(
          (verse) => !Number.isInteger(verse) || verse < 1 || verse > 180,
        )
      )
        return null
      references.push({
        book: reference.book.trim(),
        chapter: reference.chapter,
        verses: reference.verses,
      })
    }
    history.push({
      question: turn.question.trim(),
      answer: turn.answer.trim(),
      references,
    })
  }
  return { question, history }
}

export async function readAssistantRequest(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) return null
  const chunks: Uint8Array[] = []
  let bytes = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > 65536) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
    return validateAssistantRequest(
      JSON.parse(Buffer.concat(chunks).toString("utf8")),
    )
  } catch {
    return null
  } finally {
    reader.releaseLock()
  }
}

export function isAssistantSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  const allowed = [new URL(request.url).origin]
  for (const url of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]) {
    if (url) {
      try {
        allowed.push(new URL(url).origin)
      } catch {}
    }
  }
  return Boolean(
    origin &&
    allowed.includes(origin) &&
    request.headers.get("sec-fetch-site") !== "cross-site",
  )
}

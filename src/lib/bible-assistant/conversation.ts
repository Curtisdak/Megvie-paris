import {
  BIBLE_HISTORY_ANSWER_MAX_LENGTH,
  BIBLE_HISTORY_MAX_TURNS,
  type BibleAssistantHistoryTurn,
  type BibleAssistantTurn,
} from "./types"

// Keep conversational meaning, not whole chapter extracts or client-supplied URLs.
export function buildAssistantHistory(
  turns: BibleAssistantTurn[],
): BibleAssistantHistoryTurn[] {
  return turns.slice(-BIBLE_HISTORY_MAX_TURNS).map(({ question, answer }) => ({
    question,
    answer: answer.paragraphs
      .join("\n")
      .replace(
        /\[\[([A-Z0-9]+)\]\]/g,
        (_, id: string) =>
          answer.citations.find((source) => source.id === id)?.label ?? "",
      )
      .slice(0, BIBLE_HISTORY_ANSWER_MAX_LENGTH),
    references: answer.citations
      .filter((source) => source.bookId && source.chapter)
      .slice(0, 8)
      .map((source) => ({
        book: source.bookId!,
        chapter: source.chapter!,
        verses: source.verses ?? [],
      })),
  }))
}

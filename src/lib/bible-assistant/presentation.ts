import type { BibleAssistantAnswer } from "./types"

export function formatBibleAnswerForCopy(answer: BibleAssistantAnswer) {
  return answer.paragraphs
    .map((paragraph) =>
      paragraph
        .replace(/\]\]\s*(?=\[\[)/g, "]], ")
        .replace(
          /\[\[([A-Z0-9]+)\]\]/g,
          (_, id: string) =>
            answer.citations.find((citation) => citation.id === id)?.label ??
            "",
        )
        .trim(),
    )
    .join("\n\n")
}

// A reference is revealed as one token, never as a broken [[P... marker.
export function revealBibleParagraph(text: string, characters: number) {
  let remaining = Math.max(0, Math.floor(characters))
  let revealed = ""
  for (const part of text.split(/(\[\[[A-Z0-9]+\]\])/g)) {
    if (!remaining) break
    if (/^\[\[[A-Z0-9]+\]\]$/.test(part)) {
      if (remaining < part.length) break
      revealed += part
    } else {
      revealed += part.slice(0, remaining)
    }
    remaining = Math.max(0, remaining - part.length)
  }
  return revealed
}

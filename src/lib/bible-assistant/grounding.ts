import { extractBibleReferences } from "./retrieval"
import {
  INSUFFICIENT_BIBLE_CONTEXT,
  type BibleAssistantAnswer,
  type BibleCitation,
} from "./types"

export const insufficientBibleAnswer = (): BibleAssistantAnswer => ({
  insufficient: true,
  paragraphs: [INSUFFICIENT_BIBLE_CONTEXT],
  citations: [],
})

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function citationIds(text: string) {
  return [...text.matchAll(/\[\[([A-Z0-9]+)\]\]/g)].map((match) => match[1])
}

function canonicalEvidence(text: string) {
  // Presentation may differ in evidence JSON; displayed extracts always use the original corpus.
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

export function validateGroundedAnswer(
  raw: unknown,
  sources: BibleCitation[],
): BibleAssistantAnswer | null {
  if (!isRecord(raw) || typeof raw.insufficient !== "boolean") return null
  if (raw.insufficient) return insufficientBibleAnswer()
  if (
    !Array.isArray(raw.paragraphs) ||
    !raw.paragraphs.length ||
    raw.paragraphs.length > 5
  )
    return null
  const used = new Set<string>()
  const paragraphs: string[] = []
  // A rejected paragraph cannot contribute text or citations to the independent entailment check.
  paragraphLoop: for (const paragraph of raw.paragraphs) {
    if (
      !isRecord(paragraph) ||
      typeof paragraph.text !== "string" ||
      !paragraph.text.trim() ||
      paragraph.text.length > 1400 ||
      !Array.isArray(paragraph.evidence)
    )
      continue paragraphLoop
    let text = paragraph.text.trim()
    const ids = citationIds(text)
    // References and quotations are rendered from our corpus, not free-form model output.
    if (
      !ids.length ||
      /\b\d+\s*:\s*\d+/.test(text) ||
      /https?:|www\.|<[^>]*>|[«»"]/.test(text) ||
      extractBibleReferences(text).length
    )
      continue paragraphLoop
    if (/\[\[|\]\]/.test(text.replace(/\[\[[A-Z0-9]+\]\]/g, "")))
      continue paragraphLoop
    const supportedIds = new Set<string>()
    for (const id of ids) {
      const source = sources.find((item) => item.id === id)
      if (!source) continue paragraphLoop
      const evidence = paragraph.evidence.find(
        (item) => isRecord(item) && item.sourceId === id,
      )
      // Drop an unsubstantiated marker, not other independently evidenced citations.
      // The final verifier still checks every claim against the remaining sources.
      if (!evidence) {
        text = text.replaceAll(`[[${id}]]`, "")
        continue
      }
      if (
        !isRecord(evidence) ||
        typeof evidence.quote !== "string" ||
        canonicalEvidence(evidence.quote).length < 12 ||
        !` ${canonicalEvidence(source.text)} `.includes(
          ` ${canonicalEvidence(evidence.quote)} `,
        )
      )
        continue paragraphLoop
      supportedIds.add(id)
    }
    if (!supportedIds.size) continue paragraphLoop
    for (const id of supportedIds) used.add(id)
    paragraphs.push(
      text
        .replace(/,\s*([.!?])/g, "$1")
        .replace(/\]\]\s*(?=\[\[)/g, "]], ")
        .replace(/ {2,}/g, " ")
        .trim(),
    )
  }
  if (!paragraphs.length) return null
  return {
    insufficient: false,
    paragraphs,
    citations: sources.filter((source) => used.has(source.id)),
  }
}

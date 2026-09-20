import assert from "node:assert/strict"
import test from "node:test"
import { tsImport } from "tsx/esm/api"

const { formatBibleAnswerForCopy, revealBibleParagraph } = await tsImport(
  "../src/lib/bible-assistant/presentation.ts",
  import.meta.url,
)

test("copying an answer preserves paragraphs and readable local references", () => {
  const text = formatBibleAnswerForCopy({
    insufficient: false,
    paragraphs: [
      "Dieu a aimé le monde [[P1]][[P2]].",
      "Le sommaire [[CATALOGUE]].",
    ],
    citations: [
      {
        id: "P1",
        label: "Jean 3:16",
        text: "Original verse",
        href: "/bible?book=JHN&chapter=3&verse=16",
      },
      {
        id: "P2",
        label: "1 Corinthiens 13:1-7",
        text: "Original verses",
        href: "/bible",
      },
      {
        id: "CATALOGUE",
        label: "Sommaire de la Bible",
        text: "Catalogue",
        href: null,
      },
    ],
  })
  assert.equal(
    text,
    "Dieu a aimé le monde Jean 3:16, 1 Corinthiens 13:1-7.\n\nLe sommaire Sommaire de la Bible.",
  )
  assert.doesNotMatch(text, /\[\[|Original verse|href|undefined/)
  assert.equal(
    formatBibleAnswerForCopy({
      insufficient: true,
      paragraphs: ["Pas assez d'informations."],
      citations: [],
    }),
    "Pas assez d'informations.",
  )
})

test("typewriter reveals references atomically and restores the exact complete answer", () => {
  const text = "Moïse [[P1]], puis [[P2]]."
  let previous = ""
  for (let count = 0; count <= text.length; count++) {
    const partial = revealBibleParagraph(text, count)
    assert.ok(partial.startsWith(previous))
    assert.doesNotMatch(partial.replace(/\[\[[A-Z0-9]+\]\]/g, ""), /\[|\]/)
    previous = partial
  }
  assert.equal(previous, text)
  assert.equal(revealBibleParagraph(text, -1), "")
  assert.equal(revealBibleParagraph(text, 10000), text)
  assert.equal(revealBibleParagraph("", 10), "")
})

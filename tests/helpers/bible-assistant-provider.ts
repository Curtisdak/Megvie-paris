import assert from "node:assert/strict"
import {
  answerBibleQuestion,
  BibleAssistantUnavailable,
} from "../../src/lib/bible-assistant/gemini"
import { buildAssistantHistory } from "../../src/lib/bible-assistant/conversation"
import type { BibleAssistantTurn } from "../../src/lib/bible-assistant/types"

async function main() {
  process.env.GEMINI_API_KEY = "test-only-not-a-real-key"
  process.env.GEMINI_MODEL = "gemini-3.1-flash-lite"
  let mode = "valid"
  let requests = 0
  globalThis.fetch = async (input, init) => {
    requests++
    assert.ok(
      String(input).startsWith(
        "https://generativelanguage.googleapis.com/v1beta/models/",
      ),
    )
    assert.ok(!String(input).includes(process.env.GEMINI_API_KEY!))
    const body = JSON.parse(String(init?.body))
    assert.equal(body.tools, undefined)
    assert.ok(body.systemInstruction.parts[0].text)
    assert.equal(init?.cache, "no-store")
    if (mode === "provider-error")
      return new Response("private provider details", { status: 429 })
    if (mode === "network-error") throw new Error("private network details")
    const user = JSON.parse(body.contents[0].parts[0].text)
    let output: unknown
    if (user.LIVRES_DISPONIBLES) {
      if (mode === "conversation") {
        assert.equal(user.HISTORIQUE[0].question, "Qui est Moïse ?")
        assert.match(user.HISTORIQUE[0].answer, /Moïse/)
        assert.ok(!JSON.stringify(user.HISTORIQUE).includes("https://"))
      }
      output =
        mode === "bad-plan"
          ? {}
          : {
              relevant: !user.QUESTION.includes("Kubernetes"),
              standaloneQuestion:
                mode === "conversation"
                  ? "Comment s'appelait le frère de Moïse ?"
                  : user.QUESTION,
              keywords: [],
              references:
                mode === "conversation"
                  ? [
                      { book: "Exode", chapter: 4, verses: [14] },
                      { book: "Nombres", chapter: 26, verses: [59] },
                      { book: "Exode", chapter: 4, verses: [999] },
                      { book: "Inventé", chapter: 1, verses: [1] },
                    ]
                  : [],
            }
    } else if (user.CONTEXTE_BIBLIQUE) {
      if (mode === "conversation") {
        assert.match(user.QUESTION_AUTONOME, /Moïse/)
        assert.ok(user.HISTORIQUE.length >= 1)
        assert.ok(
          user.CONTEXTE_BIBLIQUE.some(
            (source: { reference: string }) =>
              source.reference === "Exode 4:14",
          ),
        )
        assert.ok(!JSON.stringify(user.CONTEXTE_BIBLIQUE).includes("Inventé"))
        assert.ok(!JSON.stringify(user.CONTEXTE_BIBLIQUE).includes(":999"))
      }
      output =
        mode === "malformed"
          ? null
          : {
              insufficient: false,
              paragraphs: [
                {
                  text:
                    mode === "unknown-citation"
                      ? "Texte [[INVENTE]]."
                      : mode === "conversation"
                        ? "Aaron était le frère de Moïse [[P1]]."
                        : "Dieu a aimé le monde [[P1]].",
                  evidence: [
                    {
                      sourceId: "P1",
                      quote:
                        mode === "forged-quote"
                          ? "citation inventée"
                          : user.CONTEXTE_BIBLIQUE[0].text,
                    },
                  ],
                },
              ],
            }
      if (mode === "partial") {
        output = {
          insufficient: false,
          paragraphs: [
            {
              text: "Dieu a aimé le monde [[P1]].",
              evidence: [
                { sourceId: "P1", quote: user.CONTEXTE_BIBLIQUE[0].text },
              ],
            },
            {
              text: "Une affirmation non justifiée [[P2]].",
              evidence: [
                { sourceId: "P2", quote: user.CONTEXTE_BIBLIQUE[1].text },
              ],
            },
          ],
        }
      }
    } else {
      output = {
        analysis: "Checked against the supplied source.",
        supportedParagraphs:
          mode === "unsupported"
            ? []
            : mode === "invalid-verdict"
              ? [-1, 999]
              : [0],
      }
    }
    return Response.json({
      candidates: [
        {
          finishReason:
            mode === "truncated" && user.CONTEXTE_BIBLIQUE
              ? "MAX_TOKENS"
              : "STOP",
          content: { parts: [{ text: JSON.stringify(output) }] },
        },
      ],
    })
  }
  const response = await answerBibleQuestion("Explique Jean 3:16", [])
  assert.equal(response.insufficient, false)
  assert.equal(requests, 3)
  mode = "conversation"
  const conversation: BibleAssistantTurn[] = [
    {
      id: "first",
      question: "Qui est Moïse ?",
      answer: {
        insufficient: false,
        paragraphs: ["Moïse est un serviteur de Dieu."],
        citations: [],
      },
    },
  ]
  for (const question of [
    "avait-il des frères ?",
    "comment s'appelait son frère ?",
  ]) {
    const answer = await answerBibleQuestion(
      question,
      buildAssistantHistory(conversation),
    )
    assert.equal(answer.insufficient, false)
    assert.match(answer.paragraphs.join(" "), /Aaron/)
    assert.equal(answer.citations[0].label, "Exode 4:14")
    conversation.push({ id: question, question, answer })
  }
  mode = "partial"
  const partial = await answerBibleQuestion("Jean 3:16 et Matthieu 5:1-12", [])
  assert.deepEqual(partial.paragraphs, ["Dieu a aimé le monde [[P1]]."])
  assert.deepEqual(
    partial.citations.map((source) => source.id),
    ["P1"],
  )
  for (mode of ["unsupported"]) {
    assert.equal(
      (await answerBibleQuestion("Explique Jean 3:16", [])).insufficient,
      true,
      mode,
    )
  }
  for (mode of [
    "provider-error",
    "network-error",
    "bad-plan",
    "unknown-citation",
    "forged-quote",
    "malformed",
    "truncated",
    "invalid-verdict",
  ]) {
    await assert.rejects(
      () => answerBibleQuestion("Jean 3:16", []),
      (error: unknown) =>
        error instanceof BibleAssistantUnavailable &&
        !error.message.includes("private"),
    )
  }
  mode = "valid"
  const before = requests
  assert.equal(
    (await answerBibleQuestion("Comment configurer Kubernetes ?", []))
      .insufficient,
    true,
  )
  assert.equal(requests, before + 1)
  assert.equal((await answerBibleQuestion("Jean 999:1", [])).insufficient, true)
  assert.equal(requests, before + 1)
  console.log("Provider contract checks passed")
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

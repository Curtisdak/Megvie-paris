import assert from "node:assert/strict"
import {
  encodeBibleAudio,
  BIBLE_AUDIO_MAX_BYTES,
} from "../../src/lib/bible-assistant/audio"
import { readAssistantAudioRequest } from "../../src/lib/bible-assistant/audio-request"
import { validateAssistantRequest } from "../../src/lib/bible-assistant/request"
import {
  transcribeBibleAudio,
  BibleAssistantUnavailable,
} from "../../src/lib/bible-assistant/gemini"

async function main() {
  const bytes = new Uint8Array(encodeBibleAudio(new Float32Array(16000)))
  const upload = (type = "audio/wav", history = "[]") => {
    const form = new FormData()
    form.append("audio", new Blob([bytes], { type }), "question.wav")
    form.append("history", history)
    return form
  }
  const read = (form: FormData) =>
    readAssistantAudioRequest(
      new Request("http://localhost/api/bible/assistant/audio", {
        method: "POST",
        body: form,
      }),
    )
  assert.equal((await read(upload()))?.audio.length, bytes.length)
  assert.equal(await read(upload("audio/mp4")), null)
  assert.equal(await read(upload("audio/wav", "bad JSON")), null)
  assert.equal(
    await read(upload("audio/wav", JSON.stringify(Array(7).fill({})))),
    null,
  )
  const duplicate = upload()
  duplicate.append("audio", new Blob([bytes], { type: "audio/wav" }))
  assert.equal(await read(duplicate), null)
  const wrongDuration = upload()
  wrongDuration.set(
    "audio",
    new Blob([new Uint8Array(BIBLE_AUDIO_MAX_BYTES + 2)], {
      type: "audio/wav",
    }),
  )
  assert.equal(await read(wrongDuration), null)
  assert.equal(
    await readAssistantAudioRequest(
      new Request("http://localhost", {
        method: "POST",
        body: new Uint8Array(BIBLE_AUDIO_MAX_BYTES + 65537),
      }),
    ),
    null,
  )
  const history = [
    { question: "a".repeat(2000), answer: "Réponse", references: [] },
  ]
  assert.ok(validateAssistantRequest({ question: "Et ensuite ?", history }))
  assert.equal(
    validateAssistantRequest({ question: "a".repeat(501), history: [] }),
    null,
  )
  history[0].question = "a".repeat(3001)
  assert.equal(
    validateAssistantRequest({ question: "Et ensuite ?", history }),
    null,
  )

  process.env.GEMINI_API_KEY = "test-only"
  let output: unknown = {
    hasSpeech: true,
    transcript: "Que dit la Bible sur le pardon ?",
  }
  let mode = "valid"
  globalThis.fetch = async (url, init) => {
    assert.ok(!String(url).includes("test-only"))
    const body = JSON.parse(String(init?.body))
    const audio = body.contents[0].parts[1].inlineData
    assert.equal(audio.mimeType, "audio/wav")
    assert.deepEqual(Buffer.from(audio.data, "base64"), Buffer.from(bytes))
    assert.equal(body.tools, undefined)
    if (mode === "network") throw new Error("private provider detail")
    if (mode === "error") return new Response("private key", { status: 400 })
    return Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: JSON.stringify(output) }] },
        },
      ],
    })
  }
  assert.equal(
    await transcribeBibleAudio(bytes),
    "Que dit la Bible sur le pardon ?",
  )
  output = { hasSpeech: false, transcript: "" }
  assert.equal(await transcribeBibleAudio(bytes), null)
  for (output of [
    {},
    { hasSpeech: true, transcript: "a".repeat(3001) },
    { hasSpeech: "true", transcript: "Question" },
  ]) {
    await assert.rejects(
      () => transcribeBibleAudio(bytes),
      BibleAssistantUnavailable,
    )
  }
  for (mode of ["network", "error"]) {
    await assert.rejects(
      () => transcribeBibleAudio(bytes),
      (error: unknown) =>
        error instanceof BibleAssistantUnavailable &&
        !error.message.includes("private"),
    )
  }
  console.log("Audio upload and provider checks passed")
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

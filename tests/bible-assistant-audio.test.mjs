import assert from "node:assert/strict"
import test from "node:test"
import { spawnSync } from "node:child_process"
import { tsImport } from "tsx/esm/api"

const { encodeBibleAudio, validateBibleAudio, BIBLE_AUDIO_MAX_BYTES } =
  await tsImport("../src/lib/bible-assistant/audio.ts", import.meta.url)

test("voice WAV has a verifiable duration and bounded size", () => {
  for (const seconds of [0.5, 1, 30, 90]) {
    const samples = new Float32Array(seconds * 16000)
    samples[0] = -1
    samples[1] = 1
    const encoded = encodeBibleAudio(samples)
    assert.equal(validateBibleAudio(new Uint8Array(encoded)), seconds)
    assert.equal(new DataView(encoded).getInt16(44, true), -32768)
    assert.equal(new DataView(encoded).getInt16(46, true), 32767)
    assert.ok(encoded.byteLength <= BIBLE_AUDIO_MAX_BYTES)
  }
  assert.equal(
    encodeBibleAudio(new Float32Array(16000 * 91)).byteLength,
    BIBLE_AUDIO_MAX_BYTES,
  )
})

test("invalid, short, oversized, truncated and spoofed WAVs are rejected", () => {
  assert.equal(validateBibleAudio(new Uint8Array()), null)
  assert.equal(
    validateBibleAudio(new Uint8Array(encodeBibleAudio(new Float32Array(100)))),
    null,
  )
  assert.equal(
    validateBibleAudio(new Uint8Array(BIBLE_AUDIO_MAX_BYTES + 2)),
    null,
  )
  const valid = new Uint8Array(encodeBibleAudio(new Float32Array(16000)))
  assert.equal(validateBibleAudio(valid.slice(0, -2)), null)
  for (const offset of [0, 4, 8, 12, 16, 20, 22, 24, 28, 32, 34, 36, 40]) {
    const corrupt = valid.slice()
    corrupt[offset] ^= 1
    assert.equal(validateBibleAudio(corrupt), null, `offset ${offset}`)
  }
})

test("audio upload and Gemini transcription contracts", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      "tests/helpers/bible-assistant-audio.ts",
    ],
    { encoding: "utf8", timeout: 30000 },
  )
  assert.equal(result.status, 0, result.stderr || result.stdout)
})

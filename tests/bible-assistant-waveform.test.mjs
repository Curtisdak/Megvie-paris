import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { tsImport } from "tsx/esm/api"

const { audioLevel, audioPeaks } = await tsImport(
  "../src/lib/bible-assistant/audio-waveform.ts",
  import.meta.url,
)

test("assistant uses the existing compact voice composer without obsolete imports or provider branding", () => {
  const source = readFileSync(new URL("../src/components/bible/bible-assistant.tsx", import.meta.url), "utf8")
  assert.match(source, /import\s*\{\s*BibleVoiceComposer\s*\}\s*from\s*["']\.\/bible-voice-composer["']/)
  assert.match(source, /<BibleVoiceComposer\b/)
  assert.doesNotMatch(source, /BibleVoicePreview|bible-voice-preview|Gemini/i)
  assert.doesNotThrow(() => readFileSync(new URL("../src/components/bible/bible-voice-composer.tsx", import.meta.url)))
})

test("waveform reflects real audio energy, including silence", () => {
  assert.equal(audioLevel(new Float32Array()), 0)
  assert.equal(audioLevel(new Float32Array(1024)), 0)
  assert.equal(audioLevel(new Float32Array(1024).fill(1)), 1)
  const quiet = audioLevel(new Float32Array(1024).fill(0.01))
  const loud = audioLevel(new Float32Array(1024).fill(0.1))
  assert.ok(quiet > 0 && loud > quiet && loud < 1)
})

test("preview waveform preserves quiet and spoken sections without fabricated bars", () => {
  const samples = new Float32Array(16000)
  samples.fill(0.1, 8000)
  const peaks = audioPeaks(samples)
  assert.equal(peaks.length, 128)
  assert.ok(peaks.slice(0, 64).every((level) => level === 0))
  assert.ok(peaks.slice(64).every((level) => level > 0 && level <= 1))
  assert.ok(audioPeaks(new Float32Array()).every((level) => level === 0))
})

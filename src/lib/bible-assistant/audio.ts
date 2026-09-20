export const BIBLE_AUDIO_MAX_SECONDS = 90
export const BIBLE_AUDIO_SAMPLE_RATE = 16000
export const BIBLE_AUDIO_MAX_BYTES =
  44 + BIBLE_AUDIO_MAX_SECONDS * BIBLE_AUDIO_SAMPLE_RATE * 2

// A single, canonical PCM format makes the duration verifiable on the server.
export function encodeBibleAudio(samples: Float32Array): ArrayBuffer {
  const count = Math.min(
    samples.length,
    BIBLE_AUDIO_MAX_SECONDS * BIBLE_AUDIO_SAMPLE_RATE,
  )
  const buffer = new ArrayBuffer(44 + count * 2)
  const view = new DataView(buffer)
  const label = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++)
      view.setUint8(offset + i, value.charCodeAt(i))
  }
  label(0, "RIFF")
  view.setUint32(4, buffer.byteLength - 8, true)
  label(8, "WAVE")
  label(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, BIBLE_AUDIO_SAMPLE_RATE, true)
  view.setUint32(28, BIBLE_AUDIO_SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  label(36, "data")
  view.setUint32(40, count * 2, true)
  for (let i = 0; i < count; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(
      44 + i * 2,
      Math.round(sample * (sample < 0 ? 32768 : 32767)),
      true,
    )
  }
  return buffer
}

export function validateBibleAudio(bytes: Uint8Array): number | null {
  if (
    bytes.byteLength < 44 + BIBLE_AUDIO_SAMPLE_RATE ||
    bytes.byteLength > BIBLE_AUDIO_MAX_BYTES
  )
    return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const label = (offset: number, value: string) =>
    [...value].every(
      (char, index) => view.getUint8(offset + index) === char.charCodeAt(0),
    )
  const length = view.getUint32(40, true)
  if (
    !label(0, "RIFF") ||
    !label(8, "WAVE") ||
    !label(12, "fmt ") ||
    !label(36, "data") ||
    view.getUint32(4, true) !== bytes.byteLength - 8 ||
    view.getUint32(16, true) !== 16 ||
    view.getUint16(20, true) !== 1 ||
    view.getUint16(22, true) !== 1 ||
    view.getUint32(24, true) !== BIBLE_AUDIO_SAMPLE_RATE ||
    view.getUint32(28, true) !== BIBLE_AUDIO_SAMPLE_RATE * 2 ||
    view.getUint16(32, true) !== 2 ||
    view.getUint16(34, true) !== 16 ||
    length !== bytes.byteLength - 44 ||
    length % 2 !== 0
  )
    return null
  return length / (BIBLE_AUDIO_SAMPLE_RATE * 2)
}

import "server-only"
import { BIBLE_AUDIO_MAX_BYTES, validateBibleAudio } from "./audio"
import { validateAssistantRequest } from "./request"

export async function readAssistantAudioRequest(request: Request) {
  const maxBytes = BIBLE_AUDIO_MAX_BYTES + 65536
  const declaredLength = Number(request.headers.get("content-length"))
  if (declaredLength > maxBytes) return null
  const reader = request.body?.getReader()
  if (!reader) return null
  let length = 0
  const chunks: Uint8Array[] = []
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxBytes) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData()
    if (
      form.getAll("audio").length !== 1 ||
      form.getAll("history").length !== 1 ||
      [...form.keys()].some((key) => key !== "audio" && key !== "history")
    )
      return null
    const audio = form.get("audio")
    const history = form.get("history")
    if (
      !(audio instanceof Blob) ||
      audio.type !== "audio/wav" ||
      audio.size > BIBLE_AUDIO_MAX_BYTES ||
      typeof history !== "string" ||
      history.length > 60000
    )
      return null
    const input = validateAssistantRequest({
      question: "Question vocale",
      history: JSON.parse(history),
    })
    if (!input) return null
    const bytes = new Uint8Array(await audio.arrayBuffer())
    if (validateBibleAudio(bytes) === null) return null
    return { audio: bytes, history: input.history }
  } catch {
    return null
  } finally {
    reader.releaseLock()
  }
}

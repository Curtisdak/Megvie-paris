import { NextResponse } from "next/server"
import {
  answerBibleQuestion,
  BibleAssistantUnavailable,
  transcribeBibleAudio,
} from "@/lib/bible-assistant/gemini"
import { readAssistantAudioRequest } from "@/lib/bible-assistant/audio-request"
import { isAssistantSameOrigin } from "@/lib/bible-assistant/request"
import { limitBibleAssistant } from "@/lib/bible-assistant/rate-limit"

export const runtime = "nodejs"
export const maxDuration = 90
const headers = {
  "Cache-Control": "no-store, private",
  "X-Content-Type-Options": "nosniff",
}
const fail = (
  error: string,
  status: number,
  extra: Record<string, string> = {},
) => NextResponse.json({ error }, { status, headers: { ...headers, ...extra } })

export async function POST(request: Request) {
  if (!isAssistantSameOrigin(request))
    return fail("Requête non autorisée.", 403)
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
    return fail("Format audio invalide.", 415)
  const input = await readAssistantAudioRequest(request)
  if (!input)
    return fail(
      "Enregistrement invalide. Enregistrez entre une demi-seconde et 90 secondes, puis réessayez.",
      400,
    )
  if (!process.env.GEMINI_API_KEY?.trim())
    return fail("L'assistant vocal est momentanément indisponible.", 503)
  try {
    const limit = await limitBibleAssistant(request)
    if (!limit.allowed)
      return fail(
        "Trop de questions pour le moment. Réessayez un peu plus tard.",
        429,
        { "Retry-After": String(limit.retryAfter) },
      )
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(80000)])
    const question = await transcribeBibleAudio(input.audio, signal)
    if (!question)
      return fail(
        "Je n'ai pas compris l'enregistrement. Parlez plus près du microphone ou écrivez votre question.",
        422,
      )
    const answer = await answerBibleQuestion(question, input.history, signal)
    return NextResponse.json({ ...answer, question }, { headers })
  } catch (error) {
    const status =
      error instanceof BibleAssistantUnavailable ? error.status : 503
    return fail(
      status === 504
        ? "La réponse prend trop de temps. Votre enregistrement reste disponible pour réessayer."
        : "L'assistant vocal est momentanément indisponible. Réessayez ou écrivez votre question.",
      status,
    )
  }
}

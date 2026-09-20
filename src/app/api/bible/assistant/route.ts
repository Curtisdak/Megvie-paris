import { NextResponse } from "next/server"
import {
  answerBibleQuestion,
  BibleAssistantUnavailable,
} from "@/lib/bible-assistant/gemini"
import { limitBibleAssistant } from "@/lib/bible-assistant/rate-limit"
import {
  isAssistantSameOrigin,
  readAssistantRequest,
} from "@/lib/bible-assistant/request"

export const runtime = "nodejs"
export const maxDuration = 60

const responseHeaders = {
  "Cache-Control": "no-store, private",
  "X-Content-Type-Options": "nosniff",
}
function errorResponse(
  error: string,
  status: number,
  headers: Record<string, string> = {},
) {
  return NextResponse.json(
    { error },
    { status, headers: { ...responseHeaders, ...headers } },
  )
}

export async function POST(request: Request) {
  if (!isAssistantSameOrigin(request))
    return errorResponse("Requête non autorisée.", 403)
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return errorResponse("Format de requête invalide.", 415)
  const input = await readAssistantRequest(request)
  if (!input)
    return errorResponse("Saisissez une question de 3 à 500 caractères.", 400)
  if (!process.env.GEMINI_API_KEY?.trim())
    return errorResponse(
      "L'assistant est momentanément indisponible. La lecture et la recherche restent accessibles.",
      503,
    )
  try {
    const limit = await limitBibleAssistant(request)
    if (!limit.allowed)
      return errorResponse(
        "Trop de questions pour le moment. Réessayez un peu plus tard.",
        429,
        { "Retry-After": String(limit.retryAfter) },
      )
    const answer = await answerBibleQuestion(
      input.question,
      input.history,
      request.signal,
    )
    return NextResponse.json(answer, { headers: responseHeaders })
  } catch (error) {
    const status =
      error instanceof BibleAssistantUnavailable ? error.status : 503
    return errorResponse(
      status === 504
        ? "La réponse prend trop de temps. Réessayez dans un instant."
        : "L'assistant est momentanément indisponible. Réessayez plus tard ou utilisez la recherche biblique.",
      status,
    )
  }
}

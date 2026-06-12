import "server-only"

import type { NextRequest } from "next/server"

function getRequestToken(request: NextRequest) {
  const authorization = request.headers.get("authorization")

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim()
  }

  return (
    request.headers.get("x-cron-secret") ??
    request.headers.get("x-test-push-secret") ??
    request.nextUrl.searchParams.get("secret") ??
    ""
  ).trim()
}

export function validateRequestSecret(
  request: NextRequest,
  envNames: string[],
) {
  const configuredSecrets = envNames
    .map((name) => process.env[name]?.trim())
    .filter((secret): secret is string => Boolean(secret))

  if (configuredSecrets.length === 0) {
    return {
      ok: false,
      status: 500,
      error: `Secret de protection manquant (${envNames.join(" ou ")}).`,
    }
  }

  const token = getRequestToken(request)

  if (!token || !configuredSecrets.includes(token)) {
    return {
      ok: false,
      status: 401,
      error: "Requete non autorisee.",
    }
  }

  return { ok: true, status: 200, error: null }
}

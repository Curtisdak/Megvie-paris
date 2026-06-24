export type CreateDonationSessionInput = {
  amount: number
  categorySlug?: string
  frequency?: "ONE_TIME" | "MONTHLY"
  donorName?: string
  donorEmail?: string
}

export async function createDonationSession(
  input: number | CreateDonationSessionInput,
) {
  const payload =
    typeof input === "number"
      ? { amount: input, categorySlug: "autre", frequency: "ONE_TIME" }
      : input
  const response = await fetch("/api/donations/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => null)) as {
    url?: string
    error?: string
  } | null

  if (!response.ok) {
    throw new Error(data?.error ?? "Erreur cote serveur")
  }

  if (!data?.url) {
    throw new Error("URL de paiement introuvable")
  }

  return data.url as string
}

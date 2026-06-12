export async function createDonationSession(amount: number) {
  const response = await fetch("/api/donate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
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

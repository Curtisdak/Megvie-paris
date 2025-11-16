export async function createDonationSession(amount: number) {
  const response = await fetch("/api/donate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  })

  if (!response.ok) {
    throw new Error("Erreur cote serveur")
  }

  const data = (await response.json()) as { url?: string }

  if (!data?.url) {
    throw new Error("URL de paiement introuvable")
  }

  return data.url as string
}

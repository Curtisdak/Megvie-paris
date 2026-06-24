import { NextRequest, NextResponse } from "next/server"
import { createDonationCheckout } from "@/lib/finance/checkout"

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "La requete de don est invalide." },
      { status: 400 },
    )
  }

  try {
    const result = await createDonationCheckout(
      typeof body === "object" && body !== null ? body : {},
      request,
    )

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      )
    }

    return NextResponse.json({
      url: result.url,
      checkoutId: result.checkoutId,
      amountLabel: result.amountLabel,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de creer la session de paiement."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

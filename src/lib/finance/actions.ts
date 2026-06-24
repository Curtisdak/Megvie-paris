"use server"

import { revalidatePath } from "next/cache"
import { ChurchRole } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { requireFinancePermission } from "@/lib/finance/data"
import { getStripeClient } from "@/lib/stripe/server"
import { processStripeWebhookEvent } from "@/lib/finance/webhooks"

export type FinanceActionState = {
  ok: boolean
  message: string
}

function cleanText(value: FormDataEntryValue | null, maxLength = 240) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, maxLength)
    : ""
}

function hasCheckbox(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1"
}

export async function updateDonationCategoryAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const actor = await requireFinancePermission(
    "settings.manage",
    "/admin/finance",
  )

  if (actor.role !== ChurchRole.CREATOR) {
    return { ok: false, message: "Action reservee au Creator." }
  }

  const id = cleanText(formData.get("id"), 100)
  const label = cleanText(formData.get("label"), 100)
  const description = cleanText(formData.get("description"), 500) || null
  const sortOrder = Number(formData.get("sortOrder"))

  if (!id || label.length < 2 || !Number.isInteger(sortOrder)) {
    return { ok: false, message: "Categorie invalide." }
  }

  const category = await prisma.donationCategory.update({
    where: { id },
    data: {
      label,
      description,
      sortOrder,
      isActive: hasCheckbox(formData.get("isActive")),
    },
  })

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actor.id,
      actorMemberId: actor.profile?.memberId ?? null,
      action: "donation.category_updated",
      entityType: "donation_category",
      entityId: category.id,
      summary: category.label,
      metadata: {
        slug: category.slug,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
      },
    },
  })

  revalidatePath("/admin/finance")
  revalidatePath("/donate")
  return { ok: true, message: "Categorie mise a jour." }
}

export async function retryStripeWebhookEventAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const actor = await requireFinancePermission(
    "settings.manage",
    "/admin/webhooks-stripe",
  )

  if (actor.role !== ChurchRole.CREATOR) {
    return { ok: false, message: "Action reservee au Creator." }
  }

  const id = cleanText(formData.get("id"), 100)
  const record = id
    ? await prisma.stripeWebhookEvent.findUnique({ where: { id } })
    : null

  if (!record) return { ok: false, message: "Evenement introuvable." }

  try {
    const event = await getStripeClient().events.retrieve(record.stripeEventId)
    await processStripeWebhookEvent(event)
    await prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        actorMemberId: actor.profile?.memberId ?? null,
        action: "stripe.webhook_retry_requested",
        entityType: "stripe_webhook_event",
        entityId: record.id,
        summary: record.eventType,
        metadata: { stripeEventId: record.stripeEventId },
      },
    })
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de relancer ce webhook.",
    }
  }

  revalidatePath("/admin/webhooks-stripe")
  return { ok: true, message: "Webhook relance." }
}

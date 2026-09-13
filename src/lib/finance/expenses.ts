"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireFinancePermission } from "@/lib/finance/data"
import { validateExpense } from "@/lib/finance/expense-validation"
import type { FinanceActionState } from "@/lib/finance/actions"

function refreshFinance() {
  revalidatePath("/admin/depenses")
  revalidatePath("/admin/finance")
  revalidatePath("/admin")
}

export async function saveExpenseAction(
  _previous: FinanceActionState,
  form: FormData,
): Promise<FinanceActionState> {
  const actor = await requireFinancePermission(
    "expenses.manage",
    "/admin/depenses",
  )
  let input: ReturnType<typeof validateExpense>
  try {
    input = validateExpense(form)
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Dépense invalide.",
    }
  }
  const id = String(form.get("id") ?? "").slice(0, 100)
  const entryRequestId = String(form.get("entryRequestId") ?? "")
  const version = Number(form.get("version"))
  if (!id && !/^[a-f0-9-]{36}$/i.test(entryRequestId))
    return { ok: false, message: "Fermez puis rouvrez le formulaire." }
  if (id && (!Number.isInteger(version) || version < 1))
    return { ok: false, message: "Version invalide. Rechargez la page." }

  const saved = await prisma.$transaction(async (tx) => {
    const previous = id
      ? await tx.financeExpense.findUnique({ where: { id } })
      : null
    if (id && (!previous || previous.status !== "RECORDED")) return false
    let expenseId = id
    if (id) {
      const result = await tx.financeExpense.updateMany({
        where: { id, version, status: "RECORDED" },
        data: { ...input, version: { increment: 1 } },
      })
      if (result.count !== 1) return false
    } else {
      // The unique request key makes browser retries safe without duplicating expenses.
      const created = await tx.financeExpense.createManyAndReturn({
        data: { ...input, entryRequestId, createdByUserId: actor.id },
        skipDuplicates: true,
        select: { id: true },
      })
      if (!created.length) return true
      expenseId = created[0].id
    }
    await tx.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        actorMemberId: actor.profile?.memberId,
        action: id ? "expense.updated" : "expense.recorded",
        entityType: "finance_expense",
        entityId: expenseId,
        summary: input.title,
        metadata: {
          before: previous
            ? {
                title: previous.title,
                amountCents: previous.amountCents,
                category: previous.category,
                occurredAt: previous.occurredAt.toISOString(),
                payee: previous.payee,
                reference: previous.reference,
                note: previous.note,
              }
            : null,
          after: { ...input, occurredAt: input.occurredAt.toISOString() },
        },
      },
    })
    return true
  })
  if (!saved)
    return {
      ok: false,
      message: "Cette dépense a été modifiée ou annulée. Rechargez la page.",
    }
  refreshFinance()
  return {
    ok: true,
    message: id
      ? "Dépense modifiée. Solde recalculé."
      : "Dépense enregistrée. Solde recalculé.",
  }
}

export async function cancelExpenseAction(
  _previous: FinanceActionState,
  form: FormData,
): Promise<FinanceActionState> {
  const actor = await requireFinancePermission(
    "expenses.manage",
    "/admin/depenses",
  )
  const id = String(form.get("id") ?? "").slice(0, 100)
  const reason = String(form.get("reason") ?? "")
    .trim()
    .slice(0, 500)
  const version = Number(form.get("version"))
  if (!id || reason.length < 5 || !Number.isInteger(version) || version < 1) {
    return {
      ok: false,
      message: "Indiquez un motif d'au moins cinq caractères.",
    }
  }
  const cancelled = await prisma.$transaction(async (tx) => {
    const result = await tx.financeExpense.updateMany({
      where: { id, version, status: "RECORDED" },
      data: {
        status: "CANCELLED",
        cancellationReason: reason,
        cancelledAt: new Date(),
        version: { increment: 1 },
      },
    })
    if (result.count !== 1) return false
    await tx.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        actorMemberId: actor.profile?.memberId,
        action: "expense.cancelled",
        entityType: "finance_expense",
        entityId: id,
        summary: reason,
      },
    })
    return true
  })
  if (!cancelled)
    return {
      ok: false,
      message: "Cette dépense a déjà changé. Rechargez la page.",
    }
  refreshFinance()
  return { ok: true, message: "Dépense annulée et retirée du calcul du solde." }
}

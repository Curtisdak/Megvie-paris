"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, Plus, Save, Ban } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { expenseCategories } from "@/lib/finance/expense-validation"
import { cancelExpenseAction, saveExpenseAction } from "@/lib/finance/expenses"

export type ExpenseDialogValue = {
  id: string
  title: string
  category: string
  amountCents: number
  occurredAt: string
  payee: string | null
  reference: string | null
  note: string | null
  version: number
}

export function ExpenseDialog({
  expense,
  cancel = false,
}: {
  expense?: ExpenseDialogValue
  cancel?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={expense ? "outline" : "default"}
          size={expense ? "icon" : "default"}
          className={expense ? "size-11 rounded-lg" : "min-h-11 rounded-lg"}
          title={
            expense
              ? cancel
                ? "Annuler la dépense"
                : "Modifier la dépense"
              : undefined
          }
          aria-label={
            expense
              ? cancel
                ? "Annuler la dépense"
                : "Modifier la dépense"
              : undefined
          }
        >
          {expense ? (
            cancel ? (
              <Ban className="size-4" />
            ) : (
              <Pencil className="size-4" />
            )
          ) : (
            <>
              <Plus className="size-4" />
              Ajouter une dépense
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {cancel
              ? "Annuler cette dépense ?"
              : expense
                ? "Modifier la dépense"
                : "Nouvelle dépense"}
          </DialogTitle>
          <DialogDescription>
            {cancel
              ? "Elle restera dans l'historique mais ne sera plus déduite du solde."
              : "Enregistrez un paiement effectué. Le solde est recalculé automatiquement."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ExpenseForm
            expense={expense}
            cancel={cancel}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ExpenseForm({
  expense,
  cancel,
  onClose,
}: {
  expense?: ExpenseDialogValue
  cancel: boolean
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(
    cancel ? cancelExpenseAction : saveExpenseAction,
    { ok: false, message: "" },
  )
  const [requestId] = useState(() => crypto.randomUUID())
  const prefix = useId()
  const router = useRouter()
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message)
      onClose()
      router.refresh()
    }
  }, [state, onClose, router])
  const field = "grid gap-1.5 text-sm font-medium"
  return (
    <form action={action} aria-busy={pending}>
      <input type="hidden" name="id" value={expense?.id ?? ""} />
      <input type="hidden" name="version" value={expense?.version ?? 1} />
      <input type="hidden" name="entryRequestId" value={requestId} />
      <fieldset disabled={pending} className="space-y-4">
        {cancel ? (
          <label className={field}>
            Motif de l&apos;annulation
            <Textarea
              name="reason"
              required
              minLength={5}
              maxLength={500}
              placeholder="Ex. doublon de saisie"
              autoFocus
            />
          </label>
        ) : (
          <>
            <label className={field}>
              Libellé
              <Input
                name="title"
                required
                minLength={2}
                maxLength={160}
                defaultValue={expense?.title}
                placeholder="Ex. location de la salle"
                autoFocus
                className="h-11"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={field}>
                Montant (EUR)
                <Input
                  name="amount"
                  inputMode="decimal"
                  required
                  defaultValue={
                    expense ? (expense.amountCents / 100).toFixed(2) : ""
                  }
                  placeholder="0,00"
                  className="h-11 text-base"
                />
              </label>
              <label className={field}>
                Date du paiement
                <Input
                  name="occurredAt"
                  type="date"
                  required
                  min="1900-01-01"
                  max={new Intl.DateTimeFormat("sv-SE", {
                    timeZone: "Europe/Paris",
                  }).format(new Date())}
                  defaultValue={
                    expense?.occurredAt ??
                    new Intl.DateTimeFormat("sv-SE", {
                      timeZone: "Europe/Paris",
                    }).format(new Date())
                  }
                  className="h-11"
                />
              </label>
            </div>
            <label className={field}>
              Catégorie
              <select
                name="category"
                required
                defaultValue={expense?.category ?? "PREMISES"}
                className="h-11 min-w-0 rounded-lg border border-input bg-background px-3 text-sm"
              >
                {Object.entries(expenseCategories).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className={field}>
              Bénéficiaire <span className="sr-only">facultatif</span>
              <Input
                name="payee"
                maxLength={160}
                defaultValue={expense?.payee ?? ""}
                placeholder="Facultatif"
                className="h-11"
              />
            </label>
            <details
              open={Boolean(expense?.reference || expense?.note)}
              className="border-t pt-3"
            >
              <summary className="cursor-pointer py-1 text-sm font-medium">
                Référence et notes
              </summary>
              <div className="mt-3 space-y-3">
                <label className={field}>
                  Référence du justificatif
                  <Input
                    name="reference"
                    maxLength={160}
                    defaultValue={expense?.reference ?? ""}
                    placeholder="Facture, ticket..."
                  />
                </label>
                <label className={field}>
                  Notes
                  <Textarea
                    name="note"
                    maxLength={2000}
                    defaultValue={expense?.note ?? ""}
                  />
                </label>
              </div>
            </details>
          </>
        )}
        {state.message && !state.ok && (
          <p
            id={`${prefix}-error`}
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
          >
            {state.message}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-h-11"
          >
            Fermer
          </Button>
          <Button
            type="submit"
            variant={cancel ? "destructive" : "default"}
            className="min-h-11"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : cancel ? (
              <Ban className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            {pending
              ? "Enregistrement..."
              : cancel
                ? "Confirmer l'annulation"
                : "Enregistrer"}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

"use client"

import { useActionState, useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteDirectDonationAction } from "@/lib/finance/direct"

type Donation = {
  id: string
  label: string
  amountCents: number
  currency: string
}

export function DeleteDirectDonationDialog({
  donation,
  redirectOnSuccess = false,
  showLabel = false,
}: {
  donation: Donation
  redirectOnSuccess?: boolean
  showLabel?: boolean
}) {
  const [open, setOpen] = useState(false)
  const busy = useRef(false)
  const setBusy = useCallback((value: boolean) => {
    busy.current = value
  }, [])
  const close = useCallback(() => {
    if (!busy.current) setOpen(false)
  }, [])
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy.current) setOpen(value)
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={showLabel ? "default" : "icon"}
          className="min-h-11 shrink-0 rounded-lg border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
          title="Supprimer le don direct"
          aria-label={`Supprimer le don de ${donation.label}`}
        >
          <Trash2 className="size-4" aria-hidden />
          {showLabel && "Supprimer le don"}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-md"
        onEscapeKeyDown={(event) => {
          if (busy.current) event.preventDefault()
        }}
        onPointerDownOutside={(event) => {
          if (busy.current) event.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Supprimer ce don direct ?</DialogTitle>
          <DialogDescription>
            Le don sera retiré du registre et des statistiques. Cette
            suppression est définitive ; une trace restera dans le journal
            d&apos;audit.
          </DialogDescription>
        </DialogHeader>
        <div className="border-y border-border py-3">
          <p className="break-words text-sm font-medium">{donation.label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: donation.currency.toUpperCase(),
            }).format(donation.amountCents / 100)}
          </p>
        </div>
        {open && (
          <DeleteForm
            donation={donation}
            redirectOnSuccess={redirectOnSuccess}
            onBusy={setBusy}
            onClose={close}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function DeleteForm({
  donation,
  redirectOnSuccess,
  onBusy,
  onClose,
}: {
  donation: Donation
  redirectOnSuccess: boolean
  onBusy: (busy: boolean) => void
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(deleteDirectDonationAction, {
    ok: false,
    message: "",
  })
  const router = useRouter()
  useEffect(() => {
    onBusy(pending)
    return () => onBusy(false)
  }, [pending, onBusy])
  useEffect(() => {
    if (!state.ok) return
    toast.success(state.message)
    onClose()
    if (redirectOnSuccess) router.replace("/admin/dons/directs")
    router.refresh()
  }, [state, onClose, redirectOnSuccess, router])
  return (
    <form
      action={action}
      onSubmit={() => onBusy(true)}
      aria-busy={pending}
      className="space-y-4"
    >
      <input type="hidden" name="id" value={donation.id} />
      <fieldset disabled={pending} className="space-y-4">
        <label className="grid gap-2 text-sm font-medium">
          Motif de suppression
          <Textarea
            name="reason"
            required
            minLength={4}
            maxLength={500}
            placeholder="Ex. doublon ou erreur de saisie"
            className="min-h-24 text-base"
            autoFocus
          />
        </label>
        {!state.ok && state.message && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {state.message}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-h-11"
          >
            Conserver
          </Button>
          <Button type="submit" variant="destructive" className="min-h-11">
            {pending ? (
              <Loader2
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            ) : (
              <Trash2 className="size-4" aria-hidden />
            )}
            {pending ? "Suppression…" : "Supprimer définitivement"}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

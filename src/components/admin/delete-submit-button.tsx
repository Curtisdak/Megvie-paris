"use client"

import { useRef } from "react"
import { AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function DeleteSubmitButton({
  label = "Supprimer",
  confirmMessage,
  disabled = false,
}: {
  label?: string
  confirmMessage: string
  disabled?: boolean
}) {
  const formRef = useRef<HTMLFormElement | null>(null)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="w-full rounded-lg border border-red-200 bg-red-50 text-red-700 shadow-none hover:bg-red-100 hover:text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
          disabled={disabled}
          onClick={(event) => {
            formRef.current = event.currentTarget.form
          }}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%_-_1.5rem)] overflow-hidden rounded-2xl p-0 sm:max-w-md">
        <DialogHeader className="border-b border-red-100 bg-gradient-to-r from-red-50 via-white to-orange-50 px-5 py-5 text-left dark:border-red-500/15 dark:from-red-500/10 dark:via-zinc-950 dark:to-orange-500/10">
          <span className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription className="leading-6">
            {confirmMessage}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-5">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Cette action peut retirer définitivement cet élément de l&apos;administration.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-xl shadow-none">
                Annuler
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl shadow-none"
                onClick={() => formRef.current?.requestSubmit()}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Supprimer
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

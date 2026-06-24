"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DeleteSubmitButton({
  label = "Supprimer",
  confirmMessage,
  disabled = false,
}: {
  label?: string
  confirmMessage: string
  disabled?: boolean
}) {
  return (
    <Button
      type="submit"
      variant="ghost"
      className="w-full rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
      disabled={disabled}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault()
        }
      }}
    >
      <Trash2 className="h-4 w-4" aria-hidden />
      {label}
    </Button>
  )
}

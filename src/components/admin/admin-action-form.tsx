"use client"

import { useActionState, useEffect, useRef, type ReactNode } from "react"
import { toast } from "sonner"
import type { AdminActionState } from "@/lib/admin/validation"

type AdminAction = (
  state: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>

const initialState: AdminActionState = {
  ok: false,
  message: "",
}

export function AdminActionForm({
  action,
  children,
  className,
  onSuccess,
  resetOnSuccess = false,
}: {
  action: AdminAction
  children: ReactNode
  className?: string
  onSuccess?: () => void
  resetOnSuccess?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state.message) return
    if (state.ok) {
      toast.success(state.message)
      if (resetOnSuccess) formRef.current?.reset()
      onSuccess?.()
    } else {
      toast.error(state.message)
    }
  }, [onSuccess, resetOnSuccess, state])

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className}
      aria-busy={pending}
      encType="multipart/form-data"
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  )
}

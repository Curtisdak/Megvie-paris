"use client"

import { useCallback, useState, type ReactNode } from "react"
import { Plus, Send } from "lucide-react"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { ImageDropzone } from "@/components/admin/image-dropzone"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { saveAnnouncementAction } from "@/lib/admin/actions"

const selectClass =
  "h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-zinc-800 dark:bg-zinc-950"

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"

const categoryOptions = [
  ["GENERAL", "General"],
  ["EMPLOI", "Emploi"],
  ["MARIAGE", "Mariage"],
  ["BAPTEME", "Bapteme"],
  ["EVENEMENT", "Evenement"],
  ["BON_PLAN", "Bon plan"],
  ["URGENT", "Urgent"],
] as const

const visibilityOptions = [
  ["PUBLIC", "Public"],
  ["MEMBERS_ONLY", "Membres seulement"],
] as const

const statusOptions = [
  ["DRAFT", "Brouillon"],
  ["SCHEDULED", "Programme"],
  ["PUBLISHED", "Publie"],
] as const

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function AnnouncementFormDialog() {
  const [open, setOpen] = useState(false)
  const closeDialog = useCallback(() => setOpen(false), [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full px-5">
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter annonce
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/70 sm:px-6">
          <DialogTitle className="text-2xl">Ajouter une annonce</DialogTitle>
          <DialogDescription>
            Redigez le message, choisissez l&apos;audience et ajoutez une image si
            necessaire.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto">
          <AdminActionForm
            action={saveAnnouncementAction}
            className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr),340px]"
            onSuccess={closeDialog}
            resetOnSuccess
          >
            <div className="space-y-4">
              <Field id="announcement-title" label="Titre">
                <Input
                  id="announcement-title"
                  name="title"
                  placeholder="Ex: Reunion des responsables samedi"
                  className="h-11 rounded-xl"
                  required
                />
              </Field>
              <Field id="announcement-summary" label="Resume court">
                <Input
                  id="announcement-summary"
                  name="summary"
                  placeholder="Une phrase courte pour la liste des annonces"
                  className="h-11 rounded-xl"
                />
              </Field>
              <Field id="announcement-body" label="Message">
                <Textarea
                  id="announcement-body"
                  name="body"
                  placeholder="Details pratiques, contexte, personnes concernees..."
                  rows={11}
                  className="min-h-64 rounded-xl"
                  required
                />
              </Field>
            </div>

            <aside className="space-y-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/70 sm:p-4">
              <div className="grid gap-3">
                <Field id="announcement-category" label="Categorie">
                  <select
                    id="announcement-category"
                    name="category"
                    defaultValue="GENERAL"
                    className={selectClass}
                  >
                    {categoryOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="announcement-visibility" label="Audience">
                  <select
                    id="announcement-visibility"
                    name="visibility"
                    defaultValue="MEMBERS_ONLY"
                    className={selectClass}
                  >
                    {visibilityOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="announcement-status" label="Statut">
                  <select
                    id="announcement-status"
                    name="status"
                    defaultValue="DRAFT"
                    className={selectClass}
                  >
                    {statusOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <Field id="announcement-publish-at" label="Programmer">
                  <Input
                    id="announcement-publish-at"
                    name="publishAt"
                    type="datetime-local"
                    className="h-10 rounded-xl bg-white dark:bg-zinc-950"
                  />
                </Field>
                <Field id="announcement-expires-at" label="Expiration">
                  <Input
                    id="announcement-expires-at"
                    name="expiresAt"
                    type="datetime-local"
                    className="h-10 rounded-xl bg-white dark:bg-zinc-950"
                  />
                </Field>
                <Field id="announcement-external-url" label="Lien externe">
                  <Input
                    id="announcement-external-url"
                    name="externalUrl"
                    type="url"
                    placeholder="https://..."
                    className="h-10 rounded-xl bg-white dark:bg-zinc-950"
                  />
                </Field>
              </div>

              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <ImageDropzone
                  name="coverImageFile"
                  label="Image"
                  description="Deposez l'image ici"
                />
              </div>

              <Button className="h-11 w-full rounded-full">
                <Send className="h-4 w-4" aria-hidden />
                Enregistrer
              </Button>
            </aside>
          </AdminActionForm>
        </div>
      </DialogContent>
    </Dialog>
  )
}

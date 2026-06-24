"use client"

import { useCallback, useState, type ReactNode } from "react"
import { CalendarPlus, Save } from "lucide-react"
import { AdminActionForm } from "@/components/admin/admin-action-form"
import { ImageDropzone } from "@/components/admin/image-dropzone"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { saveEventAction } from "@/lib/admin/actions"

const selectClass =
  "h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-zinc-800 dark:bg-zinc-950"

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"

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

export function EventFormDialog() {
  const [open, setOpen] = useState(false)
  const closeDialog = useCallback(() => setOpen(false), [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full px-5">
          <CalendarPlus className="h-4 w-4" aria-hidden />
          Ajouter evenement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/70 sm:px-6">
          <DialogTitle className="text-2xl">Ajouter un evenement</DialogTitle>
          <DialogDescription>
            Renseignez les informations essentielles. Vous pourrez toujours
            modifier l&apos;evenement apres creation.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto">
          <AdminActionForm
            action={saveEventAction}
            className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr),340px]"
            onSuccess={closeDialog}
            resetOnSuccess
          >
            <input type="hidden" name="stayOnPage" value="true" />
            <input type="hidden" name="timezone" value="Europe/Paris" />

            <div className="space-y-4">
              <Field id="event-title" label="Titre">
                <Input
                  id="event-title"
                  name="title"
                  placeholder="Ex: Culte special famille"
                  className="h-11 rounded-xl"
                  required
                />
              </Field>
              <Field id="event-short-description" label="Resume court">
                <Input
                  id="event-short-description"
                  name="shortDescription"
                  placeholder="Une phrase pour presenter l'evenement"
                  className="h-11 rounded-xl"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="event-starts-at" label="Debut">
                  <Input
                    id="event-starts-at"
                    name="startsAt"
                    type="datetime-local"
                    className="h-11 rounded-xl"
                    required
                  />
                </Field>
                <Field id="event-ends-at" label="Fin">
                  <Input
                    id="event-ends-at"
                    name="endsAt"
                    type="datetime-local"
                    className="h-11 rounded-xl"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="event-location" label="Lieu">
                  <Input
                    id="event-location"
                    name="locationName"
                    placeholder="MegVie Paris"
                    className="h-11 rounded-xl"
                  />
                </Field>
                <Field id="event-address" label="Adresse">
                  <Input
                    id="event-address"
                    name="address"
                    placeholder="Adresse complete"
                    className="h-11 rounded-xl"
                  />
                </Field>
              </div>
              <Field id="event-description" label="Description">
                <Textarea
                  id="event-description"
                  name="description"
                  placeholder="Programme, infos pratiques, inscription..."
                  rows={9}
                  className="min-h-56 rounded-xl"
                />
              </Field>
            </div>

            <aside className="space-y-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/70 sm:p-4">
              <div className="grid gap-3">
                <Field id="event-status" label="Statut">
                  <select
                    id="event-status"
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
                <Field id="event-publish-at" label="Publication programmee">
                  <Input
                    id="event-publish-at"
                    name="publishAt"
                    type="datetime-local"
                    className="h-10 rounded-xl bg-white dark:bg-zinc-950"
                  />
                </Field>
              </div>

              <div className="grid gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <Field id="event-map-url" label="Google Maps">
                  <Input
                    id="event-map-url"
                    name="mapUrl"
                    type="url"
                    placeholder="https://..."
                    className="h-10 rounded-xl bg-white dark:bg-zinc-950"
                  />
                </Field>
                <Field id="event-registration-url" label="Lien d'inscription">
                  <Input
                    id="event-registration-url"
                    name="registrationUrl"
                    type="url"
                    placeholder="https://..."
                    className="h-10 rounded-xl bg-white dark:bg-zinc-950"
                  />
                </Field>
              </div>

              <div className="grid gap-3 rounded-2xl border border-amber-100 bg-amber-50/80 p-3 text-sm dark:border-amber-400/20 dark:bg-amber-400/10">
                <label className="flex items-start gap-3">
                  <Checkbox name="notifyEventPush" className="mt-1" />
                  <span>
                    <span className="block font-semibold">
                      Notifier a la publication
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      Cree une notification dedoublonnee pour les membres.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox name="notifyEventReminder" className="mt-1" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      Ajouter un rappel
                    </span>
                    <select
                      name="reminderPreset"
                      defaultValue="24_HOURS"
                      className={`${selectClass} mt-2 w-full`}
                    >
                      <option value="7_DAYS">7 jours avant</option>
                      <option value="24_HOURS">24 heures avant</option>
                      <option value="2_HOURS">2 heures avant</option>
                      <option value="CUSTOM">Date personnalisee</option>
                    </select>
                    <Input
                      name="reminderAt"
                      type="datetime-local"
                      className="mt-2 h-10 rounded-xl bg-white dark:bg-zinc-950"
                    />
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox name="notifyCancellation" className="mt-1" />
                  <span>
                    <span className="block font-semibold">
                      Notifier si annule
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      Utilise seulement lorsque le statut est Annule.
                    </span>
                  </span>
                </label>
              </div>

              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <ImageDropzone
                  name="coverImageFile"
                  label="Image"
                  description="Deposez l'image ici"
                />
              </div>

              <Button className="h-11 w-full rounded-full">
                <Save className="h-4 w-4" aria-hidden />
                Enregistrer
              </Button>
            </aside>
          </AdminActionForm>
        </div>
      </DialogContent>
    </Dialog>
  )
}

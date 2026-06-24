import { AdminActionForm } from "@/components/admin/admin-action-form"
import { AdminCard } from "@/components/admin/admin-card"
import { ImageDropzone } from "@/components/admin/image-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { saveEventAction } from "@/lib/admin/actions"

type EventFormData = {
  id?: string
  title?: string | null
  shortDescription?: string | null
  description?: string | null
  startsAt?: Date | null
  endsAt?: Date | null
  timezone?: string | null
  locationName?: string | null
  address?: string | null
  mapUrl?: string | null
  registrationUrl?: string | null
  coverImageUrl?: string | null
  coverImageStorageKey?: string | null
  visibility?: string
  status?: string
  publishAt?: Date | null
}

function dateTimeValue(value?: Date | null) {
  if (!value) return ""
  return value.toISOString().slice(0, 16)
}

export function EventForm({ event }: { event?: EventFormData | null }) {
  return (
    <AdminCard>
      <AdminActionForm action={saveEventAction} className="space-y-5">
        {event?.id ? <input type="hidden" name="id" value={event.id} /> : null}
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Titre</span>
            <Input name="title" required defaultValue={event?.title ?? ""} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Resume court</span>
            <Input
              name="shortDescription"
              defaultValue={event?.shortDescription ?? ""}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Debut</span>
            <Input
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={dateTimeValue(event?.startsAt)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Fin</span>
            <Input
              name="endsAt"
              type="datetime-local"
              defaultValue={dateTimeValue(event?.endsAt)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Lieu</span>
            <Input name="locationName" defaultValue={event?.locationName ?? ""} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Adresse</span>
            <Input name="address" defaultValue={event?.address ?? ""} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Google Maps</span>
            <Input name="mapUrl" type="url" defaultValue={event?.mapUrl ?? ""} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Lien d&apos;inscription</span>
            <Input
              name="registrationUrl"
              type="url"
              defaultValue={event?.registrationUrl ?? ""}
            />
          </label>
          <div className="space-y-2 lg:col-span-2">
            {event?.coverImageUrl ? (
              <>
                <input
                  type="hidden"
                  name="coverImageUrl"
                  value={event.coverImageUrl}
                />
                <input
                  type="hidden"
                  name="coverImageStorageKey"
                  value={event.coverImageStorageKey ?? ""}
                />
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <div
                    className="h-36 bg-cover bg-center"
                    style={{ backgroundImage: `url("${event.coverImageUrl}")` }}
                    aria-hidden
                  />
                  <p className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                    Image actuelle. Choisissez une nouvelle image pour la
                    remplacer.
                  </p>
                </div>
              </>
            ) : null}
            <ImageDropzone
              name="coverImageFile"
              label="Image de couverture"
              description="Deposez l'image de l'evenement ici"
            />
          </div>
          <label className="space-y-2">
            <span className="text-sm font-medium">Visibilite</span>
            <select
              name="visibility"
              defaultValue={event?.visibility ?? "PUBLIC"}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="PUBLIC">Public</option>
              <option value="MEMBERS_ONLY">Membres seulement</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Statut</span>
            <select
              name="status"
              defaultValue={event?.status ?? "DRAFT"}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="DRAFT">Brouillon</option>
              <option value="SCHEDULED">Programme</option>
              <option value="PUBLISHED">Publie</option>
              <option value="CANCELLED">Annule</option>
              <option value="ARCHIVED">Archive</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Publication programmee</span>
            <Input
              name="publishAt"
              type="datetime-local"
              defaultValue={dateTimeValue(event?.publishAt)}
            />
          </label>
          <input type="hidden" name="timezone" value={event?.timezone ?? "Europe/Paris"} />
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Description</span>
          <Textarea
            name="description"
            rows={8}
            defaultValue={event?.description ?? ""}
          />
        </label>
        <Button className="rounded-full">Enregistrer l&apos;evenement</Button>
      </AdminActionForm>
    </AdminCard>
  )
}

import { AdminActionForm } from "@/components/admin/admin-action-form"
import { AdminCard, EmptyState } from "@/components/admin/admin-card"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  addGalleryItemAction,
  saveGalleryAlbumAction,
  updateGalleryAlbumStatusAction,
} from "@/lib/admin/actions"
import { listGalleryAlbums } from "@/lib/admin/data"

export default async function GalleryPage() {
  const albums = await listGalleryAlbums()

  return (
    <div className="space-y-5">
      <AdminCard>
        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-200">
              Galerie
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Albums photos</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Les nouvelles images sont envoyees vers ImageKit, puis seules les
              URL et metadonnees sont conservees dans Neon.
            </p>
          </div>
          <AdminActionForm action={saveGalleryAlbumAction} className="grid gap-3">
            <Input name="title" placeholder="Titre de l&apos;album" required />
            <Textarea name="description" placeholder="Description" />
            <Input
              name="coverImageFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            />
            <Input
              name="coverImageUrl"
              type="url"
              placeholder="URL ImageKit existante optionnelle"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="eventDate" type="date" />
              <select
                name="status"
                defaultValue="DRAFT"
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publie</option>
                <option value="ARCHIVED">Archive</option>
              </select>
            </div>
            <Button className="rounded-full">Creer l&apos;album</Button>
          </AdminActionForm>
        </div>
      </AdminCard>

      {albums.length === 0 ? (
        <EmptyState
          title="Aucun album"
          description="Creez un album puis ajoutez des photos via URL."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {albums.map((album) => (
            <AdminCard key={album.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{album.title}</h3>
                    <StatusBadge value={album.status} />
                  </div>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {album._count.items} photo(s)
                    {album.eventDate
                      ? ` - ${album.eventDate.toLocaleDateString("fr-FR")}`
                      : ""}
                  </p>
                </div>
                <AdminActionForm action={updateGalleryAlbumStatusAction} className="flex gap-2">
                  <input type="hidden" name="albumId" value={album.id} />
                  <select
                    name="status"
                    defaultValue={album.status}
                    className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="PUBLISHED">Publie</option>
                    <option value="ARCHIVED">Archive</option>
                  </select>
                  <Button size="sm" variant="outline">OK</Button>
                </AdminActionForm>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {album.items.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.altText ?? item.caption ?? album.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <AdminActionForm action={addGalleryItemAction} className="mt-4 grid gap-2">
                <input type="hidden" name="albumId" value={album.id} />
                <Input
                  name="imageFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                />
                <Input
                  name="imageUrl"
                  type="url"
                  placeholder="URL ImageKit existante optionnelle"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input name="caption" placeholder="Legende" />
                  <Input name="altText" placeholder="Texte alternatif" />
                </div>
                <Input name="storageKey" placeholder="Cle ImageKit existante optionnelle" />
                <Button variant="outline" className="rounded-full">Ajouter la photo</Button>
              </AdminActionForm>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
import { ImagePlus, Trash2, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"])

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function ImageDropzone({
  name,
  label = "Image",
  description = "Glissez-deposez une image ou choisissez un fichier.",
  accept = "image/jpeg,image/png,image/webp",
  maxSizeMb = 5,
  className,
}: {
  name: string
  label?: string
  description?: string
  accept?: string
  maxSizeMb?: number
  className?: string
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    const form = inputRef.current?.form
    if (!form) return

    function handleReset() {
      setFileName("")
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return ""
      })
      setError("")
    }

    form.addEventListener("reset", handleReset)
    return () => form.removeEventListener("reset", handleReset)
  }, [])

  function clearFile() {
    if (inputRef.current) inputRef.current.value = ""
    setFileName("")
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return ""
    })
    setError("")
  }

  function applyFile(file: File | undefined) {
    if (!file) return

    if (!supportedImageTypes.has(file.type.toLowerCase())) {
      clearFile()
      setError("Format non supporte. Utilisez JPG, PNG ou WebP.")
      return
    }

    const maxBytes = maxSizeMb * 1024 * 1024
    if (file.size > maxBytes) {
      clearFile()
      setError(`Image trop lourde. Limite: ${maxSizeMb} Mo.`)
      return
    }

    if (inputRef.current && typeof DataTransfer !== "undefined") {
      const transfer = new DataTransfer()
      transfer.items.add(file)
      inputRef.current.files = transfer.files
    }

    setError("")
    setFileName(`${file.name} - ${formatBytes(file.size)}`)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    applyFile(event.target.files?.[0])
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    applyFile(event.dataTransfer.files[0])
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
        >
          {label}
        </label>
        <span className="text-xs text-zinc-400">JPG, PNG, WebP</span>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={onInputChange}
      />
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-white p-3 shadow-sm transition dark:border-zinc-700 dark:bg-zinc-950",
          dragging &&
            "border-orange-500 bg-orange-50 ring-4 ring-orange-500/10 dark:bg-orange-500/10",
        )}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragging(false)
        }}
        onDrop={onDrop}
      >
        {previewUrl ? (
          <div className="grid gap-3 sm:grid-cols-[120px,minmax(0,1fr)]">
            <div
              className="aspect-[4/3] rounded-xl bg-cover bg-center ring-1 ring-zinc-200 dark:ring-zinc-800"
              style={{ backgroundImage: `url("${previewUrl}")` }}
              aria-hidden
            />
            <div className="flex min-w-0 flex-col justify-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                  {fileName}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  L&apos;image sera envoyee vers ImageKit lors de l&apos;enregistrement.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-full"
                  onClick={() => inputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" aria-hidden />
                  Remplacer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-full text-zinc-500"
                  onClick={clearFile}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Retirer
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_42%),linear-gradient(135deg,#fafafa,#f4f4f5)] px-4 py-6 text-center transition group-hover:scale-[0.99] dark:bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_42%),linear-gradient(135deg,#09090b,#18181b)]"
            onClick={() => inputRef.current?.click()}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-lg shadow-zinc-950/15 dark:bg-white dark:text-zinc-950">
              <UploadCloud className="h-5 w-5" aria-hidden />
            </span>
            <span className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
              {description}
            </span>
            <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Taille maximale: {maxSizeMb} Mo
            </span>
          </button>
        )}
      </div>
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  )
}

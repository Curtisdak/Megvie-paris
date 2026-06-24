import "server-only"

import { randomUUID } from "crypto"

const uploadEndpoint = "https://upload.imagekit.io/api/v1/files/upload"
const allowedMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
])

export type UploadedImage = {
  url: string
  storageKey: string
  fileId: string
  name: string
  thumbnailUrl: string | null
}

function configuredProvider() {
  return process.env.IMAGE_STORAGE_PROVIDER?.trim().toLowerCase() || "none"
}

function maxImageBytes() {
  const parsed = Number(process.env.IMAGE_STORAGE_MAX_BYTES)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5 * 1024 * 1024
}

function imageKitConfig() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim()
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim()
  const uploadFolder =
    process.env.IMAGEKIT_UPLOAD_FOLDER?.trim() || "/megvie-paris"

  if (configuredProvider() !== "imagekit") {
    throw new Error(
      "ImageKit n'est pas active. Configurez IMAGE_STORAGE_PROVIDER=imagekit.",
    )
  }

  if (!privateKey || !urlEndpoint) {
    throw new Error(
      "ImageKit est incomplet. Ajoutez IMAGEKIT_PRIVATE_KEY et IMAGEKIT_URL_ENDPOINT.",
    )
  }

  return { privateKey, urlEndpoint, uploadFolder }
}

function safeName(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image"
  )
}

function normalizeFolder(baseFolder: string, childFolder: string) {
  const joined = `${baseFolder}/${childFolder}`
    .replace(/\/+/g, "/")
    .replace(/\/$/, "")

  return joined.startsWith("/") ? joined : `/${joined}`
}

function fileFromFormData(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName)

  if (!(value instanceof File) || value.size === 0) {
    return null
  }

  return value
}

function assertValidImage(file: File) {
  const extension = allowedMimeTypes.get(file.type.toLowerCase())

  if (!extension) {
    throw new Error("Image non supportee. Utilisez JPG, PNG ou WebP.")
  }

  if (file.size > maxImageBytes()) {
    const limitMb = Math.floor(maxImageBytes() / (1024 * 1024))
    throw new Error(
      `Image trop lourde. La limite configuree est de ${limitMb} Mo.`,
    )
  }

  return extension
}

export async function uploadImageToImageKit(
  file: File,
  options: {
    folder: string
    fileNamePrefix: string
  },
): Promise<UploadedImage> {
  const config = imageKitConfig()
  const extension = assertValidImage(file)
  const fileName = `${safeName(options.fileNamePrefix)}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`
  const uploadForm = new FormData()

  uploadForm.append("file", file, fileName)
  uploadForm.append("fileName", fileName)
  uploadForm.append(
    "folder",
    normalizeFolder(config.uploadFolder, options.folder),
  )
  uploadForm.append("useUniqueFileName", "true")

  const response = await fetch(uploadEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.privateKey}:`).toString("base64")}`,
    },
    body: uploadForm,
  })

  const body = (await response.json().catch(() => null)) as {
    url?: string
    fileId?: string
    filePath?: string
    name?: string
    thumbnailUrl?: string
    message?: string
  } | null

  if (!response.ok || !body?.url) {
    throw new Error(
      body?.message
        ? `Upload ImageKit impossible: ${body.message}`
        : "Upload ImageKit impossible.",
    )
  }

  return {
    url: body.url,
    storageKey: body.filePath ?? body.fileId ?? fileName,
    fileId: body.fileId ?? body.filePath ?? fileName,
    name: body.name ?? fileName,
    thumbnailUrl: body.thumbnailUrl ?? null,
  }
}

export async function uploadImageFromFormData(
  formData: FormData,
  fieldName: string,
  options: {
    folder: string
    fileNamePrefix: string
  },
) {
  const file = fileFromFormData(formData, fieldName)

  if (!file) return null

  return uploadImageToImageKit(file, options)
}

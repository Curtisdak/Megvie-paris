import { existsSync } from "node:fs"
import { config } from "dotenv"

for (const path of [".env.local", ".env"]) {
  if (existsSync(path)) {
    config({ path, override: false, quiet: true })
  }
}

const uploadEndpoint = "https://upload.imagekit.io/api/v1/files/upload"
const deleteEndpoint = "https://api.imagekit.io/v1/files"

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Variable manquante: ${name}`)
  }

  return value
}

async function parseImageKitBody(response: Response) {
  return (await response.json().catch(() => null)) as {
    fileId?: string
    url?: string
    message?: string
  } | null
}

async function main() {
  const provider = requiredEnv("IMAGE_STORAGE_PROVIDER").toLowerCase()

  if (provider !== "imagekit") {
    throw new Error("IMAGE_STORAGE_PROVIDER doit etre defini sur imagekit.")
  }

  requiredEnv("IMAGEKIT_PUBLIC_KEY")
  const privateKey = requiredEnv("IMAGEKIT_PRIVATE_KEY")
  requiredEnv("IMAGEKIT_URL_ENDPOINT")
  const uploadFolder = requiredEnv("IMAGEKIT_UPLOAD_FOLDER").replace(/\/$/, "")
  const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`
  const fileName = `megvie-imagekit-smoke-${Date.now()}.png`
  const pngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64",
  )
  const form = new FormData()

  form.append("file", new Blob([new Uint8Array(pngBytes)], { type: "image/png" }), fileName)
  form.append("fileName", fileName)
  form.append("folder", `${uploadFolder}/smoke-tests`)
  form.append("useUniqueFileName", "true")

  const uploadResponse = await fetch(uploadEndpoint, {
    method: "POST",
    headers: { Authorization: authHeader },
    body: form,
  })
  const uploadBody = await parseImageKitBody(uploadResponse)

  if (!uploadResponse.ok || !uploadBody?.fileId || !uploadBody.url) {
    throw new Error(
      uploadBody?.message
        ? `Upload ImageKit refuse: ${uploadBody.message}`
        : `Upload ImageKit refuse avec le statut ${uploadResponse.status}.`,
    )
  }

  const deleteResponse = await fetch(
    `${deleteEndpoint}/${encodeURIComponent(uploadBody.fileId)}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    },
  )

  if (!deleteResponse.ok && deleteResponse.status !== 204) {
    const deleteBody = await parseImageKitBody(deleteResponse)
    throw new Error(
      deleteBody?.message
        ? `Fichier smoke uploade mais suppression refusee: ${deleteBody.message}`
        : `Fichier smoke uploade mais suppression refusee avec le statut ${deleteResponse.status}.`,
    )
  }

  console.log("ImageKit smoke test OK: upload et suppression temporaires reussis.")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

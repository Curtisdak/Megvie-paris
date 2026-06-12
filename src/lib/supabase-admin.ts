import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type SupabaseAdminConfig =
  | { supabase: SupabaseClient; error?: never }
  | { supabase?: never; error: string }

let cachedClient: SupabaseClient | null = null

function normalizeSupabaseUrl(value: string) {
  try {
    const url = new URL(value)
    url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "")
    url.search = ""
    url.hash = ""

    return url.toString().replace(/\/$/, "")
  } catch {
    return null
  }
}

function validateServerKey(value: string) {
  if (value.startsWith("sb_publishable_")) {
    return "SUPABASE_SERVICE_ROLE_KEY doit etre une cle serveur, pas une cle publishable."
  }

  if (value.startsWith("eyJ") && value.split(".").length !== 3) {
    return "SUPABASE_SERVICE_ROLE_KEY ressemble a un JWT tronque. Copiez la cle complete depuis Supabase."
  }

  if (value.length < 40) {
    return "SUPABASE_SERVICE_ROLE_KEY est trop courte pour etre valide."
  }

  return null
}

export function getSupabaseAdminClient(): SupabaseAdminConfig {
  const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!rawSupabaseUrl || !serviceRoleKey) {
    return {
      error:
        "Supabase est mal configure. Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
    }
  }

  const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl)

  if (!supabaseUrl) {
    return {
      error:
        "NEXT_PUBLIC_SUPABASE_URL doit etre une URL Supabase valide, par exemple https://votre-projet.supabase.co.",
    }
  }

  const keyError = validateServerKey(serviceRoleKey)

  if (keyError) {
    return { error: keyError }
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return { supabase: cachedClient }
}

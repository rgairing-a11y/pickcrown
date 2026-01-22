import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Centralized Supabase client creation.
 * This is the ONLY file that imports and calls createClient.
 */

function validateEnv(url: string | undefined, key: string | undefined, context: string): { url: string; key: string } {
  if (!url || !key) {
    // During build time, env vars might not be available
    // Return a mock to avoid build failures
    throw new Error(`Supabase ${context} client not configured - env vars missing`)
  }
  return { url, key }
}

/**
 * Create browser client (uses anon key)
 */
export function createBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, return a proxy that throws at runtime if used
  if (!url || !key) {
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error('Supabase browser client not configured - env vars missing')
      }
    })
  }

  return createSupabaseClient(url, key)
}

/**
 * Create server client (uses service role OR anon key)
 * Prefers service role if available, falls back to anon key
 */
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, return a proxy that throws at runtime if used
  if (!url || !key) {
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error('Supabase server client not configured - env vars missing')
      }
    })
  }

  return createSupabaseClient(url, key)
}

/**
 * Create admin client (uses service role key)
 * Throws immediately if service role key is not available
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  const { url: validUrl, key: validKey } = validateEnv(url, key, 'admin')

  return createSupabaseClient(validUrl, validKey)
}

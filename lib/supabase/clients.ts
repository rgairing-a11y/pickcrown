/**
 * Centralized Supabase client factory
 *
 * Provides three types of clients:
 * 1. Admin Client - Uses SERVICE_ROLE_KEY for privileged server-side operations
 * 2. Server Client - For server components and API routes (uses SERVICE_ROLE_KEY if available)
 * 3. Browser Client - For client-side components (uses ANON_KEY)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variable validation
function getEnvVar(name: string, required = true): string | undefined {
  const value = process.env[name]
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Cached client instances
let adminClientInstance: SupabaseClient | null = null
let browserClientInstance: SupabaseClient | null = null

/**
 * Get admin client with SERVICE_ROLE_KEY
 * Use for: API routes, server actions, privileged operations
 * WARNING: Never expose this client to the browser
 */
export function getAdminClient(): SupabaseClient {
  if (adminClientInstance) {
    return adminClientInstance
  }

  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')!
  const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')!

  adminClientInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClientInstance
}

/**
 * Get server client (uses SERVICE_ROLE_KEY if available, otherwise ANON_KEY)
 * Use for: Server components, API routes that need flexible auth
 */
export function getServerClient(): SupabaseClient {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')!
  const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY', false)
  const anonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', false)

  const key = serviceRoleKey || anonKey
  if (!key) {
    throw new Error('Missing Supabase key (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Get browser client with ANON_KEY
 * Use for: Client components, browser-side operations
 * Note: This is safe to use in the browser
 */
export function getBrowserClient(): SupabaseClient {
  if (browserClientInstance) {
    return browserClientInstance
  }

  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')!
  const anonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')!

  browserClientInstance = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  })

  return browserClientInstance
}

// Backwards compatibility exports
export const supabaseAdmin = getAdminClient()

/**
 * @deprecated Use getAdminClient() instead
 */
export { getAdminClient as createAdminClient }

/**
 * @deprecated Use getServerClient() instead
 */
export { getServerClient as createServerClient }

/**
 * @deprecated Use getBrowserClient() instead
 */
export { getBrowserClient as createBrowserClient }

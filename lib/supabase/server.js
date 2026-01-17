import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, env vars might not be available
  // Return a mock to avoid build failures
  if (!supabaseUrl || !supabaseKey) {
    return new Proxy({}, {
      get() {
        throw new Error('Supabase client not configured - env vars missing')
      }
    })
  }

  return createSupabaseClient(supabaseUrl, supabaseKey)
}

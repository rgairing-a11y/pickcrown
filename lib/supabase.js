import { createClient } from '@supabase/supabase-js'

let _supabaseInstance = null

function getOrCreateClient() {
  if (_supabaseInstance) return _supabaseInstance

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, env vars might not be available
  // Return a mock to avoid build failures
  if (!url || !key) {
    // Return a mock client that will fail at runtime if actually used
    return new Proxy({}, {
      get() {
        throw new Error('Supabase client not configured - env vars missing')
      }
    })
  }

  _supabaseInstance = createClient(url, key)
  return _supabaseInstance
}

export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getOrCreateClient()
    return client[prop]
  }
})

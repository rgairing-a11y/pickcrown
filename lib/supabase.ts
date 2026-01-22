import { createBrowserClient } from '@/lib/supabase/clients'

let _supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

function getOrCreateClient() {
  if (_supabaseInstance) return _supabaseInstance
  _supabaseInstance = createBrowserClient()
  return _supabaseInstance
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(target, prop) {
    const client = getOrCreateClient()
    return (client as any)[prop]
  }
})

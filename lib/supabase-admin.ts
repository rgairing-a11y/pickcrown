import { createAdminClient } from '@/lib/supabase/clients'

export function getSupabaseAdmin() {
  return createAdminClient()
}

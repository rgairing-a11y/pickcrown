/**
 * Server Supabase client factory
 * @deprecated Import from 'lib/supabase/clients' instead
 *
 * This file is kept for backwards compatibility.
 * New code should use: import { getServerClient } from '@/lib/supabase/clients'
 */

import { getServerClient } from './clients'

export function createClient() {
  return getServerClient()
}

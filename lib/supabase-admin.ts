/**
 * Admin Supabase client
 * @deprecated Import from 'lib/supabase/clients' instead
 *
 * This file is kept for backwards compatibility.
 * New code should use: import { getAdminClient } from '@/lib/supabase/clients'
 */

import { getAdminClient } from './supabase/clients'

export const supabaseAdmin = getAdminClient()

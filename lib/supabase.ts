/**
 * Browser Supabase client
 * @deprecated Import from 'lib/supabase/clients' instead
 *
 * This file is kept for backwards compatibility.
 * New code should use: import { getBrowserClient } from '@/lib/supabase/clients'
 */

import { getBrowserClient } from './supabase/clients'

export const supabase = getBrowserClient()

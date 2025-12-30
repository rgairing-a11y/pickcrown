import { createClient } from '@supabase/supabase-js'

/**
 * Check if an email is a participant in a pool
 * Used to determine if they should see pool content or "This pool is private" message
 */
export async function isPoolParticipant(poolId, email) {
  if (!email) return false
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data } = await supabase
    .from('pool_entries')
    .select('id')
    .eq('pool_id', poolId)
    .ilike('email', email)
    .single()

  return !!data
}

/**
 * Get basic pool info (for non-participants)
 * Returns only public metadata per product foundation
 */
export async function getPoolPublicInfo(poolId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: pool } = await supabase
    .from('pools')
    .select(`
      id,
      name,
      event:events(
        id,
        name,
        start_time,
        status
      )
    `)
    .eq('id', poolId)
    .single()

  if (!pool) return null

  // Only return public metadata
  return {
    eventName: pool.event?.name,
    eventDate: pool.event?.start_time,
    eventStatus: pool.event?.status
  }
}

/**
 * Calculate event podium (Top 3 across all pools)
 * Per product foundation: read-only, post-event only, celebratory
 */
export async function getEventPodium(eventId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Get all pools for this event
  const { data: pools } = await supabase
    .from('pools')
    .select('id')
    .eq('event_id', eventId)

  if (!pools || pools.length === 0) return []

  // Get standings from all pools
  const allEntries = []
  
  for (const pool of pools) {
    const { data } = await supabase.rpc('calculate_standings', { p_pool_id: pool.id })
    if (data) {
      allEntries.push(...data)
    }
  }

  // Sort by total_points descending
  allEntries.sort((a, b) => {
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points
    }
    return a.entry_name.localeCompare(b.entry_name)
  })

  // Return top 3 only
  return allEntries.slice(0, 3).map((entry, idx) => ({
    entry_name: entry.entry_name,
    total_points: entry.total_points,
    position: idx + 1,
    medal: idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
  }))
}

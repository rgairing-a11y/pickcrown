import { getServerClient } from './supabase/clients'
import type { PoolPublicInfo, PodiumEntry } from './types'

/**
 * Check if an email is a participant in a pool
 * Used to determine if they should see pool content or "This pool is private" message
 */
export async function isPoolParticipant(poolId: string, email: string | null | undefined): Promise<boolean> {
  if (!email) return false

  const supabase = getServerClient()

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
export async function getPoolPublicInfo(poolId: string): Promise<PoolPublicInfo | null> {
  const supabase = getServerClient()

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
  // Note: Supabase relation queries return arrays, so we access the first element
  const event = Array.isArray(pool.event) ? pool.event[0] : pool.event
  return {
    eventName: event?.name,
    eventDate: event?.start_time,
    eventStatus: event?.status
  }
}

/**
 * Calculate event podium (Top 3 across all pools)
 * Per product foundation: read-only, post-event only, celebratory
 */
export async function getEventPodium(eventId: string): Promise<PodiumEntry[]> {
  const supabase = getServerClient()

  // Get all pools for this event
  const { data: pools } = await supabase
    .from('pools')
    .select('id')
    .eq('event_id', eventId)

  if (!pools || pools.length === 0) return []

  // Get standings from all pools
  const allEntries: Array<{ entry_name: string; total_points: number }> = []

  for (const pool of pools) {
    const { data } = await supabase.rpc('calculate_standings', { p_pool_id: pool.id })
    if (data) {
      allEntries.push(...data)
    }
  }

  // Sort by total_points descending
  allEntries.sort((a: { entry_name: string; total_points: number }, b: { entry_name: string; total_points: number }) => {
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

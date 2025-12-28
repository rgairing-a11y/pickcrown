export const dynamic = 'force-dynamic'

import { supabase } from '../../../lib/supabase'
import PickSubmissionForm from '../../../components/PickSubmissionForm'
import BracketPickForm from '../../../components/BracketPickForm'
import Link from 'next/link'
import { isEventLocked } from '../../../lib/utils'
import { EVENT_TYPES } from '../../../lib/constants'

export default async function PoolPage({ params }) {
  const { poolId } = await params

  const { data: pool } = await supabase
    .from('pools')
    .select(`
      *,
      event:events (
        *,
        categories (
          *,
          options:category_options (*)
        )
      )
    `)
    .eq('id', poolId)
    .single()

  if (!pool) {
    return (
      <div style={{
        maxWidth: 500,
        margin: '48px auto',
        background: 'var(--color-white)',
        padding: 'var(--spacing-xxl)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--spacing-lg)' }}>❌</div>
        <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Pool Not Found</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-lg)' }}>
          This pool does not exist or the link is incorrect.
        </p>
        <Link
          href="/"
          style={{
            color: 'var(--color-primary)',
            fontWeight: 'bold'
          }}
        >
          Go Home
        </Link>
      </div>
    )
  }

  const locked = isEventLocked(pool.event.start_time)
  const eventType = pool.event.event_type || EVENT_TYPES.PICK_ONE

  // For bracket events, fetch rounds, matchups, and teams
  let rounds = []
  let matchups = []
  let teams = []

  if (eventType === EVENT_TYPES.BRACKET || eventType === EVENT_TYPES.HYBRID) {
    const { data: roundsData } = await supabase
      .from('rounds')
      .select('*')
      .eq('event_id', pool.event.id)
      .order('round_order')
    
    rounds = roundsData || []

    const { data: matchupsData } = await supabase
      .from('matchups')
      .select('*')
      .eq('event_id', pool.event.id)
    
    matchups = matchupsData || []

    // Get all team IDs from matchups
    const teamIds = new Set()
    matchups.forEach(m => {
      if (m.team_a_id) teamIds.add(m.team_a_id)
      if (m.team_b_id) teamIds.add(m.team_b_id)
    })

    if (teamIds.size > 0) {
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .in('id', Array.from(teamIds))
      teams = teamsData || []
    }
  }

  return (
    <div style={{ maxWidth: eventType === EVENT_TYPES.BRACKET ? 1200 : 600, margin: '0 auto' }}>
      {/* Pool Header */}
      <div style={{
        background: 'var(--color-white)',
        padding: 'var(--spacing-xl)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <h1 style={{ margin: 0 }}>{pool.name}</h1>
        <p style={{
          color: 'var(--color-text-light)',
          margin: 'var(--spacing-sm) 0 0',
          fontSize: 'var(--font-size-lg)'
        }}>
          {pool.event.name} ({pool.event.year})
        </p>
      </div>

      {locked ? (
        <div style={{
          background: 'var(--color-warning-light)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--spacing-md)' }}>🔒</div>
          <h2 style={{ margin: '0 0 var(--spacing-md)' }}>Picks Are Locked</h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-lg)' }}>
            The event has started. No more submissions allowed.
          </p>
          <Link
            href={`/pool/${poolId}/standings`}
            style={{
              display: 'inline-block',
              padding: 'var(--spacing-md) var(--spacing-xl)',
              background: 'var(--color-primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'bold'
            }}
          >
            View Standings
          </Link>
        </div>
      ) : (
        <>
          {eventType === EVENT_TYPES.BRACKET ? (
            <BracketPickForm 
              pool={pool} 
              rounds={rounds}
              matchups={matchups}
              teams={teams}
            />
          ) : eventType === EVENT_TYPES.HYBRID ? (
            // For hybrid, show both bracket and categories
            <div>
              <BracketPickForm 
                pool={pool} 
                rounds={rounds}
                matchups={matchups}
                teams={teams}
              />
              {/* TODO: Add category picks for hybrid */}
            </div>
          ) : (
            <div style={{
              background: 'var(--color-white)',
              padding: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-md)'
            }}>
              <PickSubmissionForm pool={pool} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
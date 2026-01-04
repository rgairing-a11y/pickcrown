export const dynamic = 'force-dynamic'

import { supabase } from '../../../lib/supabase'
import PickSubmissionForm from '../../../components/PickSubmissionForm'
import BracketPickForm from '../../../components/BracketPickForm'
import Link from 'next/link'
import { isEventLocked } from '../../../lib/utils'
import { EVENT_TYPES } from '../../../lib/constants'
import CopyLinkButton from '../../../components/CopyLinkButton'

function getTimeRemaining(deadline) {
  const now = new Date()
  const end = new Date(deadline)
  const diff = end - now
  
  if (diff <= 0) return null
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export default async function PoolPage({ params }) {
  const { poolId } = await params

  // Fetch pool with event, phases, and categories
  const { data: pool } = await supabase
    .from('pools')
    .select(`
      *,
      event:events(
        *,
        phases(*),
        categories(
          *,
          phase_id,
          options:category_options(*)
        )
      )
    `)
    .eq('id', poolId)
    .single()

  // Pool not found
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

  // Extract event data
  const eventType = pool.event.event_type || EVENT_TYPES.PICK_ONE
  const phases = pool.event.phases || []
  const hasPhases = phases.length > 0

  // Determine lock status
  let locked = isEventLocked(pool.event.start_time)

  if (hasPhases) {
    // For multi-phase events, check if ANY phase is still open
    const now = new Date()
    const anyPhaseOpen = phases.some(phase => {
      const lockTime = new Date(phase.lock_time)
      const isBeforeLock = now < lockTime
      const isFirstPhase = phase.phase_order === 1
      const prevPhaseCompleted = phases.find(p => p.phase_order === phase.phase_order - 1)?.status === 'completed'
      return isBeforeLock && (isFirstPhase || prevPhaseCompleted)
    })
    locked = !anyPhaseOpen
  }


  // Calculate time remaining (use first open phase lock time for multi-phase)
  let timeRemainingDeadline = pool.event.start_time
  if (hasPhases) {
    const sortedPhases = [...phases].sort((a, b) => a.phase_order - b.phase_order)
    const firstOpenPhase = sortedPhases.find(p => new Date(p.lock_time) > new Date())
    if (firstOpenPhase) {
      timeRemainingDeadline = firstOpenPhase.lock_time
    }
  }
  const timeRemaining = getTimeRemaining(timeRemainingDeadline)

  // Get entry count
  const { count: entryCount } = await supabase
    .from('pool_entries')
    .select('*', { count: 'exact', head: true })
    .eq('pool_id', poolId)

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
          margin: 'var(--spacing-sm) 0 var(--spacing-lg)',
          fontSize: 'var(--font-size-lg)'
        }}>
          {pool.event.name} ({pool.event.year})
        </p>
        
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ 
            padding: '8px 16px', 
            background: '#f0f9ff', 
            borderRadius: 8,
            fontSize: 14
          }}>
            <strong>{entryCount || 0}</strong> {entryCount === 1 ? 'entry' : 'entries'}
          </div>
          
          {timeRemaining && !locked && (
            <div style={{ 
              padding: '8px 16px', 
              background: '#fef3c7', 
              borderRadius: 8,
              fontSize: 14
            }}>
              🔒 Picks lock in <strong>{timeRemaining}</strong>
            </div>
          )}
        </div>

        {/* Pool Notes (if set by commissioner) */}
        {pool.notes && (
          <div style={{ 
            marginTop: 16,
            padding: '12px 16px', 
            background: '#fef9c3', 
            borderRadius: 8,
            borderLeft: '4px solid #f59e0b',
            fontSize: 14,
            color: '#92400e'
          }}>
            <strong style={{ display: 'block', marginBottom: 4 }}>📝 Pool Notes</strong>
            <span style={{ whiteSpace: 'pre-wrap' }}>{pool.notes}</span>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <CopyLinkButton 
            url={'https://pickcrown.vercel.app/pool/' + poolId} 
            label="Copy Pool Link"
          />
        </div>
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
            href={'/pool/' + poolId + '/standings'}
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
            <div>
              <BracketPickForm 
                pool={pool} 
                rounds={rounds}
                matchups={matchups}
                teams={teams}
              />
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
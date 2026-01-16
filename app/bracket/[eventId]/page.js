export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import BracketView from '../../../components/BracketView'
import Link from 'next/link'

export default async function BracketPage({ params }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { eventId } = await params

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) {
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
        <h1>Event Not Found</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-lg)' }}>
          This event doesn't exist or the link is incorrect.
        </p>
        <Link href="/" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
          ← Go Home
        </Link>
      </div>
    )
  }

  const { data: rounds } = await supabase
    .from('rounds')
    .select('*')
    .eq('event_id', eventId)
    .order('round_order')

  const { data: matchups } = await supabase
    .from('matchups')
    .select('*')
    .eq('event_id', eventId)

  const teamIds = new Set()
  matchups?.forEach(m => {
    if (m.team_a_id) teamIds.add(m.team_a_id)
    if (m.team_b_id) teamIds.add(m.team_b_id)
    if (m.winner_team_id) teamIds.add(m.winner_team_id)
  })

  let teams = []
  if (teamIds.size > 0) {
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .in('id', Array.from(teamIds))
    teams = teamsData || []
  }

  if (!rounds?.length || !matchups?.length) {
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
        <div style={{ fontSize: 48, marginBottom: 'var(--spacing-lg)' }}>🏆</div>
        <h1>{event.name}</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xl)' }}>
          This bracket hasn't been set up yet.
        </p>
        <Link
          href={`/admin/events/${eventId}/bracket`}
          style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
        >
          Set up bracket in Admin →
        </Link>
      </div>
    )
  }

  return (
    <BracketView
      event={event}
      rounds={rounds}
      matchups={matchups}
      teams={teams}
    />
  )
}
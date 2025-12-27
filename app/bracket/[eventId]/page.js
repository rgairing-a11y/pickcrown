import { supabase } from '../../../lib/supabase'
import BracketView from '../../../components/BracketView'

export const dynamic = 'force-dynamic'

export default async function BracketPage({ params }) {
  const { eventId } = await params

  // Fetch event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) {
    return <div style={{ padding: 24 }}>Event not found</div>
  }

  // Fetch rounds
  const { data: rounds } = await supabase
    .from('rounds')
    .select('*')
    .eq('event_id', eventId)
    .order('round_order')

  // Fetch matchups
  const { data: matchups } = await supabase
    .from('matchups')
    .select('*')
    .eq('event_id', eventId)

  // Get all team IDs from matchups
  const teamIds = new Set()
  matchups?.forEach(m => {
    if (m.team_a_id) teamIds.add(m.team_a_id)
    if (m.team_b_id) teamIds.add(m.team_b_id)
    if (m.winner_team_id) teamIds.add(m.winner_team_id)
  })

  // Fetch teams by IDs
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .in('id', Array.from(teamIds))

  // Get unique conferences/regions from the data
  const conferences = [...new Set(teams?.map(t => t.conference).filter(Boolean))]

  return (
    <BracketView 
      event={event}
      rounds={rounds || []}
      matchups={matchups || []}
      teams={teams || []}
      conferences={conferences}
    />
  )
}
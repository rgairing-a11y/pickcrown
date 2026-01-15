export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default async function SeasonStandingsPage({ params }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { seasonId } = await params

  // Get season info
  const { data: season } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', seasonId)
    .single()

  if (!season) {
    return <div style={{ padding: 24 }}>Season not found</div>
  }

  // Get all events in this season
  const { data: events } = await supabase
    .from('events')
    .select('id, name, start_time, status')
    .eq('season_id', seasonId)
    .order('start_time', { ascending: true })

  // Get season standings
  const { data: standings } = await supabase
    .rpc('calculate_season_standings', { p_season_id: seasonId })

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1>🏆 {season.name}</h1>
      {season.description && (
        <p style={{ color: '#666', marginBottom: 24 }}>{season.description}</p>
      )}

      {/* Season Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <div style={{ 
          padding: 16, 
          background: '#f0f0f0', 
          borderRadius: 8,
          textAlign: 'center',
          flex: 1
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{events?.length || 0}</div>
          <div style={{ color: '#666' }}>Events</div>
        </div>
        <div style={{ 
          padding: 16, 
          background: '#f0f0f0', 
          borderRadius: 8,
          textAlign: 'center',
          flex: 1
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{standings?.length || 0}</div>
          <div style={{ color: '#666' }}>Participants</div>
        </div>
      </div>

      {/* Events List */}
      <h2>Events</h2>
      <div style={{ marginBottom: 32 }}>
        {events?.map(event => (
          <div 
            key={event.id} 
            style={{ 
              padding: 12, 
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{event.name}</span>
            <span style={{ 
              padding: '4px 8px', 
              borderRadius: 4,
              fontSize: 12,
              background: event.status === 'completed' ? '#d4edda' : 
                         event.status === 'locked' ? '#fff3cd' : '#e2e3e5',
              color: event.status === 'completed' ? '#155724' :
                     event.status === 'locked' ? '#856404' : '#383d41'
            }}>
              {event.status}
            </span>
          </div>
        ))}
      </div>

      {/* Standings */}
      <h2>Standings</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: 12, textAlign: 'left' }}>Rank</th>
            <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
            <th style={{ padding: 12, textAlign: 'center' }}>Events</th>
            <th style={{ padding: 12, textAlign: 'right' }}>Points</th>
          </tr>
        </thead>
        <tbody>
          {standings?.map((entry, idx) => (
            <tr
              key={entry.email}
              style={{
                borderBottom: '1px solid #ddd',
                background: idx % 2 === 0 ? 'white' : '#f9f9f9'
              }}
            >
              <td style={{ padding: 12 }}>
                {entry.rank === 1 ? '👑' : ''} #{entry.rank}
              </td>
              <td style={{ padding: 12, fontWeight: entry.rank <= 3 ? 'bold' : 'normal' }}>
                {entry.entry_name}
              </td>
              <td style={{ padding: 12, textAlign: 'center' }}>
                {entry.events_entered}
              </td>
              <td style={{ padding: 12, textAlign: 'right' }}>
                {entry.total_points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {standings?.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: 24, color: '#666' }}>
          No entries yet. Join an event to appear on the leaderboard!
        </p>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href="/">← Home</Link>
      </div>
    </div>
  )
}

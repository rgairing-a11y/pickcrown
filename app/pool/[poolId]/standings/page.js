import { supabase } from '../../../../lib/supabase'

export const dynamic = 'force-dynamic'

export default async function StandingsPage({ params }) {
  const { poolId } = await params

  // Fetch pool info
  const { data: pool } = await supabase
    .from('pools')
    .select('*, event:events(name)')
    .eq('id', poolId)
    .single()

  if (!pool) {
    return <div style={{ padding: 24 }}>Pool not found</div>
  }

  // Fetch standings
  const { data: standings, error } = await supabase
    .rpc('calculate_standings', { p_pool_id: poolId })

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1>{pool.name}</h1>
      <h2>{pool.event.name} — Standings</h2>

      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        marginTop: 24 
      }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: 12, textAlign: 'left' }}>Rank</th>
            <th style={{ padding: 12, textAlign: 'left' }}>Entry</th>
            <th style={{ padding: 12, textAlign: 'right' }}>Points</th>
          </tr>
        </thead>
        <tbody>
          {standings?.map((entry, idx) => (
            <tr 
              key={entry.entry_id}
              style={{
                borderBottom: '1px solid #ddd',
                background: idx % 2 === 0 ? 'white' : '#f9f9f9'
              }}
            >
              <td style={{ padding: 12 }}>
                {entry.rank === 1 ? '👑 ' : ''}#{entry.rank}
              </td>
              <td style={{ 
                padding: 12, 
                fontWeight: entry.rank <= 3 ? 'bold' : 'normal' 
              }}>
                {entry.entry_name}
              </td>
              <td style={{ padding: 12, textAlign: 'right' }}>
                {entry.total_points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(!standings || standings.length === 0) && (
        <p style={{ textAlign: 'center', marginTop: 24, color: '#666' }}>
          No entries yet
        </p>
      )}

      <div style={{ marginTop: 24 }}>
        <a href={`/pool/${poolId}`}>← Back to pool</a>
      </div>
    </div>
  )
}
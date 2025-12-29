export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function StandingsPage({ params }) {
  const { poolId } = await params

  const { data: pool } = await supabase
    .from('pools')
    .select('*, event:events(name, year, season_id, season:seasons(id, name))')
    .eq('id', poolId)
    .single()

  if (!pool) {
    return <div style={{ padding: 24 }}>Pool not found</div>
  }

  const { data: standings } = await supabase
    .rpc('calculate_standings', { p_pool_id: poolId })

  const season = pool.event?.season

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1>{pool.name} — Standings</h1>
      <h2>{pool.event?.name} {pool.event?.year}</h2>

      {season && (
        <div style={{ marginBottom: 24 }}>
          <Link 
            href={`/season/${season.id}/standings`}
            style={{
              display: 'inline-block',
              padding: '12px 20px',
              background: '#ffc107',
              color: '#000',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            🏆 View {season.name} Standings
          </Link>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: 12, textAlign: 'left' }}>Rank</th>
            <th style={{ padding: 12, textAlign: 'left' }}>Entry Name</th>
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
                {entry.rank === 1 ? '👑' : ''} #{entry.rank}
              </td>
              <td style={{ padding: 12, fontWeight: entry.rank <= 3 ? 'bold' : 'normal' }}>
                {entry.entry_name}
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
          No entries yet
        </p>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href={`/pool/${poolId}`}>← Back to Pool</Link>
      </div>
    </div>
  )
}
export const dynamic = 'force-dynamic'

import { supabase } from '../../../../lib/supabase'
import Link from 'next/link'
import CopyLinkButton from '../../../../components/CopyLinkButton'

export default async function StandingsPage({ params }) {
  const { poolId } = await params

  const { data: pool } = await supabase
    .from('pools')
    .select('*, event:events(name, year)')
    .eq('id', poolId)
    .single()

  const { data: standings } = await supabase
    .rpc('calculate_standings', { p_pool_id: poolId })

  if (!pool) {
    return (
      <div style={{
        maxWidth: 500,
        margin: '48px auto',
        background: 'white',
        padding: 32,
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h1>Pool Not Found</h1>
        <Link href="/" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
          Go Home
        </Link>
      </div>
    )
  }

  const standingsUrl = 'https://pickcrown.vercel.app/pool/' + poolId + '/standings'

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Link href={'/pool/' + poolId} style={{ color: '#3b82f6' }}>
          Back to Pool
        </Link>
      </div>

      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: 24
      }}>
        <h1 style={{ margin: 0 }}>{pool.name}</h1>
        <p style={{ color: '#666', margin: '8px 0 16px' }}>
          {pool.event.name} ({pool.event.year}) - Standings
        </p>
        <CopyLinkButton url={standingsUrl} label="Share Standings" />
      </div>

      <div style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 80px',
          padding: 16,
          background: '#f5f5f5',
          fontWeight: 'bold',
          fontSize: 12,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          <div>Rank</div>
          <div>Entry</div>
          <div style={{ textAlign: 'right' }}>Points</div>
        </div>

        {standings?.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p style={{ color: '#999' }}>No entries yet</p>
          </div>
        ) : (
          standings?.map((entry, idx) => (
            <div
              key={entry.entry_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 80px',
                padding: 16,
                borderBottom: '1px solid #eee',
                background: idx % 2 === 0 ? 'white' : '#fafafa',
                alignItems: 'center'
              }}
            >
              <div style={{
                fontWeight: entry.rank <= 3 ? 'bold' : 'normal',
                fontSize: entry.rank === 1 ? 20 : 16
              }}>
                {entry.rank === 1 && '👑 '}#{entry.rank}
              </div>
              <div style={{
                fontWeight: entry.rank <= 3 ? 'bold' : 'normal',
                color: entry.rank === 1 ? '#d4af37' : '#333'
              }}>
                {entry.entry_name}
              </div>
              <div style={{
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: 18,
                color: entry.total_points > 0 ? '#22c55e' : '#999'
              }}>
                {entry.total_points}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
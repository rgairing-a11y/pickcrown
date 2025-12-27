export const dynamic = 'force-dynamic'

import { supabase } from '../../../../lib/supabase'
import Link from 'next/link'

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
        background: 'var(--color-white)',
        padding: 'var(--spacing-xxl)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--spacing-lg)' }}>❌</div>
        <h1>Pool Not Found</h1>
        <Link href="/" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
          ← Go Home
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Link href={`/pool/${poolId}`} style={{ color: 'var(--color-primary)' }}>
          ← Back to Pool
        </Link>
      </div>

      {/* Header */}
      <div style={{
        background: 'var(--color-white)',
        padding: 'var(--spacing-xl)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <h1 style={{ margin: 0 }}>{pool.name}</h1>
        <p style={{ color: 'var(--color-text-light)', margin: 'var(--spacing-sm) 0 0' }}>
          {pool.event.name} ({pool.event.year}) — Standings
        </p>
      </div>

      {/* Standings Table */}
      <div style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 80px',
          padding: 'var(--spacing-lg)',
          background: 'var(--color-background-dark)',
          fontWeight: 'bold',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-light)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <div>Rank</div>
          <div>Entry</div>
          <div style={{ textAlign: 'right' }}>Points</div>
        </div>

        {/* Table Body */}
        {standings?.length === 0 ? (
          <div style={{
            padding: 'var(--spacing-xxl)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 'var(--spacing-lg)' }}>📭</div>
            <p style={{ color: 'var(--color-text-muted)' }}>No entries yet</p>
          </div>
        ) : (
          standings?.map((entry, idx) => (
            <div
              key={entry.entry_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 80px',
                padding: 'var(--spacing-lg)',
                borderBottom: '1px solid var(--color-border-light)',
                background: idx % 2 === 0 ? 'var(--color-white)' : 'var(--color-background)',
                alignItems: 'center'
              }}
            >
              <div style={{
                fontWeight: entry.rank <= 3 ? 'bold' : 'normal',
                fontSize: entry.rank === 1 ? 'var(--font-size-xl)' : 'var(--font-size-md)'
              }}>
                {entry.rank === 1 && '👑 '}
                #{entry.rank}
              </div>
              <div style={{
                fontWeight: entry.rank <= 3 ? 'bold' : 'normal',
                color: entry.rank === 1 ? 'var(--color-gold)' : 'var(--color-text)'
              }}>
                {entry.entry_name}
              </div>
              <div style={{
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: 'var(--font-size-lg)',
                color: entry.total_points > 0 ? 'var(--color-success)' : 'var(--color-text-muted)'
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
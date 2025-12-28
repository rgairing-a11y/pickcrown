export const dynamic = 'force-dynamic'

import { supabase } from '../../../../lib/supabase'
import Link from 'next/link'
import { formatDateTime, isEventLocked } from '../../../../lib/utils'

export default async function PoolPreviewPage({ params }) {
  const { poolId } = await params

  const { data: pool } = await supabase
    .from('pools')
    .select(`
      *,
      event:events (*)
    `)
    .eq('id', poolId)
    .single()

  if (!pool) {
    return (
      <div style={{
        maxWidth: 500,
        margin: '48px auto',
        padding: 32,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h1>Pool Not Found</h1>
        <p style={{ color: '#666' }}>
          This pool does not exist or the link is incorrect.
        </p>
      </div>
    )
  }

  const { count: entryCount } = await supabase
    .from('pool_entries')
    .select('*', { count: 'exact', head: true })
    .eq('pool_id', poolId)

  const locked = isEventLocked(pool.event.start_time)
  const deadline = formatDateTime(pool.event.start_time)

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: 32,
    marginBottom: 24
  }

  return (
    <div style={{ maxWidth: 500, margin: '48px auto', padding: '0 16px' }}>
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👑</div>
        
        <h1 style={{ margin: '0 0 8px' }}>{pool.name}</h1>
        
        <p style={{ color: '#666', fontSize: 18, margin: '0 0 32px' }}>
          {pool.event.name} ({pool.event.year})
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 48,
          padding: '24px 0',
          borderTop: '1px solid #eee',
          borderBottom: '1px solid #eee',
          marginBottom: 24
        }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#3b82f6' }}>
              {entryCount || 0}
            </div>
            <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
              {entryCount === 1 ? 'Entry' : 'Entries'}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: locked ? '#ef4444' : '#22c55e' }}>
              {locked ? '🔒' : '✓'}
            </div>
            <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
              {locked ? 'Locked' : 'Open'}
            </div>
          </div>
        </div>

        <p style={{ color: '#666', marginBottom: 24 }}>
          {locked ? 'Picks locked' : 'Picks lock'}: <strong>{deadline}</strong>
        </p>

        {locked ? (
          <Link
            href={'/pool/' + poolId + '/standings'}
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: 8,
              fontWeight: 'bold',
              textDecoration: 'none'
            }}
          >
            View Standings
          </Link>
        ) : (
          <Link
            href={'/pool/' + poolId}
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: '#22c55e',
              color: 'white',
              borderRadius: 8,
              fontWeight: 'bold',
              textDecoration: 'none'
            }}
          >
            Join This Pool
          </Link>
        )}
      </div>

      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 16px' }}>What is PickCrown?</h3>
        <p style={{ color: '#666', margin: '0 0 16px' }}>
          A simple, no-nonsense prediction pool for sharing picks with friends — no accounts, no clutter.
        </p>
        <p style={{ fontSize: 14, color: '#999', margin: '0 0 16px' }}>
          Built for playoffs, wrestling events, awards shows, and anything else worth arguing about.
        </p>
        <Link
          href="/"
          style={{ color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}
        >
          Create Your Own Pool
        </Link>
      </div>
    </div>
  )
}
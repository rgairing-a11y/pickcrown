export const dynamic = 'force-dynamic'

import { supabase } from '../../../lib/supabase'
import PickSubmissionForm from '../../../components/PickSubmissionForm'
import Link from 'next/link'

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
        padding: 'var(--spacing-xl)', 
        textAlign: 'center',
        maxWidth: 500,
        margin: '48px auto'
      }}>
        <h1>Pool Not Found</h1>
        <p style={{ color: 'var(--color-text-light)' }}>
          This pool doesn't exist or the link is incorrect.
        </p>
        <Link href="/" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
          ← Go Home
        </Link>
      </div>
    )
  }

  const isLocked = new Date(pool.event.start_time) < new Date()

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
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

      {isLocked ? (
        <div style={{
          background: 'var(--color-warning-light)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 var(--spacing-md)' }}>🔒 Picks Are Locked</h2>
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
            View Standings →
          </Link>
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
    </div>
  )
}
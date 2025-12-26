import { supabase } from '../../../lib/supabase'
import PickSubmissionForm from '../../../components/PickSubmissionForm'

export const dynamic = 'force-dynamic'

export default async function PoolPage({ params }) {
  const { poolId } = await params

  // Fetch pool with event and categories
  const { data: pool, error } = await supabase
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

  if (error || !pool) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Pool not found</h1>
        <p>This pool doesn't exist or the link is incorrect.</p>
      </div>
    )
  }

  // Check if event has started (picks locked)
  const isLocked = new Date(pool.event.start_time) < new Date()

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1>{pool.name}</h1>
      <h2>{pool.event.name}</h2>
      
      {isLocked ? (
        <div style={{ 
          background: '#fff3cd', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 24 
        }}>
          <p><strong>Picks are now locked.</strong> The event has started.</p>
          <a href={`/pool/${poolId}/standings`}>View Standings →</a>
        </div>
      ) : (
        <PickSubmissionForm pool={pool} />
      )}
    </div>
  )
}
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'

export default async function PicksMatrixPage({ params }) {
  const { poolId } = await params

  // Get pool with event
  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .select(`
      *,
      event:events(*)
    `)
    .eq('id', poolId)
    .single()

  if (poolError || !pool) {
    return <div style={{ padding: 24 }}>Pool not found</div>
  }

  // Check if event has started (picks locked)
  const isLocked = new Date(pool.event.start_time) < new Date()

  if (!isLocked) {
    return (
      <div style={{ 
        padding: 24, 
        maxWidth: 600, 
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <h1>🔒 Picks Are Private</h1>
        <p>You can view everyone's picks after the event locks.</p>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Locks: {new Date(pool.event.start_time).toLocaleString()}
        </p>
        <Link href={`/pool/${poolId}`} style={{ color: '#3b82f6' }}>
          ← Back to Pool
        </Link>
      </div>
    )
  }

  // Get categories with options
  const { data: categories } = await supabase
    .from('categories')
    .select(`
      *,
      options:category_options(*)
    `)
    .eq('event_id', pool.event.id)
    .order('order_index')

  // Get all entries with their picks
  const { data: entries } = await supabase
    .from('pool_entries')
    .select(`
      *,
      picks:category_picks(
        category_id,
        option:category_options(id, name, is_correct)
      )
    `)
    .eq('pool_id', poolId)
    .order('entry_name')

  // Build a lookup: entry_id -> category_id -> option
  const picksByEntry = {}
  entries?.forEach(entry => {
    picksByEntry[entry.id] = {}
    entry.picks?.forEach(pick => {
      picksByEntry[entry.id][pick.category_id] = pick.option
    })
  })

  return (
    <div style={{ 
      padding: 24,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ marginBottom: 24 }}>
        <Link href={`/pool/${poolId}/standings`} style={{ color: '#3b82f6', fontSize: '14px' }}>
          ← Back to Standings
        </Link>
      </div>

      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
        📊 {pool.name} — All Picks
      </h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        {pool.event.name}
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          borderCollapse: 'collapse', 
          width: '100%',
          minWidth: entries && entries.length > 3 ? `${300 + (entries.length * 100)}px` : '100%',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ 
                padding: '12px 16px', 
                textAlign: 'left', 
                borderBottom: '2px solid #e5e7eb',
                position: 'sticky',
                left: 0,
                background: '#f3f4f6',
                minWidth: '200px'
              }}>
                Category
              </th>
              {entries?.map(entry => (
                <th key={entry.id} style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center',
                  borderBottom: '2px solid #e5e7eb',
                  minWidth: '100px'
                }}>
                  {entry.entry_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories?.map((category, idx) => {
              const correctOption = category.options?.find(o => o.is_correct)
              
              return (
                <tr key={category.id} style={{ background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                  <td style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid #e5e7eb',
                    position: 'sticky',
                    left: 0,
                    background: idx % 2 === 0 ? 'white' : '#f9fafb',
                    fontWeight: 500
                  }}>
                    {category.name}
                    {correctOption && (
                      <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>
                        ✓ {correctOption.name}
                      </div>
                    )}
                  </td>
                  {entries?.map(entry => {
                    const pick = picksByEntry[entry.id]?.[category.id]
                    const isCorrect = pick?.is_correct
                    const hasResult = correctOption !== undefined
                    
                    return (
                      <td key={entry.id} style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        borderBottom: '1px solid #e5e7eb',
                        background: hasResult 
                          ? (isCorrect ? '#dcfce7' : '#fee2e2')
                          : 'transparent'
                      }}>
                        {pick ? (
                          <span style={{ 
                            color: hasResult 
                              ? (isCorrect ? '#16a34a' : '#dc2626')
                              : '#333'
                          }}>
                            {isCorrect && '✓ '}
                            {pick.name}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '24px', padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '14px' }}>Legend</h3>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
          <span><span style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>Green</span> = Correct</span>
          <span><span style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>Red</span> = Wrong</span>
        </div>
      </div>
    </div>
  )
}
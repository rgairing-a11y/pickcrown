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
    .select('*, event:events(id, name, year, start_time, season_id, event_type, season:seasons(id, name))')
    .eq('id', poolId)
    .single()

  if (!pool) {
    return <div style={{ padding: 24 }}>Pool not found</div>
  }

  const { data: standings } = await supabase
    .rpc('calculate_standings', { p_pool_id: poolId })

  const season = pool.event?.season
  const isLocked = new Date(pool.event.start_time) < new Date()

  // Get Popular Picks data (only if locked)
  let popularPicks = []
  if (isLocked && pool.event?.event_type !== 'bracket') {
    // Get categories with options
    const { data: categories } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        order_index,
        options:category_options(id, name, is_correct)
      `)
      .eq('event_id', pool.event.id)
      .order('order_index')

    // Get all picks for this pool
    const { data: entries } = await supabase
      .from('pool_entries')
      .select('id')
      .eq('pool_id', poolId)

    const entryIds = entries?.map(e => e.id) || []

    if (entryIds.length > 0) {
      const { data: picks } = await supabase
        .from('category_picks')
        .select('category_id, option_id')
        .in('pool_entry_id', entryIds)

      // Calculate distribution per category
      popularPicks = (categories || []).map(category => {
        const categoryPicks = picks?.filter(p => p.category_id === category.id) || []
        const totalPicks = categoryPicks.length

        const optionCounts = category.options.map(option => {
          const count = categoryPicks.filter(p => p.option_id === option.id).length
          const percentage = totalPicks > 0 ? Math.round((count / totalPicks) * 100) : 0
          return {
            id: option.id,
            name: option.name,
            count,
            percentage,
            isCorrect: option.is_correct
          }
        })

        // Sort by percentage descending
        optionCounts.sort((a, b) => b.percentage - a.percentage)

        return {
          id: category.id,
          name: category.name,
          totalPicks,
          options: optionCounts
        }
      })
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1>{pool.name} — Standings</h1>
      <h2>{pool.event?.name} {pool.event?.year}</h2>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: 24 }}>
        {season && (
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
        )}

        {isLocked && (
          <Link
            href={`/pool/${poolId}/picks`}
            style={{
              display: 'inline-block',
              padding: '12px 20px',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            📊 View All Picks
          </Link>
        )}
      </div>

      {/* Standings Table */}
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

      {/* Popular Picks Section */}
      {isLocked && popularPicks.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: '20px', marginBottom: 24 }}>📊 Popular Picks</h2>
          
          {popularPicks.map(category => (
            <div 
              key={category.id} 
              style={{ 
                marginBottom: 32,
                padding: 20,
                background: '#f9fafb',
                borderRadius: 8
              }}
            >
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                marginBottom: 16,
                color: '#374151'
              }}>
                {category.name}
              </h3>
              
              {category.options.map(option => (
                <div key={option.id} style={{ marginBottom: 12 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    fontSize: '14px'
                  }}>
                    <span style={{ 
                      fontWeight: option.isCorrect ? 'bold' : 'normal',
                      color: option.isCorrect ? '#16a34a' : '#374151'
                    }}>
                      {option.name}
                      {option.isCorrect && ' ✓'}
                    </span>
                    <span style={{ 
                      color: '#6b7280',
                      fontWeight: option.percentage >= 50 ? 'bold' : 'normal'
                    }}>
                      {option.percentage}%
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{ 
                    height: 8,
                    background: '#e5e7eb',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${option.percentage}%`,
                      background: option.isCorrect 
                        ? '#22c55e' 
                        : option.percentage >= 50 
                          ? '#3b82f6' 
                          : '#9ca3af',
                      borderRadius: 4,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
              
              <div style={{ 
                marginTop: 12, 
                fontSize: '12px', 
                color: '#9ca3af' 
              }}>
                {category.totalPicks} pick{category.totalPicks !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href={`/pool/${poolId}`} style={{ color: '#3b82f6' }}>
          ← Back to Pool
        </Link>
      </div>
    </div>
  )
}
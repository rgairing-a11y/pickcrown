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

  const eventType = pool.event.event_type || 'bracket'

  // Get all entries
  const { data: entries } = await supabase
    .from('pool_entries')
    .select('*')
    .eq('pool_id', poolId)
    .order('entry_name')

  let rows = []
  let picksByEntry = {}

  if (eventType === 'bracket') {
    // BRACKET EVENT: Get rounds first to establish ordering
    const { data: rounds } = await supabase
      .from('rounds')
      .select('id, name, round_order, points')
      .eq('event_id', pool.event.id)
      .order('round_order')

    // Create round order lookup
    const roundOrderMap = {}
    rounds?.forEach((r, idx) => {
      roundOrderMap[r.id] = { order: r.round_order || idx, name: r.name, points: r.points }
    })

    // Get matchups with teams
    const { data: matchups } = await supabase
      .from('matchups')
      .select(`
        *,
        team_a:teams!matchups_team_a_id_fkey(id, name, seed),
        team_b:teams!matchups_team_b_id_fkey(id, name, seed),
        winner:teams!matchups_winner_team_id_fkey(id, name)
      `)
      .eq('event_id', pool.event.id)

    // Sort matchups by round_order
    const sortedMatchups = (matchups || []).sort((a, b) => {
      const orderA = roundOrderMap[a.round_id]?.order ?? 999
      const orderB = roundOrderMap[b.round_id]?.order ?? 999
      return orderA - orderB
    })

    // Get bracket picks for all entries
    const { data: bracketPicks } = await supabase
      .from('bracket_picks')
      .select(`
        *,
        team:teams(id, name)
      `)
      .in('pool_entry_id', entries?.map(e => e.id) || [])

    // Build lookup: entry_id -> matchup_id -> team
    entries?.forEach(entry => {
      picksByEntry[entry.id] = {}
    })
    bracketPicks?.forEach(pick => {
      picksByEntry[pick.pool_entry_id][pick.matchup_id] = pick.team
    })

    // Build rows from sorted matchups
    rows = sortedMatchups.map(m => ({
      id: m.id,
      roundName: roundOrderMap[m.round_id]?.name || 'Round',
      roundOrder: roundOrderMap[m.round_id]?.order ?? 999,
      points: roundOrderMap[m.round_id]?.points || 1,
      name: `${roundOrderMap[m.round_id]?.name || 'Round'}: ${m.team_a?.seed ? `(${m.team_a.seed}) ` : ''}${m.team_a?.name || 'TBD'} vs ${m.team_b?.seed ? `(${m.team_b.seed}) ` : ''}${m.team_b?.name || 'TBD'}`,
      correctAnswer: m.winner?.name,
      correctId: m.winner?.id,
      options: [m.team_a, m.team_b].filter(Boolean)
    }))

  } else {
    // PICK-ONE / HYBRID EVENT: Get categories and category_picks
    const { data: categories } = await supabase
      .from('categories')
      .select(`
        *,
        options:category_options(*)
      `)
      .eq('event_id', pool.event.id)
      .order('order_index')

    // Get category picks for all entries
    const { data: categoryPicks } = await supabase
      .from('category_picks')
      .select(`
        *,
        option:category_options(id, name, is_correct)
      `)
      .in('pool_entry_id', entries?.map(e => e.id) || [])

    // Build lookup: entry_id -> category_id -> option
    entries?.forEach(entry => {
      picksByEntry[entry.id] = {}
    })
    categoryPicks?.forEach(pick => {
      picksByEntry[pick.pool_entry_id][pick.category_id] = pick.option
    })

    // Build rows from categories
    rows = categories?.map(c => {
      const correctOption = c.options?.find(o => o.is_correct)
      return {
        id: c.id,
        name: c.name,
        correctAnswer: correctOption?.name,
        correctId: correctOption?.id,
        options: c.options
      }
    }) || []
  }

  // Group rows by round for bracket events
  const groupedByRound = eventType === 'bracket'
    ? rows.reduce((acc, row) => {
        const roundName = row.roundName || 'Round'
        if (!acc[roundName]) {
          acc[roundName] = { name: roundName, order: row.roundOrder, points: row.points, rows: [] }
        }
        acc[roundName].rows.push(row)
        return acc
      }, {})
    : null

  const roundGroups = groupedByRound 
    ? Object.values(groupedByRound).sort((a, b) => a.order - b.order)
    : null

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

      {rows.length === 0 ? (
        <p style={{ color: '#666' }}>No picks to display yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            borderCollapse: 'collapse', 
            width: '100%',
            minWidth: entries && entries.length > 3 ? `${300 + (entries.length * 120)}px` : '100%',
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
                  {eventType === 'bracket' ? 'Matchup' : 'Category'}
                </th>
                {entries?.map(entry => (
                  <th key={entry.id} style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center',
                    borderBottom: '2px solid #e5e7eb',
                    minWidth: '120px'
                  }}>
                    {entry.entry_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eventType === 'bracket' && roundGroups ? (
                // Grouped by round for bracket events
                roundGroups.map((group, groupIdx) => (
                  <>
                    {/* Round Header Row */}
                    <tr key={`header-${group.name}`} style={{ background: '#e0e7ff' }}>
                      <td 
                        colSpan={1 + (entries?.length || 0)} 
                        style={{ 
                          padding: '10px 16px',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: '#4338ca',
                          borderBottom: '1px solid #c7d2fe',
                          position: 'sticky',
                          left: 0,
                          background: '#e0e7ff'
                        }}
                      >
                        {group.name} 
                        <span style={{ 
                          marginLeft: 8, 
                          fontWeight: 500, 
                          fontSize: '12px',
                          color: '#6366f1' 
                        }}>
                          ({group.points} pt{group.points !== 1 ? 's' : ''} each)
                        </span>
                      </td>
                    </tr>
                    {/* Matchup Rows */}
                    {group.rows.map((row, idx) => {
                      const globalIdx = rows.findIndex(r => r.id === row.id)
                      return (
                        <tr key={row.id} style={{ background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <td style={{ 
                            padding: '12px 16px', 
                            borderBottom: '1px solid #e5e7eb',
                            position: 'sticky',
                            left: 0,
                            background: idx % 2 === 0 ? 'white' : '#f9fafb',
                            fontWeight: 500
                          }}>
                            {/* Show just teams, not round name since it's in header */}
                            {row.options?.[0]?.seed ? `(${row.options[0].seed}) ` : ''}{row.options?.[0]?.name || 'TBD'} vs {row.options?.[1]?.seed ? `(${row.options[1].seed}) ` : ''}{row.options?.[1]?.name || 'TBD'}
                            {row.correctAnswer && (
                              <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>
                                ✓ {row.correctAnswer}
                              </div>
                            )}
                          </td>
                          {entries?.map(entry => {
                            const pick = picksByEntry[entry.id]?.[row.id]
                            const pickName = pick?.name
                            const isCorrect = pick?.id === row.correctId
                            const hasResult = row.correctAnswer !== undefined
                            
                            return (
                              <td key={entry.id} style={{ 
                                padding: '12px 16px', 
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                background: hasResult 
                                  ? (isCorrect ? '#dcfce7' : '#fee2e2')
                                  : 'transparent'
                              }}>
                                {pickName ? (
                                  <span style={{ 
                                    color: hasResult 
                                      ? (isCorrect ? '#16a34a' : '#dc2626')
                                      : '#333'
                                  }}>
                                    {isCorrect && '✓ '}
                                    {pickName}
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
                  </>
                ))
              ) : (
                // Flat list for category events
                rows.map((row, idx) => (
                  <tr key={row.id} style={{ background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ 
                      padding: '12px 16px', 
                      borderBottom: '1px solid #e5e7eb',
                      position: 'sticky',
                      left: 0,
                      background: idx % 2 === 0 ? 'white' : '#f9fafb',
                      fontWeight: 500
                    }}>
                      {row.name}
                      {row.correctAnswer && (
                        <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>
                          ✓ {row.correctAnswer}
                        </div>
                      )}
                    </td>
                    {entries?.map(entry => {
                      const pick = picksByEntry[entry.id]?.[row.id]
                      const pickName = pick?.name
                      const isCorrect = pick?.is_correct
                      const hasResult = row.correctAnswer !== undefined
                      
                      return (
                        <td key={entry.id} style={{ 
                          padding: '12px 16px', 
                          textAlign: 'center',
                          borderBottom: '1px solid #e5e7eb',
                          background: hasResult 
                            ? (isCorrect ? '#dcfce7' : '#fee2e2')
                            : 'transparent'
                        }}>
                          {pickName ? (
                            <span style={{ 
                              color: hasResult 
                                ? (isCorrect ? '#16a34a' : '#dc2626')
                                : '#333'
                            }}>
                              {isCorrect && '✓ '}
                              {pickName}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

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

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
  let bracketPopularPicks = []

  if (isLocked && pool.event?.event_type !== 'bracket') {
    // Get categories with options (for pick-one/hybrid)
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

  // Get Bracket Popular Picks (for bracket/hybrid events)
  if (isLocked && (pool.event?.event_type === 'bracket' || pool.event?.event_type === 'hybrid')) {
    // Get rounds
    const { data: rounds } = await supabase
      .from('rounds')
      .select('id, name, round_number, points')
      .eq('event_id', pool.event.id)
      .order('round_number')

    // Get matchups with teams
    const { data: matchups } = await supabase
      .from('matchups')
      .select(`
        id,
        round_id,
        winner_team_id,
        team_a:teams!matchups_team_a_id_fkey(id, name, seed),
        team_b:teams!matchups_team_b_id_fkey(id, name, seed)
      `)
      .eq('event_id', pool.event.id)

    // Get all entries for this pool
    const { data: entries } = await supabase
      .from('pool_entries')
      .select('id')
      .eq('pool_id', poolId)

    const entryIds = entries?.map(e => e.id) || []

    if (entryIds.length > 0 && matchups && matchups.length > 0) {
      // Get all bracket picks
      const { data: bracketPicks } = await supabase
        .from('bracket_picks')
        .select('matchup_id, picked_team_id')
        .in('pool_entry_id', entryIds)

      // Group matchups by round
      bracketPopularPicks = (rounds || []).map(round => {
        const roundMatchups = matchups.filter(m => m.round_id === round.id)

        const matchupStats = roundMatchups.map(matchup => {
          const matchupPicks = bracketPicks?.filter(p => p.matchup_id === matchup.id) || []
          const totalPicks = matchupPicks.length

          const teamAPicks = matchupPicks.filter(p => p.picked_team_id === matchup.team_a?.id).length
          const teamBPicks = matchupPicks.filter(p => p.picked_team_id === matchup.team_b?.id).length

          const teamAPercentage = totalPicks > 0 ? Math.round((teamAPicks / totalPicks) * 100) : 0
          const teamBPercentage = totalPicks > 0 ? Math.round((teamBPicks / totalPicks) * 100) : 0

          const formatTeam = (team) => {
            if (!team) return 'TBD'
            return team.seed ? `#${team.seed} ${team.name}` : team.name
          }

          return {
            id: matchup.id,
            teamA: {
              id: matchup.team_a?.id,
              name: formatTeam(matchup.team_a),
              picks: teamAPicks,
              percentage: teamAPercentage,
              isWinner: matchup.winner_team_id === matchup.team_a?.id
            },
            teamB: {
              id: matchup.team_b?.id,
              name: formatTeam(matchup.team_b),
              picks: teamBPicks,
              percentage: teamBPercentage,
              isWinner: matchup.winner_team_id === matchup.team_b?.id
            },
            totalPicks,
            hasResult: !!matchup.winner_team_id
          }
        })

        return {
          id: round.id,
          name: round.name,
          points: round.points,
          matchups: matchupStats
        }
      }).filter(round => round.matchups.length > 0)
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

        <a
          href={`/api/pools/${poolId}/export`}
          download
          style={{
            display: 'inline-block',
            padding: '12px 20px',
            background: '#6b7280',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          📥 Export CSV
        </a>
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

      {/* Popular Picks Section (Pick-One/Hybrid) */}
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

      {/* Bracket Popular Picks Section */}
      {isLocked && bracketPopularPicks.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: '20px', marginBottom: 24 }}>🏆 Popular Bracket Picks</h2>
          
          {bracketPopularPicks.map(round => (
            <div key={round.id} style={{ marginBottom: 32 }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                marginBottom: 16,
                color: '#374151',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{round.name}</span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  padding: '4px 12px',
                  background: '#dcfce7',
                  color: '#166534',
                  borderRadius: 12
                }}>
                  {round.points} pt{round.points !== 1 ? 's' : ''} each
                </span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {round.matchups.map(matchup => (
                  <div 
                    key={matchup.id}
                    style={{
                      padding: 16,
                      background: '#f9fafb',
                      borderRadius: 8,
                      border: matchup.hasResult ? '1px solid #e5e7eb' : '1px dashed #d1d5db'
                    }}
                  >
                    {/* Team A */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: 4,
                        fontSize: '14px'
                      }}>
                        <span style={{ 
                          fontWeight: matchup.teamA.isWinner ? 'bold' : 'normal',
                          color: matchup.teamA.isWinner ? '#16a34a' : '#374151'
                        }}>
                          {matchup.teamA.name}
                          {matchup.teamA.isWinner && ' ✓'}
                        </span>
                        <span style={{ 
                          color: '#6b7280',
                          fontWeight: matchup.teamA.percentage > matchup.teamB.percentage ? 'bold' : 'normal'
                        }}>
                          {matchup.teamA.percentage}%
                        </span>
                      </div>
                      <div style={{ 
                        height: 6,
                        background: '#e5e7eb',
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${matchup.teamA.percentage}%`,
                          background: matchup.teamA.isWinner 
                            ? '#22c55e' 
                            : matchup.teamA.percentage > matchup.teamB.percentage 
                              ? '#3b82f6' 
                              : '#9ca3af',
                          borderRadius: 3
                        }} />
                      </div>
                    </div>

                    {/* VS divider */}
                    <div style={{ 
                      textAlign: 'center', 
                      fontSize: '11px', 
                      color: '#9ca3af',
                      margin: '4px 0'
                    }}>
                      vs
                    </div>

                    {/* Team B */}
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: 4,
                        fontSize: '14px'
                      }}>
                        <span style={{ 
                          fontWeight: matchup.teamB.isWinner ? 'bold' : 'normal',
                          color: matchup.teamB.isWinner ? '#16a34a' : '#374151'
                        }}>
                          {matchup.teamB.name}
                          {matchup.teamB.isWinner && ' ✓'}
                        </span>
                        <span style={{ 
                          color: '#6b7280',
                          fontWeight: matchup.teamB.percentage > matchup.teamA.percentage ? 'bold' : 'normal'
                        }}>
                          {matchup.teamB.percentage}%
                        </span>
                      </div>
                      <div style={{ 
                        height: 6,
                        background: '#e5e7eb',
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${matchup.teamB.percentage}%`,
                          background: matchup.teamB.isWinner 
                            ? '#22c55e' 
                            : matchup.teamB.percentage > matchup.teamA.percentage 
                              ? '#3b82f6' 
                              : '#9ca3af',
                          borderRadius: 3
                        }} />
                      </div>
                    </div>

                    {/* Total picks */}
                    <div style={{ 
                      marginTop: 8, 
                      fontSize: '11px', 
                      color: '#9ca3af',
                      textAlign: 'right'
                    }}>
                      {matchup.totalPicks} pick{matchup.totalPicks !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
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
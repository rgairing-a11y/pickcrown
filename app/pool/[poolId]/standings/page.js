export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import ScenarioSimulator from '../../../../components/ScenarioSimulator'
import MyPicksButton from '../../../../components/MyPicksButton'

// Use service role key for full data access, fallback to anon
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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

  // Get Bracket Popular Picks (check if event has matchups, regardless of event_type)
  if (isLocked) {
    // Get rounds
    const { data: rounds } = await supabase
      .from('rounds')
      .select('id, name, round_order, points')
      .eq('event_id', pool.event.id)
      .order('round_order')

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

    // Only proceed if there are matchups (this is a bracket event)
    if (matchups && matchups.length > 0) {
      // Get all entries for this pool
      const { data: entries } = await supabase
        .from('pool_entries')
        .select('id')
        .eq('pool_id', poolId)

      const entryIds = entries?.map(e => e.id) || []

      if (entryIds.length > 0) {
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
  }

  // Calculate Champion Status (for bracket events)
  let championStatus = {}
  let eliminatedTeams = new Set()
  let remainingMatchups = 0
  let pathToVictory = []
  let maxPotentialByEntry = {}
  let allBracketPicks = []
  let simulatorMatchups = []
  let simulatorRoundPoints = {}
  let simulatorRoundNames = {}
  let myPicksEntries = []
  
  if (isLocked) {
    // Get all matchups to find eliminated teams
    const { data: allMatchups } = await supabase
      .from('matchups')
      .select('id, team_a_id, team_b_id, winner_team_id, round_id')
      .eq('event_id', pool.event.id)

    // Get rounds for point values
    const { data: roundsData } = await supabase
      .from('rounds')
      .select('id, name, points')
      .eq('event_id', pool.event.id)

    const roundPoints = {}
    const roundNames = {}
    roundsData?.forEach(r => { 
      roundPoints[r.id] = r.points 
      roundNames[r.id] = r.name
    })

    if (allMatchups && allMatchups.length > 0) {
      // Find eliminated teams (lost a matchup)
      allMatchups.forEach(m => {
        if (m.winner_team_id) {
          // The loser is eliminated
          const loserId = m.winner_team_id === m.team_a_id ? m.team_b_id : m.team_a_id
          eliminatedTeams.add(loserId)
        } else {
          remainingMatchups++
        }
      })

      // Get remaining matchups (no winner yet)
      const undecidedMatchups = allMatchups.filter(m => !m.winner_team_id)

      // Get all entries with their bracket picks (including email for MyPicks)
      const { data: entries } = await supabase
        .from('pool_entries')
        .select('id, entry_name, email')
        .eq('pool_id', poolId)

      if (entries && entries.length > 0) {
        const entryIds = entries.map(e => e.id)
        
        // Get bracket picks for all entries
        const { data: allPicks } = await supabase
          .from('bracket_picks')
          .select('pool_entry_id, picked_team_id, matchup_id')
          .in('pool_entry_id', entryIds)

        // Store for scenario simulator
        allBracketPicks = allPicks || []
        simulatorRoundPoints = roundPoints
        simulatorRoundNames = roundNames
        myPicksEntries = entries || []
        
        // Get matchups with team details for simulator
        const { data: matchupsWithTeams } = await supabase
          .from('matchups')
          .select(`
            id,
            round_id,
            winner_team_id,
            team_a:teams!matchups_team_a_id_fkey(id, name, seed),
            team_b:teams!matchups_team_b_id_fkey(id, name, seed)
          `)
          .eq('event_id', pool.event.id)
        
        simulatorMatchups = matchupsWithTeams || []

        // For each entry, calculate status and potential
        entries.forEach(entry => {
          const entryPicks = allPicks?.filter(p => p.pool_entry_id === entry.id) || []
          
          // Get picks for matchups that haven't been decided yet
          const remainingPicks = entryPicks.filter(pick => {
            const matchup = allMatchups.find(m => m.id === pick.matchup_id)
            return matchup && !matchup.winner_team_id
          })
          
          // Count how many of those picks are for teams still alive
          const alivePicks = remainingPicks.filter(pick => !eliminatedTeams.has(pick.picked_team_id))
          
          championStatus[entry.id] = {
            totalRemaining: remainingPicks.length,
            aliveCount: alivePicks.length,
            isEliminated: remainingPicks.length > 0 && alivePicks.length === 0
          }

          // Calculate max potential points
          let potentialPoints = 0
          alivePicks.forEach(pick => {
            const matchup = allMatchups.find(m => m.id === pick.matchup_id)
            if (matchup) {
              potentialPoints += roundPoints[matchup.round_id] || 0
            }
          })
          
          maxPotentialByEntry[entry.id] = potentialPoints
        })

        // Calculate path to victory for each entry
        const sortedStandings = [...(standings || [])].sort((a, b) => b.total_points - a.total_points)
        
        // Check if we have any potential data
        const hasPotentialData = Object.values(maxPotentialByEntry).some(v => v > 0)
        
        if (sortedStandings.length > 0 && undecidedMatchups.length > 0) {
          const leader = sortedStandings[0]
          const leaderPotential = maxPotentialByEntry[leader.entry_id] || 0
          const leaderMax = leader.total_points + leaderPotential

          sortedStandings.forEach((entry, idx) => {
            const myPotential = maxPotentialByEntry[entry.entry_id] || 0
            const myMax = entry.total_points + myPotential
            const gap = leader.total_points - entry.total_points

            if (idx === 0) {
              // Leader
              const secondPlace = sortedStandings[1]
              if (secondPlace) {
                const leadOverSecond = entry.total_points - secondPlace.total_points
                const secondMax = secondPlace.total_points + (maxPotentialByEntry[secondPlace.entry_id] || 0)
                // Only show "clinched" if we have pick data AND leader's current > secondMax
                const hasClinched = hasPotentialData && (entry.total_points >= secondMax)
                
                let leaderMessage
                if (hasClinched) {
                  leaderMessage = '🏆 Clinched victory!'
                } else if (leadOverSecond === 0) {
                  leaderMessage = hasPotentialData 
                    ? `Tied for 1st. Max possible: ${leaderMax} pts.`
                    : 'Tied for 1st place.'
                } else {
                  leaderMessage = hasPotentialData
                    ? `Leading by ${leadOverSecond}. Max possible: ${leaderMax} pts.`
                    : `Leading by ${leadOverSecond}.`
                }
                
                pathToVictory.push({
                  entry_id: entry.entry_id,
                  entry_name: entry.entry_name,
                  status: hasClinched ? 'clinched' : 'leading',
                  message: leaderMessage,
                  potentialPoints: myPotential,
                  maxTotal: myMax,
                  canWin: true
                })
              }
            } else {
              // Challengers
              const canCatchUp = !hasPotentialData || myMax >= leader.total_points
              
              pathToVictory.push({
                entry_id: entry.entry_id,
                entry_name: entry.entry_name,
                status: !canCatchUp ? 'eliminated' : gap === 0 ? 'tied' : 'chasing',
                message: !canCatchUp 
                  ? '❌ Cannot catch the leader'
                  : hasPotentialData
                    ? `${gap} pts behind. Can earn up to ${myPotential} more pts.`
                    : `${gap} pts behind.`,
                potentialPoints: myPotential,
                maxTotal: myMax,
                canWin: canCatchUp
              })
            }
          })
        }
      }
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

        {/* My Picks first */}
        {isLocked && simulatorMatchups.length > 0 && (
          <MyPicksButton
            poolEntries={myPicksEntries}
            bracketPicks={allBracketPicks}
            matchups={simulatorMatchups}
            roundNames={simulatorRoundNames}
          />
        )}

        {/* All Picks second */}
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

      {/* Standings Table with Podium */}
      {standings?.length > 0 && (
        <>
          {/* Podium for Top 3 (using actual ranks for ties) */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-end',
            gap: 16,
            marginTop: 32,
            marginBottom: 32,
            padding: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 16
          }}>
            {/* Silver - rank 2 */}
            {standings.filter(s => s.rank === 2).map((entry, idx) => (
              <div key={entry.entry_id} style={{ textAlign: 'center', order: 1 }}>
                <div style={{ fontSize: 40 }}>🥈</div>
                <div style={{
                  background: '#e5e7eb',
                  padding: '20px 24px',
                  borderRadius: '12px 12px 0 0',
                  minWidth: 100,
                  height: 80
                }}>
                  <div style={{ fontWeight: 'bold', color: '#374151', fontSize: 14 }}>{entry.entry_name}</div>
                  <div style={{ color: '#6b7280', fontSize: 20, fontWeight: 'bold' }}>{entry.total_points}</div>
                </div>
              </div>
            ))}
            
            {/* Gold - rank 1 */}
            {standings.filter(s => s.rank === 1).map((entry, idx) => (
              <div key={entry.entry_id} style={{ textAlign: 'center', order: 2 }}>
                <div style={{ fontSize: 48 }}>🥇</div>
                <div style={{
                  background: '#fef3c7',
                  padding: '24px 32px',
                  borderRadius: '12px 12px 0 0',
                  minWidth: 120,
                  height: 100,
                  border: '3px solid #f59e0b'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#92400e', fontSize: 16 }}>{entry.entry_name}</div>
                  <div style={{ color: '#d97706', fontSize: 28, fontWeight: 'bold' }}>{entry.total_points}</div>
                </div>
              </div>
            ))}
            
            {/* Bronze - rank 3 */}
            {standings.filter(s => s.rank === 3).map((entry, idx) => (
              <div key={entry.entry_id} style={{ textAlign: 'center', order: 3 }}>
                <div style={{ fontSize: 36 }}>🥉</div>
                <div style={{
                  background: '#fed7aa',
                  padding: '16px 20px',
                  borderRadius: '12px 12px 0 0',
                  minWidth: 90,
                  height: 60
                }}>
                  <div style={{ fontWeight: 'bold', color: '#9a3412', fontSize: 13 }}>{entry.entry_name}</div>
                  <div style={{ color: '#c2410c', fontSize: 18, fontWeight: 'bold' }}>{entry.total_points}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Full Standings Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: 12, textAlign: 'left' }}>Rank</th>
            <th style={{ padding: 12, textAlign: 'left' }}>Entry Name</th>
            {Object.keys(championStatus).length > 0 && remainingMatchups > 0 && (
              <th style={{ padding: 12, textAlign: 'center' }}>Status</th>
            )}
            <th style={{ padding: 12, textAlign: 'right' }}>Points</th>
          </tr>
        </thead>
        <tbody>
          {standings?.map((entry, idx) => {
            const status = championStatus[entry.entry_id]
            const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : ''
            
            return (
              <tr
                key={entry.entry_id}
                style={{
                  borderBottom: '1px solid #ddd',
                  background: entry.rank === 1 ? '#fefce8' : 
                             entry.rank === 2 ? '#f9fafb' : 
                             entry.rank === 3 ? '#fff7ed' : 
                             idx % 2 === 0 ? 'white' : '#f9f9f9'
                }}
              >
                <td style={{ padding: 12 }}>
                  {medal} #{entry.rank}
                </td>
                <td style={{ padding: 12, fontWeight: entry.rank <= 3 ? 'bold' : 'normal' }}>
                  {entry.entry_name}
                </td>
                {Object.keys(championStatus).length > 0 && remainingMatchups > 0 && (
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    {status?.isEliminated ? (
                      <span style={{
                        padding: '4px 10px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        ❌ Eliminated
                      </span>
                    ) : status?.aliveCount > 0 ? (
                      <span style={{
                        padding: '4px 10px',
                        background: '#dcfce7',
                        color: '#16a34a',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        🟢 {status.aliveCount} alive
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
                    )}
                  </td>
                )}
                <td style={{ padding: 12, textAlign: 'right', fontWeight: entry.rank <= 3 ? 'bold' : 'normal' }}>
                  {entry.total_points}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {standings?.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: 24, color: '#666' }}>
          No entries yet
        </p>
      )}

      {/* Path to Victory Section */}
      {isLocked && pathToVictory.length > 0 && remainingMatchups > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: '20px', marginBottom: 8 }}>🛤️ Path to Victory</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
            {remainingMatchups} matchup{remainingMatchups !== 1 ? 's' : ''} remaining
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pathToVictory.map((pv, idx) => (
              <div
                key={pv.entry_id}
                style={{
                  padding: 16,
                  background: pv.status === 'clinched' ? '#dcfce7' :
                             pv.status === 'leading' ? '#fefce8' :
                             pv.status === 'eliminated' ? '#fee2e2' :
                             '#f9fafb',
                  borderRadius: 8,
                  border: pv.status === 'clinched' ? '2px solid #22c55e' :
                         pv.status === 'leading' ? '2px solid #eab308' :
                         '1px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: 16,
                      color: pv.status === 'eliminated' ? '#9ca3af' : '#374151'
                    }}>
                      {idx === 0 ? '👑 ' : ''}{pv.entry_name}
                    </span>
                    <span style={{ 
                      marginLeft: 12, 
                      fontSize: 13,
                      color: pv.status === 'clinched' ? '#16a34a' :
                             pv.status === 'leading' ? '#ca8a04' :
                             pv.status === 'eliminated' ? '#dc2626' :
                             '#6b7280'
                    }}>
                      {pv.message}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Max possible</div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: 18,
                      color: pv.canWin ? '#374151' : '#9ca3af'
                    }}>
                      {pv.maxTotal} pts
                    </div>
                  </div>
                </div>
                
                {/* Potential points bar */}
                {pv.potentialPoints > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ 
                      fontSize: 11, 
                      color: '#6b7280', 
                      marginBottom: 4 
                    }}>
                      +{pv.potentialPoints} potential points remaining
                    </div>
                    <div style={{
                      height: 6,
                      background: '#e5e7eb',
                      borderRadius: 3,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, (pv.potentialPoints / (pathToVictory[0]?.potentialPoints || pv.potentialPoints)) * 100)}%`,
                        background: pv.canWin ? '#3b82f6' : '#9ca3af',
                        borderRadius: 3
                      }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scenario Simulator */}
      {isLocked && remainingMatchups > 0 && simulatorMatchups.length > 0 && (
        <ScenarioSimulator
          matchups={simulatorMatchups.map(m => ({
            id: m.id,
            round_id: m.round_id,
            round: { name: simulatorRoundNames[m.round_id] || 'Round' },
            team_a: m.team_a,
            team_b: m.team_b,
            winner_team_id: m.winner_team_id
          }))}
          entries={standings?.map(s => ({ id: s.entry_id, entry_name: s.entry_name })) || []}
          currentStandings={standings}
          roundPoints={simulatorRoundPoints}
          bracketPicks={allBracketPicks}
        />
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

      {/* Bracket Popular Picks Section - Only show undecided matchups with known teams */}
      {isLocked && bracketPopularPicks.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: '20px', marginBottom: 24 }}>🏆 Popular Bracket Picks</h2>
          
          {bracketPopularPicks.map(round => {
            // Filter to only show matchups that are undecided AND have both teams known
            const pendingMatchups = round.matchups.filter(m => 
              !m.hasResult && 
              m.teamA.name !== 'TBD' && 
              m.teamB.name !== 'TBD' &&
              m.teamA.id && 
              m.teamB.id
            )
            
            // Skip this round if no pending matchups
            if (pendingMatchups.length === 0) return null
            
            return (
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
                {pendingMatchups.map(matchup => (
                  <div 
                    key={matchup.id}
                    style={{
                      padding: 16,
                      background: '#f9fafb',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb'
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
            )
          })}
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
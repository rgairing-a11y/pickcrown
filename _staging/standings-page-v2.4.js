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
    return (
      <div style={{ 
        padding: 'var(--spacing-6)', 
        maxWidth: 500, 
        margin: '48px auto',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-4)' }}>😕</div>
        <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Pool not found</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>
          This pool doesn't exist or you don't have access
        </p>
        <Link href="/" style={{
          display: 'inline-block',
          padding: 'var(--spacing-3) var(--spacing-5)',
          background: 'var(--color-primary)',
          color: 'white',
          borderRadius: 'var(--radius-lg)',
          textDecoration: 'none',
          fontWeight: 'var(--font-semibold)'
        }}>
          Go Home
        </Link>
      </div>
    )
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

      // Get all pool entries with their bracket picks
      const { data: entriesWithPicks } = await supabase
        .from('pool_entries')
        .select(`
          id,
          email,
          entry_name,
          bracket_picks(matchup_id, picked_team_id, picked_team:teams(id, name, seed))
        `)
        .eq('pool_id', poolId)

      // Store for MyPicksButton
      myPicksEntries = entriesWithPicks || []

      // Flatten all bracket picks for MyPicksButton
      entriesWithPicks?.forEach(entry => {
        entry.bracket_picks?.forEach(pick => {
          allBracketPicks.push({
            ...pick,
            pool_entry_id: entry.id
          })
        })
      })

      // Store matchups and round info for simulator
      simulatorMatchups = allMatchups
      simulatorRoundPoints = roundPoints
      simulatorRoundNames = roundNames

      // Calculate champion status for each entry
      entriesWithPicks?.forEach(entry => {
        const picks = entry.bracket_picks || []
        const pickedTeamIds = new Set(picks.map(p => p.picked_team_id))
        
        // Count how many of their picks are still alive
        let aliveCount = 0
        let eliminatedCount = 0
        
        pickedTeamIds.forEach(teamId => {
          if (eliminatedTeams.has(teamId)) {
            eliminatedCount++
          } else if (teamId) {
            aliveCount++
          }
        })

        // Check if entry's champion pick (final round) is still alive
        // Find final round matchup
        const maxRoundOrder = Math.max(...roundsData.map(r => r.round_order || 0))
        const finalRound = roundsData.find(r => r.round_order === maxRoundOrder)
        const finalMatchup = finalRound ? allMatchups.find(m => m.round_id === finalRound.id) : null
        
        let championPick = null
        if (finalMatchup) {
          const finalPick = picks.find(p => p.matchup_id === finalMatchup.id)
          if (finalPick) {
            championPick = finalPick.picked_team_id
          }
        }

        const championEliminated = championPick && eliminatedTeams.has(championPick)

        championStatus[entry.id] = {
          aliveCount,
          eliminatedCount,
          championPick,
          isEliminated: championEliminated
        }

        // Calculate max potential points
        let potentialPoints = 0
        picks.forEach(pick => {
          const matchup = allMatchups.find(m => m.id === pick.matchup_id)
          if (matchup && !matchup.winner_team_id && !eliminatedTeams.has(pick.picked_team_id)) {
            // This pick could still be correct
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

  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: 800, margin: '0 auto' }}>
      {/* Header Card */}
      <div style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        padding: 'var(--spacing-6)',
        marginBottom: 'var(--spacing-6)',
        border: '1px solid var(--color-border-light)'
      }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: 'var(--spacing-4)' }}>
          <Link href={`/pool/${poolId}`} style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-1)'
          }}>
            ← Back to Pool
          </Link>
        </nav>

        {/* Title */}
        <h1 style={{ 
          fontSize: 'var(--font-size-3xl)', 
          fontWeight: 'var(--font-bold)',
          marginBottom: 'var(--spacing-2)',
          color: 'var(--color-text)'
        }}>
          {pool.name}
        </h1>
        <h2 style={{ 
          fontSize: 'var(--font-size-lg)', 
          fontWeight: 'var(--font-normal)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-4)'
        }}>
          {pool.event?.name} {pool.event?.year}
        </h2>

        {/* Quick Stats */}
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-8)',
          paddingTop: 'var(--spacing-4)',
          borderTop: '1px solid var(--color-border-light)'
        }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
              {standings?.length || 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              {standings?.length === 1 ? 'Entry' : 'Entries'}
            </div>
          </div>
          {standings?.[0]?.total_points > 0 && (
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-warning)' }}>
                {standings[0].total_points}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Top Score</div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap', marginBottom: 'var(--spacing-6)' }}>
        {season && (
          <Link
            href={`/season/${season.id}/standings`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              padding: 'var(--spacing-3) var(--spacing-5)',
              background: 'var(--color-warning)',
              color: 'var(--color-text)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--font-size-base)'
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              padding: 'var(--spacing-3) var(--spacing-5)',
              background: 'var(--color-primary)',
              color: 'white',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--font-size-base)'
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
            gap: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-8)',
            padding: 'var(--spacing-6)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 'var(--radius-xl)'
          }}>
            {/* Silver - rank 2 */}
            {standings.filter(s => s.rank === 2).map((entry, idx) => (
              <div key={entry.entry_id} style={{ textAlign: 'center', order: 1 }}>
                <div style={{ fontSize: 40 }}>🥈</div>
                <div style={{
                  background: 'var(--color-border)',
                  padding: 'var(--spacing-5) var(--spacing-6)',
                  borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                  minWidth: 100,
                  height: 80
                }}>
                  <div style={{ fontWeight: 'var(--font-bold)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}>{entry.entry_name}</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-bold)' }}>{entry.total_points}</div>
                </div>
              </div>
            ))}
            
            {/* Gold - rank 1 */}
            {standings.filter(s => s.rank === 1).map((entry, idx) => (
              <div key={entry.entry_id} style={{ textAlign: 'center', order: 2 }}>
                <div style={{ fontSize: 48 }}>🥇</div>
                <div style={{
                  background: 'var(--color-gold-light)',
                  padding: 'var(--spacing-6) var(--spacing-8)',
                  borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                  minWidth: 120,
                  height: 100,
                  border: '3px solid var(--color-warning)'
                }}>
                  <div style={{ fontWeight: 'var(--font-bold)', color: 'var(--color-warning-dark)', fontSize: 'var(--font-size-lg)' }}>{entry.entry_name}</div>
                  <div style={{ color: 'var(--color-warning)', fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-bold)' }}>{entry.total_points}</div>
                </div>
              </div>
            ))}
            
            {/* Bronze - rank 3 */}
            {standings.filter(s => s.rank === 3).map((entry, idx) => (
              <div key={entry.entry_id} style={{ textAlign: 'center', order: 3 }}>
                <div style={{ fontSize: 36 }}>🥉</div>
                <div style={{
                  background: '#fed7aa',
                  padding: 'var(--spacing-4) var(--spacing-5)',
                  borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                  minWidth: 90,
                  height: 60
                }}>
                  <div style={{ fontWeight: 'var(--font-bold)', color: '#9a3412', fontSize: 'var(--font-size-sm)' }}>{entry.entry_name}</div>
                  <div style={{ color: '#c2410c', fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-bold)' }}>{entry.total_points}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Full Standings Table */}
      <div style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        border: '1px solid var(--color-border-light)',
        marginBottom: 'var(--spacing-8)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-background)' }}>
              <th style={{ 
                padding: 'var(--spacing-4)', 
                textAlign: 'left',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-semibold)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)'
              }}>Rank</th>
              <th style={{ 
                padding: 'var(--spacing-4)', 
                textAlign: 'left',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-semibold)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)'
              }}>Entry</th>
              {Object.keys(championStatus).length > 0 && remainingMatchups > 0 && (
                <th style={{ 
                  padding: 'var(--spacing-4)', 
                  textAlign: 'center',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-semibold)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-muted)'
                }}>Status</th>
              )}
              <th style={{ 
                padding: 'var(--spacing-4)', 
                textAlign: 'right',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-semibold)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)'
              }}>Points</th>
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
                    borderBottom: '1px solid var(--color-border-light)',
                    background: entry.rank === 1 ? 'var(--color-gold-light)' : 
                               entry.rank === 2 ? 'var(--color-background)' : 
                               entry.rank === 3 ? '#fff7ed' : 
                               idx % 2 === 0 ? 'var(--color-white)' : 'var(--color-background)'
                  }}
                >
                  <td style={{ padding: 'var(--spacing-4)', fontWeight: entry.rank <= 3 ? 'var(--font-bold)' : 'var(--font-normal)' }}>
                    {medal} #{entry.rank}
                  </td>
                  <td style={{ padding: 'var(--spacing-4)', fontWeight: entry.rank <= 3 ? 'var(--font-semibold)' : 'var(--font-normal)' }}>
                    {entry.entry_name}
                  </td>
                  {Object.keys(championStatus).length > 0 && remainingMatchups > 0 && (
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                      {status?.isEliminated ? (
                        <span style={{
                          padding: 'var(--spacing-1) var(--spacing-3)',
                          background: 'var(--color-danger-light)',
                          color: 'var(--color-danger)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-semibold)'
                        }}>
                          ❌ Eliminated
                        </span>
                      ) : status?.aliveCount > 0 ? (
                        <span style={{
                          padding: 'var(--spacing-1) var(--spacing-3)',
                          background: 'var(--color-success-light)',
                          color: 'var(--color-success-dark)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-semibold)'
                        }}>
                          🟢 {status.aliveCount} alive
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>—</span>
                      )}
                    </td>
                  )}
                  <td style={{ 
                    padding: 'var(--spacing-4)', 
                    textAlign: 'right', 
                    fontWeight: entry.rank <= 3 ? 'var(--font-bold)' : 'var(--font-normal)',
                    fontSize: entry.rank <= 3 ? 'var(--font-size-lg)' : 'var(--font-size-base)'
                  }}>
                    {entry.total_points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {standings?.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--spacing-12) var(--spacing-6)',
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border-light)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-4)' }}>🏆</div>
          <h3 style={{ marginBottom: 'var(--spacing-2)', color: 'var(--color-text)' }}>No standings yet</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Results will appear here once the event begins</p>
        </div>
      )}

      {/* Path to Victory Section */}
      {isLocked && pathToVictory.length > 0 && remainingMatchups > 0 && (
        <div style={{ marginBottom: 'var(--spacing-8)' }}>
          <h2 style={{ 
            fontSize: 'var(--font-size-xl)', 
            fontWeight: 'var(--font-semibold)',
            marginBottom: 'var(--spacing-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)'
          }}>
            🛤️ Path to Victory
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-4)' }}>
            {remainingMatchups} game{remainingMatchups !== 1 ? 's' : ''} left
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            {pathToVictory.map((pv, idx) => {
              const currentPts = pv.maxTotal - pv.potentialPoints
              const maxLeaderPts = pathToVictory[0]?.maxTotal || pv.maxTotal
              const barWidth = Math.min(100, (pv.maxTotal / maxLeaderPts) * 100)
              const currentWidth = Math.min(100, (currentPts / maxLeaderPts) * 100)
              
              return (
                <div
                  key={pv.entry_id}
                  style={{
                    padding: 'var(--spacing-4)',
                    background: pv.status === 'eliminated' ? 'var(--color-danger-light)' : 'var(--color-white)',
                    borderRadius: 'var(--radius-lg)',
                    border: pv.status === 'clinched' ? '2px solid var(--color-success)' :
                           pv.status === 'leading' ? '2px solid var(--color-warning)' :
                           '1px solid var(--color-border-light)'
                  }}
                >
                  {/* Row 1: Name + Status + Points */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                      <span style={{ 
                        fontWeight: 'var(--font-semibold)', 
                        color: pv.status === 'eliminated' ? 'var(--color-text-muted)' : 'var(--color-text)'
                      }}>
                        {pv.entry_name}
                      </span>
                      {pv.status === 'clinched' && (
                        <span style={{
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          background: 'var(--color-success)',
                          color: 'white',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-semibold)'
                        }}>
                          WINNER
                        </span>
                      )}
                      {pv.status === 'leading' && (
                        <span style={{
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          background: 'var(--color-warning-light)',
                          color: 'var(--color-warning-dark)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-semibold)'
                        }}>
                          LEADER
                        </span>
                      )}
                    </div>
                    <span style={{ 
                      fontWeight: 'var(--font-bold)', 
                      color: pv.status === 'eliminated' ? 'var(--color-text-muted)' : 'var(--color-text)'
                    }}>
                      {currentPts} pts
                    </span>
                  </div>
                  
                  {/* Row 2: Progress bar */}
                  <div style={{ 
                    height: 8, 
                    background: 'var(--color-border-light)', 
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    marginBottom: 'var(--spacing-2)'
                  }}>
                    <div style={{ display: 'flex', height: '100%' }}>
                      <div style={{
                        width: `${currentWidth}%`,
                        background: pv.status === 'eliminated' ? 'var(--color-text-muted)' :
                                   pv.status === 'clinched' ? 'var(--color-success)' :
                                   pv.status === 'leading' ? 'var(--color-warning)' :
                                   'var(--color-primary)',
                        borderRadius: 'var(--radius-full) 0 0 var(--radius-full)'
                      }} />
                      {pv.potentialPoints > 0 && pv.status !== 'eliminated' && (
                        <div style={{
                          width: `${barWidth - currentWidth}%`,
                          background: pv.status === 'clinched' ? '#86efac' :
                                     pv.status === 'leading' ? '#fde68a' :
                                     '#93c5fd',
                          opacity: 0.5
                        }} />
                      )}
                    </div>
                  </div>
                  
                  {/* Row 3: Message */}
                  <div style={{ 
                    fontSize: 'var(--font-size-sm)', 
                    color: pv.status === 'eliminated' ? 'var(--color-danger)' : 'var(--color-text-secondary)'
                  }}>
                    {pv.message}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Scenario Simulator */}
      {isLocked && simulatorMatchups.length > 0 && Object.keys(simulatorRoundPoints).length > 0 && (
        <ScenarioSimulator
          poolId={poolId}
          standings={standings || []}
          undecidedMatchups={simulatorMatchups.filter(m => !m.winner_team_id)}
          allBracketPicks={allBracketPicks}
          roundPoints={simulatorRoundPoints}
          matchups={simulatorMatchups}
          roundNames={simulatorRoundNames}
        />
      )}

      {/* Category Popular Picks Section */}
      {isLocked && popularPicks.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-8)' }}>
          <h2 style={{ 
            fontSize: 'var(--font-size-xl)', 
            fontWeight: 'var(--font-semibold)',
            marginBottom: 'var(--spacing-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)'
          }}>
            📊 Popular Picks
          </h2>
          
          <div style={{
            display: 'grid',
            gap: 'var(--spacing-4)',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
          }}>
            {popularPicks.map(category => (
              <div
                key={category.id}
                style={{
                  background: 'var(--color-white)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--spacing-5)',
                  border: '1px solid var(--color-border-light)',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <h3 style={{ 
                  fontSize: 'var(--font-size-base)', 
                  fontWeight: 'var(--font-semibold)',
                  marginBottom: 'var(--spacing-4)',
                  color: 'var(--color-text)'
                }}>
                  {category.name}
                </h3>
                
                {category.options.slice(0, 5).map(option => (
                  <div key={option.id} style={{ marginBottom: 'var(--spacing-3)' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: 'var(--spacing-1)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      <span style={{ 
                        fontWeight: option.isCorrect ? 'var(--font-semibold)' : 'var(--font-normal)',
                        color: option.isCorrect ? 'var(--color-success)' : 'var(--color-text)'
                      }}>
                        {option.name}
                        {option.isCorrect && ' ✓'}
                      </span>
                      <span style={{ 
                        color: 'var(--color-text-muted)',
                        fontWeight: option.percentage >= 50 ? 'var(--font-semibold)' : 'var(--font-normal)'
                      }}>
                        {option.percentage}%
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{ 
                      height: 6,
                      background: 'var(--color-border-light)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${option.percentage}%`,
                        background: option.isCorrect 
                          ? 'var(--color-success)' 
                          : option.percentage >= 50 
                            ? 'var(--color-primary)' 
                            : 'var(--color-text-muted)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
                
                <div style={{ 
                  marginTop: 'var(--spacing-3)', 
                  fontSize: 'var(--font-size-xs)', 
                  color: 'var(--color-text-muted)' 
                }}>
                  {category.totalPicks} pick{category.totalPicks !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bracket Popular Picks Section - Only show undecided matchups with known teams */}
      {isLocked && bracketPopularPicks.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-8)' }}>
          <h2 style={{ 
            fontSize: 'var(--font-size-xl)', 
            fontWeight: 'var(--font-semibold)',
            marginBottom: 'var(--spacing-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)'
          }}>
            🏆 Popular Bracket Picks
          </h2>
          
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
            <div key={round.id} style={{ marginBottom: 'var(--spacing-6)' }}>
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-semibold)', 
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-text)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{round.name}</span>
                <span style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-medium)',
                  padding: 'var(--spacing-1) var(--spacing-3)',
                  background: 'var(--color-success-light)',
                  color: 'var(--color-success-dark)',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {round.points} pt{round.points !== 1 ? 's' : ''} each
                </span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                {pendingMatchups.map(matchup => (
                  <div 
                    key={matchup.id}
                    style={{
                      padding: 'var(--spacing-4)',
                      background: 'var(--color-white)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border-light)'
                    }}
                  >
                    {/* Team A */}
                    <div style={{ marginBottom: 'var(--spacing-2)' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: 'var(--spacing-1)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        <span style={{ 
                          fontWeight: matchup.teamA.isWinner ? 'var(--font-semibold)' : 'var(--font-normal)',
                          color: matchup.teamA.isWinner ? 'var(--color-success)' : 'var(--color-text)'
                        }}>
                          {matchup.teamA.name}
                          {matchup.teamA.isWinner && ' ✓'}
                        </span>
                        <span style={{ 
                          color: 'var(--color-text-muted)',
                          fontWeight: matchup.teamA.percentage > matchup.teamB.percentage ? 'var(--font-semibold)' : 'var(--font-normal)'
                        }}>
                          {matchup.teamA.percentage}%
                        </span>
                      </div>
                      <div style={{ 
                        height: 6,
                        background: 'var(--color-border-light)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${matchup.teamA.percentage}%`,
                          background: matchup.teamA.isWinner 
                            ? 'var(--color-success)' 
                            : matchup.teamA.percentage > matchup.teamB.percentage 
                              ? 'var(--color-primary)' 
                              : 'var(--color-text-muted)',
                          borderRadius: 'var(--radius-full)'
                        }} />
                      </div>
                    </div>

                    {/* VS divider */}
                    <div style={{ 
                      textAlign: 'center', 
                      fontSize: 'var(--font-size-xs)', 
                      color: 'var(--color-text-muted)',
                      margin: 'var(--spacing-1) 0'
                    }}>
                      vs
                    </div>

                    {/* Team B */}
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: 'var(--spacing-1)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        <span style={{ 
                          fontWeight: matchup.teamB.isWinner ? 'var(--font-semibold)' : 'var(--font-normal)',
                          color: matchup.teamB.isWinner ? 'var(--color-success)' : 'var(--color-text)'
                        }}>
                          {matchup.teamB.name}
                          {matchup.teamB.isWinner && ' ✓'}
                        </span>
                        <span style={{ 
                          color: 'var(--color-text-muted)',
                          fontWeight: matchup.teamB.percentage > matchup.teamA.percentage ? 'var(--font-semibold)' : 'var(--font-normal)'
                        }}>
                          {matchup.teamB.percentage}%
                        </span>
                      </div>
                      <div style={{ 
                        height: 6,
                        background: 'var(--color-border-light)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${matchup.teamB.percentage}%`,
                          background: matchup.teamB.isWinner 
                            ? 'var(--color-success)' 
                            : matchup.teamB.percentage > matchup.teamA.percentage 
                              ? 'var(--color-primary)' 
                              : 'var(--color-text-muted)',
                          borderRadius: 'var(--radius-full)'
                        }} />
                      </div>
                    </div>

                    {/* Total picks */}
                    <div style={{ 
                      marginTop: 'var(--spacing-2)', 
                      fontSize: 'var(--font-size-xs)', 
                      color: 'var(--color-text-muted)',
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

      <div style={{ marginTop: 'var(--spacing-8)' }}>
        <Link href={`/pool/${poolId}`} style={{ color: 'var(--color-primary)' }}>
          ← Back to Pool
        </Link>
      </div>
    </div>
  )
}

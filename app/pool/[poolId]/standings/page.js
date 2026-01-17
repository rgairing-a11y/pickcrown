// app/pool/[poolId]/standings/page.js
// REFACTORED: Uses event type configuration for flexibility
// Adding new event types does NOT require modifying this file

export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { getEventTypeConfig, getScoringFunction, hasFeature } from '../../../../lib/eventTypes'

// Components - only loaded if needed
import ScenarioSimulator from '../../../../components/ScenarioSimulator'
import MyPicksButton from '../../../../components/MyPicksButton'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase admin client missing env vars')
  }

  return createClient(url, key)
}

export default async function StandingsPage({ params }) {
  const supabase = getSupabaseAdmin()
  const { poolId } = await params

  // =====================================================
  // CORE DATA LOADING (same for all event types)
  // =====================================================

  const { data: pool } = await supabase
    .from('pools')
    .select(`
      *,
      event:events(
        id, name, year, start_time, status,
        season_id, event_type, uses_reseeding,
        season:seasons(id, name)
      )
    `)
    .eq('id', poolId)
    .single()

  if (!pool) {
    return <div style={{ padding: 24 }}>Pool not found</div>
  }

  // Get event type configuration
  const eventConfig = getEventTypeConfig(pool.event)
  const scoringFunction = getScoringFunction(pool.event)
  
  // Call the appropriate scoring function
  const { data: standings, error: standingsError } = await supabase
    .rpc(scoringFunction, { p_pool_id: poolId })

  if (standingsError) {
    console.error('Standings error:', standingsError)
  }

  const season = pool.event?.season
  const isLocked = new Date(pool.event.start_time) < new Date()
  const isCompleted = pool.event?.status === 'completed'

  // =====================================================
  // GET LAST RESULT TIMESTAMP
  // =====================================================
  let lastResultTime = null
  
  if (eventConfig.hasTeamEliminations) {
    // NFL-style: get last elimination entry
    const { data: lastElim } = await supabase
      .from('team_eliminations')
      .select('created_at')
      .eq('event_id', pool.event.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    lastResultTime = lastElim?.created_at
  } else if (eventConfig.hasCategories) {
    // Category-based: get categories for this event, then find last result
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .eq('event_id', pool.event.id)
    
    if (categories && categories.length > 0) {
      const categoryIds = categories.map(c => c.id)
      const { data: lastResult } = await supabase
        .from('category_options')
        .select('updated_at')
        .in('category_id', categoryIds)
        .eq('is_correct', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      lastResultTime = lastResult?.updated_at
    }
  } else if (eventConfig.hasMatchups) {
    // Bracket-based: get last matchup with winner set
    const { data: lastMatchup } = await supabase
      .from('matchups')
      .select('updated_at')
      .eq('event_id', pool.event.id)
      .not('winner_team_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    lastResultTime = lastMatchup?.updated_at
  }

  // =====================================================
  // CONDITIONAL DATA LOADING (based on event type)
  // =====================================================

  // Category Popular Picks (for pick_one and hybrid)
  let popularCategoryPicks = []
  if (isLocked && hasFeature(pool.event, 'popularCategoryPicks')) {
    popularCategoryPicks = await loadPopularCategoryPicks(pool.event.id, poolId, supabase)
  }

  // Bracket Popular Picks (for bracket and hybrid)
  let popularBracketPicks = []
  if (isLocked && hasFeature(pool.event, 'popularBracketPicks')) {
    popularBracketPicks = await loadPopularBracketPicks(pool.event.id, poolId, supabase)
  }

  // Advancement Popular Picks (for NFL-style)
  let popularAdvancementPicks = []
  if (isLocked && hasFeature(pool.event, 'popularAdvancementPicks')) {
    popularAdvancementPicks = await loadPopularAdvancementPicks(pool.event.id, poolId, supabase)
  }

  // Scenario Simulator data (for bracket events)
  let simulatorData = { matchups: [], roundPoints: {}, roundNames: {}, entries: [], bracketPicks: [] }
  if (isLocked && hasFeature(pool.event, 'scenarioSimulator')) {
    simulatorData = await loadSimulatorData(pool.event.id, poolId, supabase)
  }

  // Path to Victory data (for bracket events)
  let pathToVictoryData = []
  if (isLocked && hasFeature(pool.event, 'pathToVictory')) {
    pathToVictoryData = await loadPathToVictoryData(pool.event.id, poolId, standings, supabase)
  }

  // =====================================================
  // RENDER
  // =====================================================

  // Format last result timestamp for display
  const updatedAt = lastResultTime 
    ? new Date(lastResultTime).toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : null

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <h1 style={{ fontSize: '28px', marginBottom: 8 }}>
        {pool.name} — Standings
      </h1>
      <p style={{ color: '#666', marginBottom: 8 }}>
        {pool.event.name} {pool.event.year}
      </p>
      {updatedAt && (
        <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>
          📊 Results updated {updatedAt}
        </p>
      )}
      {!updatedAt && isLocked && (
        <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>
          ⏳ No results entered yet
        </p>
      )}

      {/* Action Buttons */}
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

        {/* My Picks - works for all event types */}
        {isLocked && (
          <MyPicksButton
            pool={pool}
            poolId={poolId}
            poolEntries={simulatorData.entries}
            bracketPicks={simulatorData.bracketPicks}
            matchups={simulatorData.matchups}
            roundNames={simulatorData.roundNames}
          />
        )}

        {/* View All Picks */}
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

      {/* Podium (universal - works for all event types) */}
      {standings?.length > 0 && (
        <Podium standings={standings} />
      )}

      {/* Standings Table (universal - works for all event types) */}
      {standings?.length > 0 && (
        <StandingsTable standings={standings} eventConfig={eventConfig} />
      )}

      {/* Path to Victory (bracket events only) */}
      {hasFeature(pool.event, 'pathToVictory') && pathToVictoryData.length > 0 && (
        <PathToVictorySection data={pathToVictoryData} isCompleted={isCompleted} />
      )}

      {/* Scenario Simulator (bracket events only) */}
      {hasFeature(pool.event, 'scenarioSimulator') && simulatorData.matchups.length > 0 && (
        <ScenarioSimulator
          matchups={simulatorData.matchups}
          entries={simulatorData.entries}
          bracketPicks={simulatorData.bracketPicks}
          currentStandings={standings}
          roundPoints={simulatorData.roundPoints}
        />
      )}

      {/* Popular Category Picks (pick_one and hybrid) */}
      {hasFeature(pool.event, 'popularCategoryPicks') && popularCategoryPicks.length > 0 && (
        <PopularCategoryPicksSection picks={popularCategoryPicks} />
      )}

      {/* Popular Bracket Picks (bracket and hybrid) */}
      {hasFeature(pool.event, 'popularBracketPicks') && popularBracketPicks.length > 0 && (
        <PopularBracketPicksSection picks={popularBracketPicks} />
      )}

      {/* Popular Advancement Picks (NFL-style) */}
      {hasFeature(pool.event, 'popularAdvancementPicks') && popularAdvancementPicks.length > 0 && (
        <PopularAdvancementPicksSection picks={popularAdvancementPicks} />
      )}

      {/* Back link */}
      <div style={{ marginTop: 32 }}>
        <Link href={`/pool/${poolId}`} style={{ color: '#3b82f6' }}>
          ← Back to Pool
        </Link>
      </div>
    </div>
  )
}

// =====================================================
// DATA LOADING FUNCTIONS
// =====================================================

async function loadPopularCategoryPicks(eventId, poolId, supabase) {
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, order_index, options:category_options(id, name, is_correct)')
    .eq('event_id', eventId)
    .order('order_index')

  const { data: entries } = await supabase
    .from('pool_entries')
    .select('id')
    .eq('pool_id', poolId)

  const entryIds = entries?.map(e => e.id) || []
  if (entryIds.length === 0) return []

  const { data: picks } = await supabase
    .from('category_picks')
    .select('category_id, option_id')
    .in('pool_entry_id', entryIds)

  return (categories || []).map(category => {
    const categoryPicks = picks?.filter(p => p.category_id === category.id) || []
    const totalPicks = categoryPicks.length

    const optionCounts = category.options.map(option => {
      const count = categoryPicks.filter(p => p.option_id === option.id).length
      const percentage = totalPicks > 0 ? Math.round((count / totalPicks) * 100) : 0
      return { id: option.id, name: option.name, count, percentage, isCorrect: option.is_correct }
    }).sort((a, b) => b.percentage - a.percentage)

    return { id: category.id, name: category.name, totalPicks, options: optionCounts }
  })
}

async function loadPopularBracketPicks(eventId, poolId, supabase) {
  const { data: rounds } = await supabase
    .from('rounds')
    .select('id, name, round_order, points')
    .eq('event_id', eventId)
    .order('round_order')

  const { data: matchups } = await supabase
    .from('matchups')
    .select(`
      id, round_id, winner_team_id,
      team_a:teams!matchups_team_a_id_fkey(id, name, seed),
      team_b:teams!matchups_team_b_id_fkey(id, name, seed)
    `)
    .eq('event_id', eventId)

  if (!matchups || matchups.length === 0) return []

  const { data: entries } = await supabase
    .from('pool_entries')
    .select('id')
    .eq('pool_id', poolId)

  const entryIds = entries?.map(e => e.id) || []
  if (entryIds.length === 0) return []

  const { data: bracketPicks } = await supabase
    .from('bracket_picks')
    .select('matchup_id, picked_team_id')
    .in('pool_entry_id', entryIds)

  return (rounds || []).map(round => {
    const roundMatchups = matchups.filter(m => m.round_id === round.id)
    const matchupStats = roundMatchups.map(matchup => {
      const matchupPicks = bracketPicks?.filter(p => p.matchup_id === matchup.id) || []
      const totalPicks = matchupPicks.length
      const teamAPicks = matchupPicks.filter(p => p.picked_team_id === matchup.team_a?.id).length
      const teamBPicks = matchupPicks.filter(p => p.picked_team_id === matchup.team_b?.id).length
      const formatTeam = (team) => team ? (team.seed ? `#${team.seed} ${team.name}` : team.name) : 'TBD'

      return {
        id: matchup.id,
        teamA: {
          id: matchup.team_a?.id,
          name: formatTeam(matchup.team_a),
          picks: teamAPicks,
          percentage: totalPicks > 0 ? Math.round((teamAPicks / totalPicks) * 100) : 0,
          isWinner: matchup.winner_team_id === matchup.team_a?.id
        },
        teamB: {
          id: matchup.team_b?.id,
          name: formatTeam(matchup.team_b),
          picks: teamBPicks,
          percentage: totalPicks > 0 ? Math.round((teamBPicks / totalPicks) * 100) : 0,
          isWinner: matchup.winner_team_id === matchup.team_b?.id
        },
        totalPicks,
        hasResult: !!matchup.winner_team_id
      }
    })
    return { id: round.id, name: round.name, points: round.points, matchups: matchupStats }
  }).filter(round => round.matchups.length > 0)
}

async function loadPopularAdvancementPicks(eventId, poolId, supabase) {
  const { data: rounds } = await supabase
    .from('rounds')
    .select('id, name, round_order, points')
    .eq('event_id', eventId)
    .order('round_order')

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, seed, conference')
    .eq('event_id', eventId)

  const { data: entries } = await supabase
    .from('pool_entries')
    .select('id')
    .eq('pool_id', poolId)

  const entryIds = entries?.map(e => e.id) || []
  if (entryIds.length === 0) return []

  const { data: advancementPicks } = await supabase
    .from('advancement_picks')
    .select('round_id, team_id')
    .in('pool_entry_id', entryIds)

  // Load eliminations WITH defeated_by_team_id to know winners
  const { data: eliminations } = await supabase
    .from('team_eliminations')
    .select('team_id, eliminated_in_round_id, defeated_by_team_id')
    .eq('event_id', eventId)

  // Map of team_id -> round they were eliminated in (losers)
  const elimMap = Object.fromEntries((eliminations || []).map(e => [e.team_id, e.eliminated_in_round_id]))
  
  // Map of team_id -> round they won in (winners via defeated_by_team_id)
  const winnerMap = {}
  ;(eliminations || []).forEach(e => {
    if (e.defeated_by_team_id) {
      if (!winnerMap[e.defeated_by_team_id]) {
        winnerMap[e.defeated_by_team_id] = []
      }
      winnerMap[e.defeated_by_team_id].push(e.eliminated_in_round_id)
    }
  })
  
  const teamMap = Object.fromEntries((teams || []).map(t => [t.id, t]))
  const totalEntries = entryIds.length

  // Build round order lookup
  const roundOrderMap = Object.fromEntries((rounds || []).map(r => [r.id, r.round_order]))

  return (rounds || []).map(round => {
    const roundPicks = advancementPicks?.filter(p => p.round_id === round.id) || []
    
    // Count picks per team
    const teamCounts = {}
    roundPicks.forEach(p => {
      teamCounts[p.team_id] = (teamCounts[p.team_id] || 0) + 1
    })

    // Convert to sorted array
    const teamStats = Object.entries(teamCounts)
      .map(([teamId, count]) => {
        const team = teamMap[teamId]
        const elimRoundId = elimMap[teamId]
        const wonRoundIds = winnerMap[teamId] || []
        
        // Determine status based on what we know for certain
        let status = 'pending' // Default: no result yet
        
        // Check if team was eliminated
        if (elimRoundId) {
          const elimRoundOrder = roundOrderMap[elimRoundId]
          if (elimRoundOrder === round.round_order) {
            // Team was eliminated IN THIS ROUND = wrong pick
            status = 'eliminated'
          } else if (elimRoundOrder > round.round_order) {
            // Team was eliminated in a LATER round = they advanced past this round
            status = 'advanced'
          }
        }
        
        // Check if team WON a game in this round (via defeated_by_team_id)
        if (status === 'pending' && wonRoundIds.length > 0) {
          const wonThisRound = wonRoundIds.some(roundId => roundOrderMap[roundId] === round.round_order)
          if (wonThisRound) {
            status = 'advanced'
          }
        }
        
        return {
          teamId,
          name: team ? `#${team.seed} ${team.name}` : 'Unknown',
          conference: team?.conference,
          count,
          percentage: Math.round((count / totalEntries) * 100),
          status
        }
      })
      .sort((a, b) => b.percentage - a.percentage)

    return {
      id: round.id,
      name: round.name,
      points: round.points,
      teams: teamStats
    }
  })
}

async function loadSimulatorData(eventId, poolId, supabase) {
  const { data: rounds } = await supabase
    .from('rounds')
    .select('id, name, points')
    .eq('event_id', eventId)

  const roundPoints = {}
  const roundNames = {}
  rounds?.forEach(r => {
    roundPoints[r.id] = r.points
    roundNames[r.id] = r.name
  })

  const { data: matchups } = await supabase
    .from('matchups')
    .select(`
      id, round_id, team_a_id, team_b_id, winner_team_id,
      team_a:teams!matchups_team_a_id_fkey(id, name, seed),
      team_b:teams!matchups_team_b_id_fkey(id, name, seed)
    `)
    .eq('event_id', eventId)

  const { data: entries } = await supabase
    .from('pool_entries')
    .select('id, entry_name, email')
    .eq('pool_id', poolId)

  const entryIds = entries?.map(e => e.id) || []
  
  const { data: bracketPicks } = await supabase
    .from('bracket_picks')
    .select('pool_entry_id, matchup_id, picked_team_id')
    .in('pool_entry_id', entryIds)

  return {
    matchups: matchups || [],
    roundPoints,
    roundNames,
    entries: entries || [],
    bracketPicks: bracketPicks || []
  }
}

async function loadPathToVictoryData(eventId, poolId, standings, supabase) {
  // Simplified - return empty for now, implement fully later
  return []
}

// =====================================================
// UI COMPONENTS
// =====================================================

function Podium({ standings }) {
  const gold = standings.filter(s => s.rank === 1)
  const silver = standings.filter(s => s.rank === 2)
  const bronze = standings.filter(s => s.rank === 3)

  return (
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
      {/* Silver */}
      {silver.map(entry => (
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

      {/* Gold */}
      {gold.map(entry => (
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

      {/* Bronze */}
      {bronze.map(entry => (
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
  )
}

function StandingsTable({ standings, eventConfig }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '12px 8px', color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Rank</th>
            <th style={{ textAlign: 'left', padding: '12px 8px', color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Entry Name</th>
            <th style={{ textAlign: 'right', padding: '12px 8px', color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((entry, idx) => (
            <tr key={entry.entry_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px 8px' }}>
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : ''} #{entry.rank}
              </td>
              <td style={{ padding: '12px 8px', fontWeight: 600 }}>{entry.entry_name}</td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: 18 }}>
                {entry.total_points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PathToVictorySection({ data, isCompleted }) {
  if (data.length === 0) return null
  return (
    <div style={{ marginTop: 48 }}>
      <h2 style={{ fontSize: '20px', marginBottom: 16 }}>
        {isCompleted ? '📊 Final Results' : '🎯 Path to Victory'}
      </h2>
      {/* Implementation here */}
    </div>
  )
}

function PopularCategoryPicksSection({ picks }) {
  return (
    <div style={{ marginTop: 48 }}>
      <h2 style={{ fontSize: '20px', marginBottom: 24 }}>📊 Popular Picks</h2>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {picks.map(category => (
          <div key={category.id} style={{
            padding: 16,
            background: '#f9fafb',
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12 }}>{category.name}</h3>
            {category.options.slice(0, 5).map(option => (
              <div key={option.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '14px' }}>
                  <span style={{
                    fontWeight: option.isCorrect ? 'bold' : 'normal',
                    color: option.isCorrect ? '#16a34a' : '#374151'
                  }}>
                    {option.name}{option.isCorrect && ' ✓'}
                  </span>
                  <span style={{ color: '#6b7280' }}>{option.percentage}%</span>
                </div>
                <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${option.percentage}%`,
                    background: option.isCorrect ? '#22c55e' : option.percentage >= 50 ? '#3b82f6' : '#9ca3af',
                    borderRadius: 4
                  }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: '12px', color: '#9ca3af' }}>
              {category.totalPicks} pick{category.totalPicks !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PopularBracketPicksSection({ picks }) {
  return (
    <div style={{ marginTop: 48 }}>
      <h2 style={{ fontSize: '20px', marginBottom: 24 }}>🏆 Popular Bracket Picks</h2>
      {picks.map(round => {
        const pendingMatchups = round.matchups.filter(m =>
          !m.hasResult && m.teamA.name !== 'TBD' && m.teamB.name !== 'TBD' && m.teamA.id && m.teamB.id
        )
        if (pendingMatchups.length === 0) return null

        return (
          <div key={round.id} style={{ marginBottom: 32 }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between'
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
                {round.points} pts each
              </span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingMatchups.map(matchup => (
                <div key={matchup.id} style={{
                  padding: 16,
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb'
                }}>
                  {/* Team A */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{matchup.teamA.name}</span>
                      <span style={{ color: '#6b7280' }}>{matchup.teamA.percentage}%</span>
                    </div>
                    <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3 }}>
                      <div style={{
                        height: '100%',
                        width: `${matchup.teamA.percentage}%`,
                        background: matchup.teamA.percentage > matchup.teamB.percentage ? '#3b82f6' : '#9ca3af',
                        borderRadius: 3
                      }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>vs</div>
                  {/* Team B */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{matchup.teamB.name}</span>
                      <span style={{ color: '#6b7280' }}>{matchup.teamB.percentage}%</span>
                    </div>
                    <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3 }}>
                      <div style={{
                        height: '100%',
                        width: `${matchup.teamB.percentage}%`,
                        background: matchup.teamB.percentage > matchup.teamA.percentage ? '#3b82f6' : '#9ca3af',
                        borderRadius: 3
                      }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: '11px', color: '#9ca3af', textAlign: 'right' }}>
                    {matchup.totalPicks} picks
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PopularAdvancementPicksSection({ picks }) {
  return (
    <div style={{ marginTop: 48 }}>
      <h2 style={{ fontSize: '20px', marginBottom: 24 }}>🏈 Popular Advancement Picks</h2>
      {picks.map(round => (
        <div key={round.id} style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between'
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
              {round.points} pts each
            </span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {round.teams.slice(0, 10).map(team => {
              // Only color if we have definitive results
              const isEliminated = team.status === 'eliminated'
              const isAdvanced = team.status === 'advanced'
              const hasResult = isEliminated || isAdvanced
              
              return (
                <div key={team.teamId} style={{
                  padding: '10px 14px',
                  background: isEliminated ? '#fee2e2'
                    : isAdvanced ? '#dcfce7'
                    : '#f9fafb',  // No color for pending
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{
                      fontSize: 11,
                      color: team.conference === 'AFC' ? '#dc2626' : '#2563eb',
                      marginRight: 6
                    }}>
                      {team.conference}
                    </span>
                    <span style={{
                      color: isEliminated ? '#991b1b' : '#374151'
                    }}>
                      {team.name}
                    </span>
                    {isEliminated && <span style={{ marginLeft: 6 }}>❌</span>}
                    {isAdvanced && <span style={{ marginLeft: 6 }}>✅</span>}
                  </div>
                  <span style={{ color: '#6b7280', fontWeight: 600 }}>{team.percentage}%</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

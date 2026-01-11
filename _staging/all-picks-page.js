// app/pool/[poolId]/picks/page.js
// Updated All Picks page that handles both standard brackets and NFL reseeding

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function AllPicksPage({ params }) {
  const { poolId } = await params

  // Get pool with event details
  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .select(`
      *,
      event:events(
        id, name, year, start_time, status, uses_reseeding, event_type
      )
    `)
    .eq('id', poolId)
    .single()

  if (poolError || !pool) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <h1>Pool not found</h1>
        <p>The requested pool could not be found.</p>
      </div>
    )
  }

  const usesReseeding = pool.event?.uses_reseeding === true
  const isLocked = new Date(pool.event.start_time) < new Date()

  // Get entries
  const { data: entries } = await supabase
    .from('pool_entries')
    .select('id, entry_name, email')
    .eq('pool_id', poolId)
    .order('entry_name')

  if (!entries || entries.length === 0) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Link href={`/pool/${poolId}/standings`} style={{ color: '#3b82f6' }}>
          ← Back to Standings
        </Link>
        <h1 style={{ marginTop: 16 }}>📊 {pool.event.name} — All Picks</h1>
        <p style={{ color: '#666' }}>No entries yet.</p>
      </div>
    )
  }

  // Get rounds
  const { data: rounds } = await supabase
    .from('rounds')
    .select('*')
    .eq('event_id', pool.event.id)
    .order('round_order')

  // Get teams
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', pool.event.id)
    .order('seed')

  const teamMap = Object.fromEntries((teams || []).map(t => [t.id, t]))

  // Different data loading based on event type
  let picksData = {}
  let matchups = []
  let eliminations = {}

  if (usesReseeding) {
    // NFL-style: Load advancement_picks
    const entryIds = entries.map(e => e.id)
    
    const { data: advancementPicks } = await supabase
      .from('advancement_picks')
      .select('*')
      .in('pool_entry_id', entryIds)

    // Group picks by entry -> round -> teams
    advancementPicks?.forEach(pick => {
      if (!picksData[pick.pool_entry_id]) {
        picksData[pick.pool_entry_id] = {}
      }
      if (!picksData[pick.pool_entry_id][pick.round_id]) {
        picksData[pick.pool_entry_id][pick.round_id] = []
      }
      picksData[pick.pool_entry_id][pick.round_id].push(pick.team_id)
    })

    // Load eliminations for correct/incorrect display
    const { data: elimData } = await supabase
      .from('team_eliminations')
      .select('*')
      .eq('event_id', pool.event.id)

    elimData?.forEach(e => {
      eliminations[e.team_id] = e.eliminated_in_round_id
    })

  } else {
    // Standard bracket: Load bracket_picks and matchups
    const { data: matchupsData } = await supabase
      .from('matchups')
      .select('*, round:rounds(name, round_order, points)')
      .eq('event_id', pool.event.id)
      .order('bracket_position')

    matchups = matchupsData || []

    // Load bracket picks
    const entryIds = entries.map(e => e.id)
    
    const { data: bracketPicks } = await supabase
      .from('bracket_picks')
      .select('*')
      .in('pool_entry_id', entryIds)

    // Group by entry
    bracketPicks?.forEach(pick => {
      if (!picksData[pick.pool_entry_id]) {
        picksData[pick.pool_entry_id] = {}
      }
      picksData[pick.pool_entry_id][pick.matchup_id] = pick.team_id
    })
  }

  // Check if locked
  if (!isLocked) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Link href={`/pool/${poolId}/standings`} style={{ color: '#3b82f6' }}>
          ← Back to Standings
        </Link>
        <h1 style={{ marginTop: 16 }}>📊 {pool.event.name} — All Picks</h1>
        <div style={{
          padding: 24,
          background: '#fef3c7',
          borderRadius: 8,
          border: '1px solid #f59e0b',
          marginTop: 24
        }}>
          <p style={{ margin: 0 }}>
            🔒 Picks will be visible after the event locks on{' '}
            <strong>
              {new Date(pool.event.start_time).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </strong>
          </p>
        </div>
      </div>
    )
  }

  // Render NFL-style picks
  if (usesReseeding) {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        <Link href={`/pool/${poolId}/standings`} style={{ color: '#3b82f6' }}>
          ← Back to Standings
        </Link>
        
        <h1 style={{ marginTop: 16 }}>
          🏈 {pool.event.name} — {pool.name} — All Picks
        </h1>
        <p style={{ color: '#666', marginBottom: 24 }}>{pool.event.name}</p>

        {/* Legend */}
        <div style={{
          display: 'flex',
          gap: 24,
          marginBottom: 24,
          padding: 12,
          background: '#f9fafb',
          borderRadius: 8,
          fontSize: 14
        }}>
          <span><span style={{ color: '#16a34a' }}>Green</span> = Correct</span>
          <span><span style={{ color: '#dc2626' }}>Red</span> = Wrong</span>
          <span style={{ color: '#666' }}>No color = Pending</span>
        </div>

        {/* Picks by Round */}
        {(rounds || []).map(round => {
          const roundOrder = round.round_order
          
          return (
            <div key={round.id} style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: 18,
                padding: '12px 16px',
                background: roundOrder === (rounds?.length || 0) ? '#fef3c7' : '#eff6ff',
                borderRadius: 8,
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>
                  {roundOrder === (rounds?.length || 0) && '🏆 '}
                  {round.name}
                </span>
                <span style={{ fontSize: 14, color: '#666', fontWeight: 'normal' }}>
                  {round.points} pts each
                </span>
              </h2>

              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 14
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 8px',
                        position: 'sticky',
                        left: 0,
                        background: 'white',
                        zIndex: 1
                      }}>
                        ENTRY
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 8px' }}>
                        PICKS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(entry => {
                      const entryPicks = picksData[entry.id]?.[round.id] || []
                      
                      return (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{
                            padding: '12px 8px',
                            fontWeight: 500,
                            position: 'sticky',
                            left: 0,
                            background: 'white',
                            minWidth: 150
                          }}>
                            {entry.entry_name}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            {entryPicks.length === 0 ? (
                              <span style={{ color: '#9ca3af' }}>—</span>
                            ) : (
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {entryPicks.map(teamId => {
                                  const team = teamMap[teamId]
                                  if (!team) return null

                                  // Check if correct
                                  const elimRoundId = eliminations[teamId]
                                  let isCorrect = null
                                  
                                  if (elimRoundId) {
                                    const elimRound = rounds?.find(r => r.id === elimRoundId)
                                    if (elimRound) {
                                      // Team advanced past this round if eliminated in later round
                                      isCorrect = elimRound.round_order > round.round_order
                                    }
                                  } else if (Object.keys(eliminations).length > 0) {
                                    // Team still alive = correct for rounds before current
                                    isCorrect = true
                                  }

                                  const bgColor = isCorrect === true 
                                    ? '#dcfce7' 
                                    : isCorrect === false 
                                      ? '#fee2e2' 
                                      : '#f3f4f6'
                                  const textColor = isCorrect === true 
                                    ? '#166534' 
                                    : isCorrect === false 
                                      ? '#991b1b' 
                                      : '#374151'
                                  const borderColor = isCorrect === true 
                                    ? '#16a34a' 
                                    : isCorrect === false 
                                      ? '#ef4444' 
                                      : '#d1d5db'

                                  return (
                                    <span 
                                      key={teamId}
                                      style={{
                                        padding: '4px 10px',
                                        background: bgColor,
                                        color: textColor,
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: 6,
                                        fontSize: 13,
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      <span style={{
                                        fontSize: 10,
                                        color: team.conference === 'AFC' ? '#dc2626' : '#2563eb',
                                        marginRight: 4
                                      }}>
                                        {team.conference}
                                      </span>
                                      #{team.seed} {team.name}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Standard bracket picks display
  // Group matchups by round
  const matchupsByRound = {}
  matchups.forEach(m => {
    const roundName = m.round?.name || 'Unknown'
    const roundOrder = m.round?.round_order || 0
    if (!matchupsByRound[roundOrder]) {
      matchupsByRound[roundOrder] = {
        name: roundName,
        points: m.round?.points || 0,
        matchups: []
      }
    }
    matchupsByRound[roundOrder].matchups.push(m)
  })

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Link href={`/pool/${poolId}/standings`} style={{ color: '#3b82f6' }}>
        ← Back to Standings
      </Link>
      
      <h1 style={{ marginTop: 16 }}>
        📊 {pool.event.name} — {pool.name} — All Picks
      </h1>
      <p style={{ color: '#666', marginBottom: 24 }}>{pool.event.name}</p>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginBottom: 24,
        padding: 12,
        background: '#f9fafb',
        borderRadius: 8,
        fontSize: 14
      }}>
        <span><span style={{ color: '#16a34a' }}>Green</span> = Correct</span>
        <span><span style={{ color: '#dc2626' }}>Red</span> = Wrong</span>
      </div>

      {/* Picks Table */}
      {Object.entries(matchupsByRound)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([roundOrder, roundData]) => (
          <div key={roundOrder} style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 16,
              padding: '8px 12px',
              background: '#eff6ff',
              color: '#1e40af',
              borderRadius: 6,
              marginBottom: 12
            }}>
              {roundData.name}
              <span style={{ 
                fontWeight: 'normal', 
                color: '#6b7280',
                marginLeft: 12,
                fontSize: 14
              }}>
                ({roundData.points} pts each)
              </span>
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px 8px',
                      minWidth: 250,
                      color: '#6b7280',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: 12
                    }}>
                      MATCHUP
                    </th>
                    {entries.map(entry => (
                      <th 
                        key={entry.id}
                        style={{ 
                          textAlign: 'center', 
                          padding: '12px 8px',
                          minWidth: 100,
                          color: '#6b7280',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          fontSize: 11
                        }}
                      >
                        {entry.entry_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roundData.matchups.map(matchup => {
                    const teamA = teamMap[matchup.team_a_id]
                    const teamB = teamMap[matchup.team_b_id]
                    const winner = matchup.winner_team_id

                    return (
                      <tr key={matchup.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 8px' }}>
                          {teamA && teamB ? (
                            <>
                              ({teamA.seed}) {teamA.name} vs ({teamB.seed}) {teamB.name}
                            </>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>TBD</span>
                          )}
                        </td>
                        {entries.map(entry => {
                          const pick = picksData[entry.id]?.[matchup.id]
                          const pickedTeam = pick ? teamMap[pick] : null
                          
                          let bgColor = 'transparent'
                          let textColor = '#374151'
                          
                          if (winner && pick) {
                            if (pick === winner) {
                              bgColor = '#dcfce7'
                              textColor = '#166534'
                            } else {
                              bgColor = '#fee2e2'
                              textColor = '#991b1b'
                            }
                          }

                          return (
                            <td 
                              key={entry.id}
                              style={{ 
                                padding: '12px 8px',
                                textAlign: 'center',
                                background: bgColor,
                                color: textColor
                              }}
                            >
                              {pickedTeam ? pickedTeam.name : '—'}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  )
}

'use client'

/**
 * NFLBracketVisualization - Shows the actual NFL playoff bracket as it forms
 * 
 * This displays the real bracket with results, not user picks.
 * Matchups are populated/updated as results come in due to reseeding.
 */
export default function NFLBracketVisualization({
  rounds,
  teams,
  eliminations, // { teamId: roundId where eliminated }
  matchups // Wild Card matchups (fixed), others populated as we go
}) {
  // Sort rounds by order
  const sortedRounds = [...rounds].sort((a, b) => a.round_order - b.round_order)
  
  // Create team lookup
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))
  
  // Create elimination lookup - which round was each team eliminated
  const elimRoundMap = {}
  Object.entries(eliminations).forEach(([teamId, roundId]) => {
    const round = sortedRounds.find(r => r.id === roundId)
    if (round) {
      elimRoundMap[teamId] = round.round_order
    }
  })

  // Get teams that are still alive
  const aliveTeams = teams.filter(t => !eliminations[t.id])
  
  // Group by conference
  const teamsByConf = { AFC: [], NFC: [] }
  teams.forEach(t => {
    const conf = t.conference?.toUpperCase()
    if (teamsByConf[conf]) teamsByConf[conf].push(t)
  })

  // Sort each conference by seed
  Object.keys(teamsByConf).forEach(conf => {
    teamsByConf[conf].sort((a, b) => (a.seed || 99) - (b.seed || 99))
  })

  // Determine which teams advanced past each round
  const getAdvancedTeams = (roundOrder, conference) => {
    return teamsByConf[conference].filter(team => {
      // Team advanced past this round if:
      // - Not eliminated at all (still alive or champion)
      // - Or eliminated in a LATER round
      const elimOrder = elimRoundMap[team.id]
      if (elimOrder === undefined) return true // Still alive
      return elimOrder > roundOrder
    })
  }

  // Get eliminated teams in a specific round
  const getEliminatedInRound = (roundOrder, conference) => {
    return teamsByConf[conference].filter(team => {
      return elimRoundMap[team.id] === roundOrder
    })
  }

  // Wild Card matchups (these are fixed)
  const wildCardMatchups = matchups.filter(m => {
    const round = sortedRounds.find(r => r.round_order === 1)
    return m.round_id === round?.id
  })

  // Determine if a round is complete
  const isRoundComplete = (roundOrder) => {
    // Count expected eliminations per round
    // WC: 6 teams eliminated (3 per conf)
    // Div: 4 teams eliminated (2 per conf)  
    // Conf: 2 teams eliminated (1 per conf)
    // SB: 1 team eliminated
    const expectedElims = { 1: 6, 2: 4, 3: 2, 4: 1 }
    const elimsThisRound = Object.values(elimRoundMap).filter(r => r === roundOrder).length
    return elimsThisRound >= (expectedElims[roundOrder] || 0)
  }

  // Check if we have a champion
  const champion = aliveTeams.length === 1 ? aliveTeams[0] : null

  return (
    <div style={{
      padding: 24,
      background: '#f9fafb',
      borderRadius: 12,
      marginBottom: 24,
      overflowX: 'auto'
    }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>
        🏈 NFL Playoff Bracket
        {champion && (
          <span style={{ 
            marginLeft: 12, 
            fontSize: 14, 
            color: '#ca8a04',
            fontWeight: 'normal'
          }}>
            🏆 Champion: {champion.name}
          </span>
        )}
      </h3>

      <div style={{
        display: 'flex',
        gap: 32,
        minWidth: 'fit-content'
      }}>
        {/* AFC Side */}
        <div style={{ flex: 1, minWidth: 350 }}>
          <h4 style={{ 
            margin: '0 0 16px', 
            color: '#dc2626',
            textAlign: 'center',
            padding: 8,
            background: '#fee2e2',
            borderRadius: 8
          }}>
            AFC
          </h4>
          
          <ConferenceBracket
            conference="AFC"
            rounds={sortedRounds.filter(r => r.round_order < 4)} // Exclude SB
            teams={teamsByConf.AFC}
            matchups={wildCardMatchups.filter(m => {
              const teamA = teamMap[m.team_a_id]
              return teamA?.conference?.toUpperCase() === 'AFC'
            })}
            teamMap={teamMap}
            elimRoundMap={elimRoundMap}
            getAdvancedTeams={getAdvancedTeams}
            getEliminatedInRound={getEliminatedInRound}
            isRoundComplete={isRoundComplete}
          />
        </div>

        {/* Super Bowl */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: 200
        }}>
          <div style={{
            padding: 20,
            background: '#fef3c7',
            border: '3px solid #f59e0b',
            borderRadius: 12,
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 12px', color: '#92400e' }}>
              🏆 Super Bowl
            </h4>
            <SuperBowlMatchup
              afcTeams={getAdvancedTeams(3, 'AFC')}
              nfcTeams={getAdvancedTeams(3, 'NFC')}
              champion={champion}
              roundComplete={isRoundComplete(3)}
            />
          </div>
        </div>

        {/* NFC Side */}
        <div style={{ flex: 1, minWidth: 350 }}>
          <h4 style={{ 
            margin: '0 0 16px', 
            color: '#2563eb',
            textAlign: 'center',
            padding: 8,
            background: '#dbeafe',
            borderRadius: 8
          }}>
            NFC
          </h4>
          
          <ConferenceBracket
            conference="NFC"
            rounds={sortedRounds.filter(r => r.round_order < 4)}
            teams={teamsByConf.NFC}
            matchups={wildCardMatchups.filter(m => {
              const teamA = teamMap[m.team_a_id]
              return teamA?.conference?.toUpperCase() === 'NFC'
            })}
            teamMap={teamMap}
            elimRoundMap={elimRoundMap}
            getAdvancedTeams={getAdvancedTeams}
            getEliminatedInRound={getEliminatedInRound}
            isRoundComplete={isRoundComplete}
          />
        </div>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 24,
        paddingTop: 16,
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: 24,
        fontSize: 13,
        color: '#666',
        flexWrap: 'wrap'
      }}>
        <span>🟢 Advanced</span>
        <span>🔴 Eliminated</span>
        <span>⚪ Pending</span>
        <span>🏆 Champion</span>
      </div>
    </div>
  )
}

// Conference bracket (WC, Div, Conf)
function ConferenceBracket({
  conference,
  rounds,
  teams,
  matchups,
  teamMap,
  elimRoundMap,
  getAdvancedTeams,
  getEliminatedInRound,
  isRoundComplete
}) {
  // Bye team (seed 1)
  const byeTeam = teams.find(t => t.has_bye)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {rounds.map(round => {
        const roundOrder = round.round_order
        const roundComplete = isRoundComplete(roundOrder)
        const advanced = getAdvancedTeams(roundOrder, conference)
        const eliminated = getEliminatedInRound(roundOrder, conference)

        return (
          <div key={round.id} style={{
            padding: 12,
            background: 'white',
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8
            }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {round.name}
              </span>
              <span style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 12,
                background: roundComplete ? '#dcfce7' : '#f3f4f6',
                color: roundComplete ? '#16a34a' : '#666'
              }}>
                {roundComplete ? 'Complete' : 'In Progress'}
              </span>
            </div>

            {/* Wild Card: Show actual matchups */}
            {roundOrder === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Bye team */}
                {byeTeam && (
                  <div style={{
                    padding: 8,
                    background: '#f0fdf4',
                    borderRadius: 6,
                    fontSize: 13,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>#{byeTeam.seed} {byeTeam.name}</span>
                    <span style={{ color: '#16a34a' }}>BYE ✓</span>
                  </div>
                )}
                
                {/* Wild Card games */}
                {matchups.map(m => {
                  const teamA = teamMap[m.team_a_id]
                  const teamB = teamMap[m.team_b_id]
                  const winner = m.winner_team_id ? teamMap[m.winner_team_id] : null
                  const teamAElim = elimRoundMap[m.team_a_id] === 1
                  const teamBElim = elimRoundMap[m.team_b_id] === 1

                  return (
                    <div key={m.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 6,
                      overflow: 'hidden'
                    }}>
                      <TeamRow 
                        team={teamA} 
                        isWinner={winner?.id === teamA?.id}
                        isEliminated={teamAElim}
                      />
                      <div style={{ 
                        textAlign: 'center', 
                        fontSize: 10, 
                        color: '#9ca3af',
                        background: '#f9fafb',
                        padding: 2
                      }}>vs</div>
                      <TeamRow 
                        team={teamB} 
                        isWinner={winner?.id === teamB?.id}
                        isEliminated={teamBElim}
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Later rounds: Show teams that advanced */}
            {roundOrder > 1 && (
              <div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  {roundOrder === 2 && 'Divisional matchups (reseeded):'}
                  {roundOrder === 3 && 'Conference Championship:'}
                </div>
                
                {/* Show teams in this round */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Teams that were in this round (advanced from previous) */}
                  {getAdvancedTeams(roundOrder - 1, conference).map(team => {
                    const stillAlive = !elimRoundMap[team.id] || elimRoundMap[team.id] > roundOrder
                    const elimThisRound = elimRoundMap[team.id] === roundOrder
                    const advancedPast = !elimRoundMap[team.id] || elimRoundMap[team.id] > roundOrder

                    return (
                      <div key={team.id} style={{
                        padding: '6px 10px',
                        background: advancedPast ? '#f0fdf4' : elimThisRound ? '#fee2e2' : '#f9fafb',
                        borderRadius: 4,
                        fontSize: 13,
                        display: 'flex',
                        justifyContent: 'space-between',
                        border: `1px solid ${advancedPast ? '#bbf7d0' : elimThisRound ? '#fecaca' : '#e5e7eb'}`
                      }}>
                        <span>#{team.seed} {team.name}</span>
                        <span>
                          {advancedPast && '🟢'}
                          {elimThisRound && '🔴'}
                          {!advancedPast && !elimThisRound && '⚪'}
                        </span>
                      </div>
                    )
                  })}
                  
                  {/* If no teams yet, show TBD */}
                  {getAdvancedTeams(roundOrder - 1, conference).length === 0 && (
                    <div style={{ 
                      padding: 8, 
                      background: '#f9fafb', 
                      borderRadius: 4,
                      color: '#9ca3af',
                      textAlign: 'center',
                      fontSize: 13
                    }}>
                      Waiting for previous round...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Team row in matchup
function TeamRow({ team, isWinner, isEliminated }) {
  if (!team) return null
  
  return (
    <div style={{
      padding: '6px 10px',
      background: isWinner ? '#dcfce7' : isEliminated ? '#fee2e2' : 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 13
    }}>
      <span style={{ 
        fontWeight: isWinner ? 600 : 400,
        textDecoration: isEliminated ? 'line-through' : 'none',
        color: isEliminated ? '#9ca3af' : 'inherit'
      }}>
        #{team.seed} {team.name}
      </span>
      {isWinner && <span style={{ color: '#16a34a' }}>✓</span>}
      {isEliminated && <span style={{ color: '#ef4444' }}>✗</span>}
    </div>
  )
}

// Super Bowl display
function SuperBowlMatchup({ afcTeams, nfcTeams, champion, roundComplete }) {
  const afcChampion = afcTeams.length === 1 ? afcTeams[0] : null
  const nfcChampion = nfcTeams.length === 1 ? nfcTeams[0] : null

  return (
    <div style={{ minWidth: 180 }}>
      {/* AFC Champion */}
      <div style={{
        padding: 10,
        background: afcChampion ? '#fee2e2' : '#f9fafb',
        borderRadius: 8,
        marginBottom: 8,
        textAlign: 'center',
        border: afcChampion 
          ? (champion?.id === afcChampion.id ? '3px solid #16a34a' : '1px solid #fca5a5')
          : '1px dashed #d1d5db'
      }}>
        {afcChampion ? (
          <div>
            <div style={{ fontSize: 10, color: '#dc2626' }}>AFC</div>
            <div style={{ fontWeight: 600 }}>
              #{afcChampion.seed} {afcChampion.name}
              {champion?.id === afcChampion.id && ' 🏆'}
            </div>
          </div>
        ) : (
          <div style={{ color: '#9ca3af', fontSize: 13 }}>AFC Champion TBD</div>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: '#666', margin: '8px 0' }}>
        vs
      </div>

      {/* NFC Champion */}
      <div style={{
        padding: 10,
        background: nfcChampion ? '#dbeafe' : '#f9fafb',
        borderRadius: 8,
        textAlign: 'center',
        border: nfcChampion 
          ? (champion?.id === nfcChampion.id ? '3px solid #16a34a' : '1px solid #93c5fd')
          : '1px dashed #d1d5db'
      }}>
        {nfcChampion ? (
          <div>
            <div style={{ fontSize: 10, color: '#2563eb' }}>NFC</div>
            <div style={{ fontWeight: 600 }}>
              #{nfcChampion.seed} {nfcChampion.name}
              {champion?.id === nfcChampion.id && ' 🏆'}
            </div>
          </div>
        ) : (
          <div style={{ color: '#9ca3af', fontSize: 13 }}>NFC Champion TBD</div>
        )}
      </div>

      {/* Champion */}
      {champion && (
        <div style={{
          marginTop: 12,
          padding: 8,
          background: '#fef3c7',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 24 }}>🏆</div>
          <div style={{ fontWeight: 700, color: '#92400e' }}>
            {champion.name}
          </div>
          <div style={{ fontSize: 12, color: '#a16207' }}>
            Super Bowl Champion
          </div>
        </div>
      )}
    </div>
  )
}

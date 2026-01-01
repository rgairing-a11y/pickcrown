'use client'

import { useState } from 'react'

export default function ScenarioSimulator({ 
  matchups, 
  entries, 
  currentStandings,
  roundPoints,
  bracketPicks 
}) {
  const [hypotheticalWinners, setHypotheticalWinners] = useState({})
  
  // Filter matchups: only show undecided games where BOTH teams are known (not TBD)
  const simulatableMatchups = matchups?.filter(m => 
    !m.winner_team_id && // Not already decided
    m.team_a?.id && // Team A is known
    m.team_b?.id    // Team B is known
  ) || []
  
  if (simulatableMatchups.length === 0) {
    return null
  }

  // Calculate hypothetical standings
  function calculateHypotheticalStandings() {
    const standings = {}
    
    // Initialize with current points
    currentStandings?.forEach(s => {
      standings[s.entry_id] = {
        entry_id: s.entry_id,
        entry_name: s.entry_name,
        currentPoints: s.total_points,
        hypotheticalPoints: s.total_points,
        gains: 0
      }
    })

    // Add hypothetical points for each selected winner
    Object.entries(hypotheticalWinners).forEach(([matchupId, winnerId]) => {
      const matchup = matchups.find(m => m.id === matchupId)
      if (!matchup) return
      
      const points = roundPoints[matchup.round_id] || 0
      
      // Find entries that picked this winner
      entries?.forEach(entry => {
        const pick = bracketPicks?.find(
          p => p.pool_entry_id === entry.id && p.matchup_id === matchupId
        )
        if (pick && pick.picked_team_id === winnerId) {
          if (standings[entry.id]) {
            standings[entry.id].hypotheticalPoints += points
            standings[entry.id].gains += points
          }
        }
      })
    })

    // Sort by hypothetical points
    return Object.values(standings).sort((a, b) => b.hypotheticalPoints - a.hypotheticalPoints)
  }

  const hypotheticalStandings = calculateHypotheticalStandings()
  const hasSelections = Object.keys(hypotheticalWinners).length > 0

  function toggleWinner(matchupId, teamId) {
    setHypotheticalWinners(prev => {
      if (prev[matchupId] === teamId) {
        // Deselect
        const { [matchupId]: _, ...rest } = prev
        return rest
      }
      // Select this team
      return { ...prev, [matchupId]: teamId }
    })
  }

  function resetAll() {
    setHypotheticalWinners({})
  }

  // Group matchups by round for better organization
  const matchupsByRound = {}
  simulatableMatchups.forEach(m => {
    const roundName = m.round?.name || 'Round'
    if (!matchupsByRound[roundName]) {
      matchupsByRound[roundName] = {
        name: roundName,
        points: roundPoints[m.round_id] || 0,
        matchups: []
      }
    }
    matchupsByRound[roundName].matchups.push(m)
  })

  return (
    <div style={{ marginTop: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: '20px', margin: 0 }}>🎮 Scenario Simulator</h2>
          <p style={{ color: '#666', fontSize: 14, margin: '4px 0 0' }}>
            Click teams to see "what if" standings
          </p>
        </div>
        {hasSelections && (
          <button
            onClick={resetAll}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            Reset All
          </button>
        )}
      </div>

      {/* Matchup Selector - grouped by round */}
      {Object.values(matchupsByRound).map(round => (
        <div key={round.name} style={{ marginBottom: 24 }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#374151', 
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{round.name}</span>
            <span style={{
              fontSize: 12,
              background: '#e0f2fe',
              color: '#0369a1',
              padding: '4px 10px',
              borderRadius: 12
            }}>
              {round.points} pts each
            </span>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 12
          }}>
            {round.matchups.map(matchup => {
              const selectedTeam = hypotheticalWinners[matchup.id]
              
              return (
                <div
                  key={matchup.id}
                  style={{
                    padding: 12,
                    background: '#f9fafb',
                    borderRadius: 8,
                    border: selectedTeam ? '2px solid #3b82f6' : '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Team A */}
                    <button
                      onClick={() => toggleWinner(matchup.id, matchup.team_a?.id)}
                      style={{
                        padding: '8px 12px',
                        background: selectedTeam === matchup.team_a?.id ? '#3b82f6' : 'white',
                        color: selectedTeam === matchup.team_a?.id ? 'white' : '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 14,
                        fontWeight: selectedTeam === matchup.team_a?.id ? 600 : 400
                      }}
                    >
                      {matchup.team_a?.seed && `#${matchup.team_a.seed} `}
                      {matchup.team_a?.name || 'TBD'}
                      {selectedTeam === matchup.team_a?.id && ' ✓'}
                    </button>
                    
                    <div style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af' }}>vs</div>
                    
                    {/* Team B */}
                    <button
                      onClick={() => toggleWinner(matchup.id, matchup.team_b?.id)}
                      style={{
                        padding: '8px 12px',
                        background: selectedTeam === matchup.team_b?.id ? '#3b82f6' : 'white',
                        color: selectedTeam === matchup.team_b?.id ? 'white' : '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 14,
                        fontWeight: selectedTeam === matchup.team_b?.id ? 600 : 400
                      }}
                    >
                      {matchup.team_b?.seed && `#${matchup.team_b.seed} `}
                      {matchup.team_b?.name || 'TBD'}
                      {selectedTeam === matchup.team_b?.id && ' ✓'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Hypothetical Standings */}
      {hasSelections && (
        <div style={{
          padding: 20,
          background: '#eff6ff',
          borderRadius: 12,
          border: '2px solid #3b82f6'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1d4ed8' }}>
            📊 Projected Standings
          </h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #bfdbfe' }}>
                <th style={{ padding: 8, textAlign: 'left', fontSize: 13 }}>Rank</th>
                <th style={{ padding: 8, textAlign: 'left', fontSize: 13 }}>Entry</th>
                <th style={{ padding: 8, textAlign: 'right', fontSize: 13 }}>Current</th>
                <th style={{ padding: 8, textAlign: 'right', fontSize: 13 }}>Projected</th>
                <th style={{ padding: 8, textAlign: 'right', fontSize: 13 }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {hypotheticalStandings.map((entry, idx) => {
                const originalRank = currentStandings?.findIndex(s => s.entry_id === entry.entry_id) + 1
                const rankChange = originalRank - (idx + 1)
                
                return (
                  <tr key={entry.entry_id} style={{ borderBottom: '1px solid #dbeafe' }}>
                    <td style={{ padding: 8 }}>
                      {idx === 0 ? '👑 ' : ''}#{idx + 1}
                    </td>
                    <td style={{ padding: 8, fontWeight: idx < 3 ? 600 : 400 }}>
                      {entry.entry_name}
                    </td>
                    <td style={{ padding: 8, textAlign: 'right', color: '#6b7280' }}>
                      {entry.currentPoints}
                    </td>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>
                      {entry.hypotheticalPoints}
                    </td>
                    <td style={{ padding: 8, textAlign: 'right' }}>
                      {entry.gains > 0 && (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>
                          +{entry.gains}
                        </span>
                      )}
                      {rankChange !== 0 && (
                        <span style={{ 
                          marginLeft: 8,
                          color: rankChange > 0 ? '#16a34a' : '#dc2626',
                          fontSize: 12
                        }}>
                          {rankChange > 0 ? `↑${rankChange}` : `↓${Math.abs(rankChange)}`}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

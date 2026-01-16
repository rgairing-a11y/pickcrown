'use client'

import { useState, useMemo } from 'react'

/**
 * NFLPathToVictory - Shows what needs to happen for a user to win
 * 
 * For NFL reseeding events, this is simpler than fixed brackets:
 * - We don't care about matchups, just team advancement
 * - User needs their picked teams to keep winning
 */
export default function NFLPathToVictory({
  standings,
  rounds,
  teams,
  eliminations,
  myEntryId,
  allPicks // { entryId: [{ team_id, round_id }] }
}) {
  const [expanded, setExpanded] = useState(false)

  // Find my standing
  const myStanding = standings?.find(s => s.entry_id === myEntryId)
  if (!myStanding) return null

  // Find the leader (or leaders if tied)
  const leaders = standings?.filter(s => s.rank === 1) || []
  const isLeader = leaders.some(l => l.entry_id === myEntryId)

  // Get my picks
  const myPicks = allPicks?.[myEntryId] || []

  // Calculate which teams are still alive (no elimination record)
  const aliveTeams = teams.filter(t => !eliminations[t.id])
  const aliveTeamIds = new Set(aliveTeams.map(t => t.id))

  // Get remaining rounds (rounds where not all results are in)
  const completedRoundIds = new Set(Object.values(eliminations))
  const remainingRounds = rounds.filter(r => {
    // A round is remaining if there are still picks to be decided
    const roundPicks = myPicks.filter(p => p.round_id === r.id)
    return roundPicks.some(p => {
      const isEliminated = eliminations[p.team_id]
      if (!isEliminated) return true // Still alive, result pending
      const elimRound = rounds.find(rnd => rnd.id === isEliminated)
      return elimRound && elimRound.round_order >= r.round_order
    })
  })

  // Calculate my remaining possible points
  const myRemainingPoints = useMemo(() => {
    let points = 0
    myPicks.forEach(pick => {
      // Skip if team already eliminated before this round
      const elimRoundId = eliminations[pick.team_id]
      if (elimRoundId) {
        const elimRound = rounds.find(r => r.id === elimRoundId)
        const pickRound = rounds.find(r => r.id === pick.round_id)
        if (elimRound && pickRound && elimRound.round_order <= pickRound.round_order) {
          return // Already lost this pick
        }
      }
      
      // If team still alive, this pick could still earn points
      if (aliveTeamIds.has(pick.team_id)) {
        const round = rounds.find(r => r.id === pick.round_id)
        // Only count if we haven't already scored this (check if round is complete)
        const pickRound = rounds.find(r => r.id === pick.round_id)
        if (pickRound) {
          // Simple check: if team is alive and round hasn't been scored yet
          points += round?.points || 0
        }
      }
    })
    return points
  }, [myPicks, eliminations, aliveTeamIds, rounds])

  // My current points
  const myCurrentPoints = myStanding.total_points || 0
  const myMaxPossible = myCurrentPoints + myRemainingPoints

  // Calculate if I can still win
  const leaderPoints = leaders[0]?.total_points || 0
  const canStillWin = myMaxPossible >= leaderPoints

  // Find which of my teams I need to win
  const teamsINeed = useMemo(() => {
    return myPicks
      .filter(pick => {
        // Team must still be alive
        if (!aliveTeamIds.has(pick.team_id)) return false
        // And pick must not be already scored
        const elimRoundId = eliminations[pick.team_id]
        if (!elimRoundId) return true // Still alive
        const elimRound = rounds.find(r => r.id === elimRoundId)
        const pickRound = rounds.find(r => r.id === pick.round_id)
        return elimRound && pickRound && elimRound.round_order > pickRound.round_order
      })
      .map(pick => {
        const team = teams.find(t => t.id === pick.team_id)
        const round = rounds.find(r => r.id === pick.round_id)
        return { team, round, pick }
      })
      .sort((a, b) => (a.round?.round_order || 0) - (b.round?.round_order || 0))
  }, [myPicks, aliveTeamIds, eliminations, teams, rounds])

  // If all results are in, don't show path to victory
  if (aliveTeams.length <= 1) {
    return null
  }

  return (
    <div style={{
      padding: 16,
      background: isLeader ? '#f0fdf4' : canStillWin ? '#fffbeb' : '#fef2f2',
      border: `1px solid ${isLeader ? '#bbf7d0' : canStillWin ? '#fde68a' : '#fecaca'}`,
      borderRadius: 12,
      marginBottom: 24
    }}>
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>
            {isLeader ? '👑 You\'re in the Lead!' : 
             canStillWin ? '🏈 Path to Victory' : 
             '📊 Your Position'}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
            {isLeader 
              ? `${myRemainingPoints} points still in play`
              : canStillWin 
                ? `${leaderPoints - myCurrentPoints} points behind • ${myRemainingPoints} possible`
                : 'Mathematically eliminated'
            }
          </p>
        </div>
        <span style={{ fontSize: 20 }}>{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: 16 }}>
          {/* Points Breakdown */}
          <div style={{
            display: 'flex',
            gap: 16,
            marginBottom: 16,
            flexWrap: 'wrap'
          }}>
            <div style={{
              padding: 12,
              background: 'white',
              borderRadius: 8,
              textAlign: 'center',
              minWidth: 100
            }}>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{myCurrentPoints}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Current</div>
            </div>
            <div style={{
              padding: 12,
              background: 'white',
              borderRadius: 8,
              textAlign: 'center',
              minWidth: 100
            }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a' }}>
                +{myRemainingPoints}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>Possible</div>
            </div>
            <div style={{
              padding: 12,
              background: 'white',
              borderRadius: 8,
              textAlign: 'center',
              minWidth: 100
            }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>
                {myMaxPossible}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>Max Total</div>
            </div>
            {!isLeader && (
              <div style={{
                padding: 12,
                background: 'white',
                borderRadius: 8,
                textAlign: 'center',
                minWidth: 100
              }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>
                  {leaderPoints}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>Leader Has</div>
              </div>
            )}
          </div>

          {/* Teams You Need */}
          {teamsINeed.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>
                🎯 Teams You Need to Advance
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {teamsINeed.map(({ team, round, pick }, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'white',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: team?.conference === 'AFC' ? '#fee2e2' : '#dbeafe',
                        color: team?.conference === 'AFC' ? '#dc2626' : '#2563eb'
                      }}>
                        {team?.conference}
                      </span>
                      <span style={{ fontWeight: 500 }}>
                        #{team?.seed} {team?.name}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        {round?.name}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>
                        +{round?.points} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Elimination Scenarios */}
          {!isLeader && canStillWin && teamsINeed.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>
                ⚠️ If These Lose, You're Out
              </h4>
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                You need at least {Math.ceil((leaderPoints - myCurrentPoints) / 
                  (rounds[rounds.length - 1]?.points || 1))} more correct picks to have a chance.
              </p>
            </div>
          )}

          {/* Eliminated Message */}
          {!canStillWin && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: '#fee2e2',
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#991b1b' }}>
                Even if all your remaining picks are correct ({myRemainingPoints} pts),
                you can't catch the leader ({leaderPoints} pts).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

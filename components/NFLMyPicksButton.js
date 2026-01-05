'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * NFLMyPicksButton - Shows user's advancement picks for NFL reseeding events
 * 
 * Displays which teams the user picked to advance past each round,
 * with correct/incorrect indicators based on actual eliminations.
 */
export default function NFLMyPicksButton({ pool, userEmail }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [entry, setEntry] = useState(null)
  const [picks, setPicks] = useState([])
  const [rounds, setRounds] = useState([])
  const [teams, setTeams] = useState([])
  const [eliminations, setEliminations] = useState({})

  const loadMyPicks = async () => {
    if (!userEmail) return
    setLoading(true)

    try {
      // Get user's entry
      const { data: entryData } = await supabase
        .from('pool_entries')
        .select('*')
        .eq('pool_id', pool.id)
        .eq('email', userEmail.toLowerCase())
        .single()

      if (!entryData) {
        setLoading(false)
        return
      }
      setEntry(entryData)

      // Get rounds
      const { data: roundsData } = await supabase
        .from('rounds')
        .select('*')
        .eq('event_id', pool.event.id)
        .order('round_order')
      setRounds(roundsData || [])

      // Get teams
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('event_id', pool.event.id)
        .order('seed')
      setTeams(teamsData || [])

      // Get user's advancement picks
      const { data: picksData } = await supabase
        .from('advancement_picks')
        .select('*')
        .eq('pool_entry_id', entryData.id)
      setPicks(picksData || [])

      // Get actual eliminations
      const { data: elimData } = await supabase
        .from('team_eliminations')
        .select('*')
        .eq('event_id', pool.event.id)
      
      const elimMap = {}
      elimData?.forEach(e => {
        elimMap[e.team_id] = e.eliminated_in_round_id
      })
      setEliminations(elimMap)

    } catch (err) {
      console.error('Error loading picks:', err)
    }

    setLoading(false)
  }

  const handleOpen = () => {
    setIsOpen(true)
    loadMyPicks()
  }

  // Check if a pick is correct
  const isPickCorrect = (teamId, roundId) => {
    const round = rounds.find(r => r.id === roundId)
    if (!round) return null // Unknown

    const elimRoundId = eliminations[teamId]
    
    // If no elimination record, team is still alive (or champion)
    if (!elimRoundId) return true
    
    const elimRound = rounds.find(r => r.id === elimRoundId)
    if (!elimRound) return null

    // Team advanced past this round if they were eliminated in a LATER round
    return elimRound.round_order > round.round_order
  }

  // Check if result is known for a round
  const isRoundDecided = (roundId) => {
    const round = rounds.find(r => r.id === roundId)
    if (!round) return false

    // A round is decided when we know all eliminations for that round
    // For simplicity, check if any eliminations exist for this round
    return Object.values(eliminations).some(elimRoundId => elimRoundId === roundId)
  }

  // Group teams by conference
  const teamsByConference = teams.reduce((acc, team) => {
    const conf = team.conference?.toUpperCase() || 'OTHER'
    if (!acc[conf]) acc[conf] = []
    acc[conf].push(team)
    return acc
  }, {})

  if (!userEmail) return null

  return (
    <>
      <button
        onClick={handleOpen}
        style={{
          padding: '10px 20px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14
        }}
      >
        🏈 My Picks
      </button>

      {/* Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: 16
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            maxWidth: 700,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{
              padding: 20,
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 1
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20 }}>🏈 My Picks</h2>
                {entry && (
                  <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
                    {entry.entry_name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 20 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  Loading...
                </div>
              ) : !entry ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  No entry found for {userEmail}
                </div>
              ) : (
                <div>
                  {/* Legend */}
                  <div style={{
                    display: 'flex',
                    gap: 16,
                    marginBottom: 24,
                    fontSize: 13,
                    color: '#666'
                  }}>
                    <span>✅ Correct</span>
                    <span>❌ Incorrect</span>
                    <span>⏳ Pending</span>
                  </div>

                  {/* Rounds */}
                  {rounds.map(round => {
                    const roundPicks = picks.filter(p => p.round_id === round.id)
                    const isSuperBowl = round.round_order === rounds.length

                    return (
                      <div key={round.id} style={{
                        marginBottom: 24,
                        padding: 16,
                        background: isSuperBowl ? '#fef3c7' : '#f9fafb',
                        borderRadius: 8,
                        border: isSuperBowl ? '2px solid #f59e0b' : '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12
                        }}>
                          <h3 style={{ margin: 0, fontSize: 16 }}>
                            {isSuperBowl && '🏆 '}{round.name}
                          </h3>
                          <span style={{
                            fontSize: 13,
                            color: '#666',
                            background: '#e5e7eb',
                            padding: '2px 8px',
                            borderRadius: 12
                          }}>
                            {round.points} pts each
                          </span>
                        </div>

                        {roundPicks.length === 0 ? (
                          <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                            No picks for this round
                          </p>
                        ) : isSuperBowl ? (
                          // Super Bowl - single pick
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {roundPicks.map(pick => {
                              const team = teams.find(t => t.id === pick.team_id)
                              const correct = isPickCorrect(pick.team_id, pick.round_id)
                              const decided = isRoundDecided(pick.round_id) || correct !== null

                              return (
                                <div key={pick.id} style={{
                                  padding: '12px 20px',
                                  background: decided 
                                    ? (correct ? '#dcfce7' : '#fee2e2')
                                    : 'white',
                                  border: `2px solid ${
                                    decided 
                                      ? (correct ? '#16a34a' : '#ef4444')
                                      : '#d1d5db'
                                  }`,
                                  borderRadius: 8,
                                  fontWeight: 600,
                                  fontSize: 16
                                }}>
                                  <span style={{
                                    display: 'block',
                                    fontSize: 11,
                                    color: team?.conference === 'AFC' ? '#dc2626' : '#2563eb',
                                    marginBottom: 2
                                  }}>
                                    {team?.conference}
                                  </span>
                                  #{team?.seed} {team?.name}
                                  <span style={{ marginLeft: 8 }}>
                                    {decided ? (correct ? '✅' : '❌') : '⏳'}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          // Regular rounds - by conference
                          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            {['AFC', 'NFC'].map(conf => {
                              const confPicks = roundPicks.filter(p => {
                                const team = teams.find(t => t.id === p.team_id)
                                return team?.conference?.toUpperCase() === conf
                              })

                              if (confPicks.length === 0) return null

                              return (
                                <div key={conf} style={{ flex: 1, minWidth: 200 }}>
                                  <h4 style={{
                                    margin: '0 0 8px',
                                    fontSize: 13,
                                    color: conf === 'AFC' ? '#dc2626' : '#2563eb'
                                  }}>
                                    {conf}
                                  </h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {confPicks.map(pick => {
                                      const team = teams.find(t => t.id === pick.team_id)
                                      const correct = isPickCorrect(pick.team_id, pick.round_id)
                                      const hasResult = Object.keys(eliminations).length > 0

                                      return (
                                        <div key={pick.id} style={{
                                          padding: '8px 12px',
                                          background: hasResult
                                            ? (correct ? '#dcfce7' : correct === false ? '#fee2e2' : 'white')
                                            : 'white',
                                          border: `1px solid ${
                                            hasResult
                                              ? (correct ? '#16a34a' : correct === false ? '#ef4444' : '#d1d5db')
                                              : '#d1d5db'
                                          }`,
                                          borderRadius: 6,
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center'
                                        }}>
                                          <span>#{team?.seed} {team?.name}</span>
                                          <span>
                                            {hasResult 
                                              ? (correct ? '✅' : correct === false ? '❌' : '⏳')
                                              : '⏳'
                                            }
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Points Summary */}
                  <div style={{
                    marginTop: 24,
                    padding: 16,
                    background: '#f0fdf4',
                    borderRadius: 8,
                    border: '1px solid #bbf7d0'
                  }}>
                    <h4 style={{ margin: '0 0 12px' }}>Points Summary</h4>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      {rounds.map(round => {
                        const roundPicks = picks.filter(p => p.round_id === round.id)
                        const correctCount = roundPicks.filter(p => 
                          isPickCorrect(p.team_id, p.round_id) === true
                        ).length
                        const points = correctCount * round.points

                        return (
                          <div key={round.id} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 12, color: '#666' }}>{round.name}</div>
                            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{points}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                              {correctCount}/{roundPicks.length} × {round.points}
                            </div>
                          </div>
                        )
                      })}
                      <div style={{ 
                        textAlign: 'center',
                        paddingLeft: 24,
                        borderLeft: '2px solid #16a34a'
                      }}>
                        <div style={{ fontSize: 12, color: '#666' }}>Total</div>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a' }}>
                          {picks.reduce((sum, pick) => {
                            const round = rounds.find(r => r.id === pick.round_id)
                            const correct = isPickCorrect(pick.team_id, pick.round_id)
                            return sum + (correct === true ? (round?.points || 0) : 0)
                          }, 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

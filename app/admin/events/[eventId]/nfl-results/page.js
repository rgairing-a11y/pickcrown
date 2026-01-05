'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import Link from 'next/link'

/**
 * Admin page for entering results in NFL reseeding events
 * 
 * For each round, admin marks which teams were eliminated.
 * System derives advancement from elimination data.
 */
export default function NFLResultsPage() {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [teams, setTeams] = useState([])
  const [rounds, setRounds] = useState([])
  const [eliminations, setEliminations] = useState({}) // teamId -> roundId eliminated
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [eventId])

  async function loadData() {
    // Fetch event
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
    
    setEvent(eventData)

    // Fetch teams
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .eq('event_id', eventId)
      .order('seed')
    
    setTeams(teamsData || [])

    // Fetch rounds
    const { data: roundsData } = await supabase
      .from('rounds')
      .select('*')
      .eq('event_id', eventId)
      .order('round_order')
    
    setRounds(roundsData || [])

    // Fetch existing eliminations
    const { data: elimData } = await supabase
      .from('team_eliminations')
      .select('*')
      .eq('event_id', eventId)
    
    const elimMap = {}
    elimData?.forEach(e => {
      elimMap[e.team_id] = e.eliminated_in_round_id
    })
    setEliminations(elimMap)

    setLoading(false)
  }

  async function handleSetElimination(teamId, roundId) {
    setSaving(true)

    try {
      const res = await fetch(`/api/events/${eventId}/eliminations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          eliminated_in_round_id: roundId || null
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setEliminations(prev => ({
        ...prev,
        [teamId]: roundId || null
      }))
    } catch (err) {
      alert('Error saving: ' + err.message)
    }

    setSaving(false)
  }

  // Quick action: eliminate team in a specific round
  async function handleQuickEliminate(teamId, roundId) {
    await handleSetElimination(teamId, roundId)
  }

  // Clear all eliminations for a team (they're still alive)
  async function handleMarkAlive(teamId) {
    await handleSetElimination(teamId, null)
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!event?.uses_reseeding) {
    return (
      <div style={{ padding: 24 }}>
        <p>This page is for NFL-style reseeding events only.</p>
        <Link href={`/admin/events/${eventId}/results`}>
          Go to standard results page
        </Link>
      </div>
    )
  }

  // Group teams by conference
  const teamsByConf = { AFC: [], NFC: [], other: [] }
  teams.forEach(t => {
    const conf = t.conference?.toUpperCase() || 'other'
    if (teamsByConf[conf]) teamsByConf[conf].push(t)
    else teamsByConf.other.push(t)
  })

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Link href={`/admin/events/${eventId}`} style={{ color: '#3b82f6', marginBottom: 16, display: 'inline-block' }}>
        ← Back to Event
      </Link>

      <h1>🏈 NFL Results: {event.name} {event.year}</h1>
      
      <p style={{ color: '#666', marginBottom: 24 }}>
        Mark which round each team was eliminated. Leave blank if still alive.
      </p>

      {/* Instructions */}
      <div style={{
        padding: 16,
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: 8,
        marginBottom: 24
      }}>
        <strong>How it works:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
          <li>Select the round where each team was <strong>eliminated</strong></li>
          <li>If a team won the Super Bowl, leave them uneliminated</li>
          <li>Standings are calculated based on how far users predicted each team would go</li>
        </ul>
      </div>

      {/* Teams by Conference */}
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {['AFC', 'NFC'].map(conference => (
          <div key={conference} style={{ flex: 1, minWidth: 400 }}>
            <h2 style={{ 
              color: conference === 'AFC' ? '#dc2626' : '#2563eb',
              marginBottom: 16
            }}>
              {conference}
            </h2>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Team</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>Eliminated In</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {teamsByConf[conference].map(team => {
                  const eliminatedRoundId = eliminations[team.id]
                  const eliminatedRound = rounds.find(r => r.id === eliminatedRoundId)
                  const isAlive = !eliminatedRoundId

                  return (
                    <tr key={team.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 12 }}>
                        <strong>#{team.seed}</strong> {team.name}
                        {team.has_bye && (
                          <span style={{ 
                            marginLeft: 8, 
                            fontSize: 11, 
                            color: '#666',
                            background: '#f3f4f6',
                            padding: '2px 6px',
                            borderRadius: 4
                          }}>
                            BYE
                          </span>
                        )}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <select
                          value={eliminatedRoundId || ''}
                          onChange={(e) => handleSetElimination(team.id, e.target.value || null)}
                          disabled={saving}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 4,
                            border: '1px solid #d1d5db',
                            minWidth: 150
                          }}
                        >
                          <option value="">Still Alive / Champion</option>
                          {rounds.map(round => (
                            <option key={round.id} value={round.id}>
                              {round.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        {isAlive ? (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ Alive</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>
                            ❌ Out in {eliminatedRound?.name}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Quick Actions by Round */}
      <div style={{ marginTop: 48 }}>
        <h2>Quick Entry by Round</h2>
        <p style={{ color: '#666', marginBottom: 16 }}>
          Click a team to eliminate them in that round
        </p>

        {rounds.map(round => {
          // Get teams that could have been eliminated this round
          // (teams still alive going into this round)
          const teamsInRound = teams.filter(team => {
            const elimRoundId = eliminations[team.id]
            if (!elimRoundId) return true // Still alive, could be eliminated
            const elimRound = rounds.find(r => r.id === elimRoundId)
            return elimRound && elimRound.round_order >= round.round_order
          })

          // Teams actually eliminated in this round
          const eliminatedThisRound = teams.filter(t => eliminations[t.id] === round.id)

          return (
            <div key={round.id} style={{
              padding: 16,
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              marginBottom: 16
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>
                {round.name}
                <span style={{ fontWeight: 'normal', color: '#666', marginLeft: 8 }}>
                  ({round.points} pts)
                </span>
              </h3>

              <div style={{ display: 'flex', gap: 24 }}>
                {['AFC', 'NFC'].map(conf => {
                  const confTeams = teamsByConf[conf].filter(t => {
                    // Show teams that were alive going into this round
                    const elimRoundId = eliminations[t.id]
                    if (!elimRoundId) return true
                    const elimRound = rounds.find(r => r.id === elimRoundId)
                    return elimRound && elimRound.round_order >= round.round_order
                  })

                  return (
                    <div key={conf}>
                      <h4 style={{ margin: '0 0 8px 0', color: conf === 'AFC' ? '#dc2626' : '#2563eb' }}>
                        {conf}
                      </h4>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {confTeams.map(team => {
                          const isElimHere = eliminations[team.id] === round.id
                          return (
                            <button
                              key={team.id}
                              onClick={() => {
                                if (isElimHere) {
                                  handleMarkAlive(team.id)
                                } else {
                                  handleQuickEliminate(team.id, round.id)
                                }
                              }}
                              disabled={saving}
                              style={{
                                padding: '6px 12px',
                                background: isElimHere ? '#fee2e2' : '#f3f4f6',
                                border: isElimHere ? '2px solid #ef4444' : '1px solid #d1d5db',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 13
                              }}
                            >
                              #{team.seed} {team.name}
                              {isElimHere && ' ❌'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {eliminatedThisRound.length > 0 && (
                <p style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
                  Eliminated: {eliminatedThisRound.map(t => t.name).join(', ')}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div style={{ 
        marginTop: 32, 
        padding: 24, 
        background: '#f9fafb', 
        borderRadius: 12 
      }}>
        <h3 style={{ marginTop: 0 }}>Summary</h3>
        <div style={{ display: 'flex', gap: 32 }}>
          <div>
            <strong>Teams Alive:</strong>{' '}
            {teams.filter(t => !eliminations[t.id]).length}
          </div>
          <div>
            <strong>Teams Eliminated:</strong>{' '}
            {teams.filter(t => eliminations[t.id]).length}
          </div>
        </div>

        {/* Champion detection */}
        {teams.filter(t => !eliminations[t.id]).length === 1 && (
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            background: '#fef3c7',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <span style={{ fontSize: 32 }}>🏆</span>
            <div>
              <strong>Champion:</strong>{' '}
              {teams.find(t => !eliminations[t.id])?.name}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

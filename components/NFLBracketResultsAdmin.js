'use client'

// NFLBracketResultsAdmin.js
// Admin component for entering NFL Bracket event results
//
// CONCERN B - RESULT-TIME MATCHUP GENERATION (SERVER / ADMIN)
//
// This component:
// 1. Shows all matchups organized by round
// 2. Allows admin to set winner for each matchup
// 3. After a round is complete, provides button to generate next round matchups
// 4. Uses standard bracket_picks scoring (picked_team_id === winner_team_id)

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Alert } from './ui'

export default function NFLBracketResultsAdmin({ eventId, event }) {
  const [teams, setTeams] = useState([])
  const [rounds, setRounds] = useState([])
  const [matchups, setMatchups] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (eventId) {
      loadData()
    }
  }, [eventId])

  async function loadData() {
    setLoading(true)

    // Load teams
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .eq('event_id', eventId)
      .order('conference')
      .order('seed')
    setTeams(teamsData || [])

    // Load rounds
    const { data: roundsData } = await supabase
      .from('rounds')
      .select('*')
      .eq('event_id', eventId)
      .order('round_order')
    setRounds(roundsData || [])

    // Load matchups
    const { data: matchupsData } = await supabase
      .from('matchups')
      .select('*')
      .eq('event_id', eventId)
      .order('bracket_position')
    setMatchups(matchupsData || [])

    setLoading(false)
  }

  const teamMap = useMemo(() => {
    return Object.fromEntries(teams.map(t => [t.id, t]))
  }, [teams])

  // Organize matchups by round
  const roundsWithMatchups = useMemo(() => {
    return rounds.map(round => ({
      ...round,
      matchups: matchups
        .filter(m => m.round_id === round.id)
        .map(m => ({
          ...m,
          team_a: teamMap[m.team_a_id],
          team_b: teamMap[m.team_b_id],
          winner: teamMap[m.winner_team_id]
        }))
        .sort((a, b) => (a.bracket_position || 0) - (b.bracket_position || 0))
    }))
  }, [rounds, matchups, teamMap])

  // Check if a round is complete
  const isRoundComplete = (round) => {
    return round.matchups.every(m => {
      // Bye games are complete
      if (m.team_a_id && !m.team_b_id) return true
      if (!m.team_a_id && m.team_b_id) return true
      // Empty matchups are not complete
      if (!m.team_a_id && !m.team_b_id) return false
      // Real matchups need winner
      return m.winner_team_id != null
    })
  }

  // Check if next round has teams assigned
  const nextRoundHasTeams = (roundOrder) => {
    const nextRound = roundsWithMatchups.find(r => r.round_order === roundOrder + 1)
    if (!nextRound) return true // No next round
    return nextRound.matchups.some(m => m.team_a_id || m.team_b_id)
  }

  // Set winner for a matchup
  async function handleSetWinner(matchupId, winnerTeamId) {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch(`/api/admin/matchups/${matchupId}/winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_team_id: winnerTeamId })
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'CONFLICT') {
          // Winner already set, offer force option
          if (confirm('Winner already set. Override?')) {
            const forceRes = await fetch(`/api/admin/matchups/${matchupId}/winner?force=true`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ winner_team_id: winnerTeamId })
            })
            if (forceRes.ok) {
              await loadData()
              setMessage('Winner updated (forced)')
            } else {
              setError('Failed to force update')
            }
          }
        } else {
          setError(data.error || 'Failed to set winner')
        }
      } else {
        await loadData()
        setMessage('Winner set successfully')
      }
    } catch (err) {
      setError('Error: ' + err.message)
    }

    setSaving(false)
  }

  // Clear winner
  async function handleClearWinner(matchupId) {
    if (!confirm('Clear this winner? This may affect later rounds.')) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase
        .from('matchups')
        .update({ winner_team_id: null })
        .eq('id', matchupId)

      if (error) throw error

      await loadData()
      setMessage('Winner cleared')
    } catch (err) {
      setError('Error: ' + err.message)
    }

    setSaving(false)
  }

  // Generate next round matchups
  async function handleGenerateNextRound(sourceRoundOrder) {
    setGenerating(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch(
        `/api/admin/events/${eventId}/generate-next-round?sourceRoundOrder=${sourceRoundOrder}`,
        { method: 'POST' }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate matchups')
      } else {
        await loadData()
        setMessage(data.message || 'Matchups generated successfully')
      }
    } catch (err) {
      setError('Error: ' + err.message)
    }

    setGenerating(false)
  }

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div>
      {message && (
        <Alert variant="success" style={{ marginBottom: 16 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" style={{ marginBottom: 16 }}>
          {error}
        </Alert>
      )}

      {/* Rounds and Matchups */}
      {roundsWithMatchups.map((round) => {
        const complete = isRoundComplete(round)
        const hasNextRound = rounds.some(r => r.round_order === round.round_order + 1)
        const needsGeneration = complete && hasNextRound && !nextRoundHasTeams(round.round_order)
        const isReseededRound = round.round_order === 1 // After Wildcard needs reseeding

        return (
          <Card key={round.id} style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <h3 style={{ margin: 0 }}>
                {round.name}
                <span style={{
                  marginLeft: 8,
                  fontSize: 14,
                  fontWeight: 'normal',
                  color: '#666'
                }}>
                  ({round.points} pts)
                </span>
              </h3>
              <span style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 'bold',
                background: complete ? '#dcfce7' : '#fef3c7',
                color: complete ? '#166534' : '#92400e'
              }}>
                {complete ? 'Complete' : 'In Progress'}
              </span>
            </div>

            {/* Matchups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {round.matchups.map((matchup) => (
                <MatchupResultRow
                  key={matchup.id}
                  matchup={matchup}
                  onSetWinner={(teamId) => handleSetWinner(matchup.id, teamId)}
                  onClearWinner={() => handleClearWinner(matchup.id)}
                  saving={saving}
                />
              ))}
            </div>

            {/* Generate Next Round Button */}
            {needsGeneration && (
              <div style={{
                marginTop: 20,
                padding: 16,
                background: '#eff6ff',
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 12px', color: '#1e40af' }}>
                  {isReseededRound
                    ? 'All Wildcard games complete. Generate reseeded Divisional matchups?'
                    : `All ${round.name} games complete. Generate next round matchups?`}
                </p>
                <Button
                  onClick={() => handleGenerateNextRound(round.round_order)}
                  disabled={generating}
                  variant="primary"
                >
                  {generating
                    ? 'Generating...'
                    : isReseededRound
                      ? 'Generate Divisional Matchups (Reseeded)'
                      : 'Generate Next Round Matchups'}
                </Button>
              </div>
            )}
          </Card>
        )
      })}

      {/* Summary Stats */}
      <Card style={{ background: '#f9fafb' }}>
        <h3 style={{ margin: '0 0 16px' }}>Event Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a' }}>
              {matchups.filter(m => m.winner_team_id).length}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>Games Complete</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>
              {matchups.filter(m => m.team_a_id && m.team_b_id && !m.winner_team_id).length}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>Games Pending</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#6b7280' }}>
              {matchups.filter(m => !m.team_a_id || !m.team_b_id).length}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>Matchups TBD</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function MatchupResultRow({ matchup, onSetWinner, onClearWinner, saving }) {
  const { team_a, team_b, winner } = matchup
  const hasBothTeams = team_a && team_b
  const isByeGame = (team_a && !team_b) || (!team_a && team_b)
  const isEmpty = !team_a && !team_b

  if (isEmpty) {
    return (
      <div style={{
        padding: 16,
        background: '#f3f4f6',
        borderRadius: 8,
        textAlign: 'center',
        color: '#6b7280',
        fontStyle: 'italic'
      }}>
        Matchup TBD - waiting for earlier results
      </div>
    )
  }

  if (isByeGame) {
    const byeTeam = team_a || team_b
    return (
      <div style={{
        padding: 16,
        background: '#f3f4f6',
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          <strong>#{byeTeam.seed} {byeTeam.name}</strong>
          <span style={{ marginLeft: 8, color: '#6b7280' }}>(BYE)</span>
        </span>
        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Advances</span>
      </div>
    )
  }

  // Conference color
  const getConfColor = (team) => team?.conference === 'AFC' ? '#c41e3a' : '#003594'

  return (
    <div style={{
      padding: 16,
      background: '#fff',
      borderRadius: 8,
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Team A */}
        <button
          onClick={() => onSetWinner(team_a.id)}
          disabled={saving}
          style={{
            flex: 1,
            padding: 12,
            background: winner?.id === team_a.id ? '#dcfce7' : '#fff',
            border: `2px solid ${winner?.id === team_a.id ? '#16a34a' : '#e5e7eb'}`,
            borderLeft: `4px solid ${getConfColor(team_a)}`,
            borderRadius: 6,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontWeight: winner?.id === team_a.id ? 'bold' : 'normal' }}>
            #{team_a.seed} {team_a.name}
          </div>
          {winner?.id === team_a.id && (
            <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>
              WINNER
            </div>
          )}
        </button>

        <span style={{ color: '#9ca3af', fontWeight: 'bold' }}>vs</span>

        {/* Team B */}
        <button
          onClick={() => onSetWinner(team_b.id)}
          disabled={saving}
          style={{
            flex: 1,
            padding: 12,
            background: winner?.id === team_b.id ? '#dcfce7' : '#fff',
            border: `2px solid ${winner?.id === team_b.id ? '#16a34a' : '#e5e7eb'}`,
            borderLeft: `4px solid ${getConfColor(team_b)}`,
            borderRadius: 6,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontWeight: winner?.id === team_b.id ? 'bold' : 'normal' }}>
            #{team_b.seed} {team_b.name}
          </div>
          {winner?.id === team_b.id && (
            <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>
              WINNER
            </div>
          )}
        </button>

        {/* Clear button */}
        {winner && (
          <button
            onClick={onClearWinner}
            disabled={saving}
            style={{
              padding: '8px 12px',
              background: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

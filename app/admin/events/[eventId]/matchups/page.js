'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function MatchupsAdminPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [teams, setTeams] = useState([])
  const [rounds, setRounds] = useState([])
  const [matchups, setMatchups] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [selectedRound, setSelectedRound] = useState('')
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadData()
  }, [eventId])

  async function loadData() {
    setLoading(true)
    
    const eventRes = await fetch(`/api/events?id=${eventId}`)
    const eventData = await eventRes.json()
    setEvent(Array.isArray(eventData) ? eventData[0] : eventData)

    const teamsRes = await fetch(`/api/teams?eventId=${eventId}`)
    const teamsData = await teamsRes.json()
    setTeams(Array.isArray(teamsData) ? teamsData : [])

    const roundsRes = await fetch(`/api/rounds?eventId=${eventId}`)
    const roundsData = await roundsRes.json()
    setRounds(Array.isArray(roundsData) ? roundsData : [])

    const matchupsRes = await fetch(`/api/matchups?eventId=${eventId}`)
    const matchupsData = await matchupsRes.json()
    setMatchups(Array.isArray(matchupsData) ? matchupsData : [])
    
    setLoading(false)
  }

  async function handleAddMatchup(e) {
    e.preventDefault()
    if (!selectedRound || !teamA || !teamB) return
    if (teamA === teamB) {
      alert('Team A and Team B must be different')
      return
    }

    setSaving(true)

    const res = await fetch('/api/matchups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        roundId: selectedRound,
        teamAId: teamA,
        teamBId: teamB
      })
    })

    const data = await res.json()

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      setTeamA('')
      setTeamB('')
      await loadData()
    }

    setSaving(false)
  }

  async function handleSetWinner(matchupId, winnerId) {
    setSaving(true)

    const res = await fetch('/api/matchups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: matchupId, winnerTeamId: winnerId })
    })

    const data = await res.json()
    if (data.error) {
      alert('Error: ' + data.error)
    }

    await loadData()
    setSaving(false)
  }

  async function handleDeleteMatchup(matchupId) {
    if (!confirm('Delete this matchup?')) return

    const res = await fetch(`/api/matchups?id=${matchupId}`, { method: 'DELETE' })
    const data = await res.json()

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      await loadData()
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!event) {
    return <div style={{ padding: 24 }}>Event not found</div>
  }

  const matchupsByRound = rounds.map(round => ({
    round,
    matchups: matchups.filter(m => m.round_id === round.id)
  }))

  const formatTeam = (team) => {
    if (!team) return '—'
    let label = team.name
    if (team.seed) label = `#${team.seed} ${label}`
    return label
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Link href="/admin" style={{ color: '#3b82f6', fontSize: '14px' }}>
        ← Back to Admin
      </Link>

      <h1 style={{ marginTop: 16 }}>Matchups</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>{event.name} {event.year}</p>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, padding: 16, background: '#f3f4f6', borderRadius: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={`/admin/events/${eventId}/teams`} style={{ color: '#6b7280', textDecoration: 'none' }}>
            1. Teams ({teams.length})
          </Link>
          <span style={{ color: '#9ca3af' }}>→</span>
          <Link href={`/admin/events/${eventId}/rounds`} style={{ color: '#6b7280', textDecoration: 'none' }}>
            2. Rounds ({rounds.length})
          </Link>
          <span style={{ color: '#9ca3af' }}>→</span>
          <span style={{ fontWeight: 600, color: '#3b82f6' }}>3. Matchups</span>
        </div>
        <Link 
          href={`/admin/events/${eventId}/bracket-setup`}
          style={{ 
            padding: '8px 16px', 
            background: '#f59e0b', 
            color: 'white', 
            borderRadius: 6, 
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 13
          }}
        >
          🔧 Bracket Setup
        </Link>
      </div>

      {/* Prerequisites check */}
      {(teams.length === 0 || rounds.length === 0) && (
        <div style={{ padding: 16, marginBottom: 24, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, color: '#92400e' }}>
          <strong>⚠️ Setup incomplete:</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            {teams.length === 0 && <li><Link href={`/admin/events/${eventId}/teams`}>Add teams first</Link></li>}
            {rounds.length === 0 && <li><Link href={`/admin/events/${eventId}/rounds`}>Add rounds first</Link></li>}
          </ul>
        </div>
      )}

      {/* Add Matchup Form */}
      {teams.length > 0 && rounds.length > 0 && (
        <div style={{ padding: 20, background: '#f9fafb', borderRadius: 8, marginBottom: 32 }}>
          <h3 style={{ marginTop: 0 }}>Add Matchup</h3>
          <form onSubmit={handleAddMatchup} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: 4, color: '#666' }}>Round</label>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                required
                style={{ width: 200, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '14px' }}
              >
                <option value="">Select round...</option>
                {rounds.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.points} pts)</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: 4, color: '#666' }}>Team A</label>
              <select
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
                required
                style={{ width: 200, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '14px' }}
              >
                <option value="">Select team...</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{formatTeam(t)}</option>
                ))}
              </select>
            </div>
            <div style={{ padding: '10px 0', fontWeight: 'bold', color: '#666' }}>vs</div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: 4, color: '#666' }}>Team B</label>
              <select
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
                required
                style={{ width: 200, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '14px' }}
              >
                <option value="">Select team...</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{formatTeam(t)}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={saving || !selectedRound || !teamA || !teamB}
              style={{ padding: '10px 24px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
            >
              {saving ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
      )}

      {/* Matchups by Round */}
      {matchups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#666' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🎯</p>
          <p>No matchups yet</p>
          <p style={{ fontSize: '14px' }}>Create matchups above using your teams and rounds</p>
        </div>
      ) : (
        matchupsByRound.map(({ round, matchups: roundMatchups }) => (
          roundMatchups.length > 0 && (
            <div key={round.id} style={{ marginBottom: 32 }}>
              <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span>{round.name}</span>
                <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#166534', borderRadius: 12, fontSize: '14px', fontWeight: 600 }}>
                  {round.points} pt{round.points !== 1 ? 's' : ''} each
                </span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {roundMatchups.map((matchup, idx) => (
                  <div key={matchup.id} style={{ padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                      <strong>Position {matchup.bracket_position || idx + 1}</strong>
                      {round.round_order && ` → Winner advances to Round ${round.round_order + 1}, Position ${Math.ceil((matchup.bracket_position || idx + 1) / 2)}`}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleSetWinner(matchup.id, matchup.team_a?.id)}
                        disabled={saving}
                        style={{
                          flex: 1,
                          minWidth: 150,
                          padding: '12px 16px',
                          background: matchup.winner_team_id === matchup.team_a?.id ? '#dcfce7' : 'white',
                          border: matchup.winner_team_id === matchup.team_a?.id ? '2px solid #22c55e' : '1px solid #d1d5db',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: matchup.winner_team_id === matchup.team_a?.id ? 'bold' : 'normal',
                          textAlign: 'center'
                        }}
                      >
                        {formatTeam(matchup.team_a)}
                        {matchup.winner_team_id === matchup.team_a?.id && ' ✓'}
                      </button>

                      <span style={{ fontWeight: 'bold', color: '#666' }}>vs</span>

                      <button
                        onClick={() => handleSetWinner(matchup.id, matchup.team_b?.id)}
                        disabled={saving}
                        style={{
                          flex: 1,
                          minWidth: 150,
                          padding: '12px 16px',
                          background: matchup.winner_team_id === matchup.team_b?.id ? '#dcfce7' : 'white',
                          border: matchup.winner_team_id === matchup.team_b?.id ? '2px solid #22c55e' : '1px solid #d1d5db',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: matchup.winner_team_id === matchup.team_b?.id ? 'bold' : 'normal',
                          textAlign: 'center'
                        }}
                      >
                        {formatTeam(matchup.team_b)}
                        {matchup.winner_team_id === matchup.team_b?.id && ' ✓'}
                      </button>

                      {matchup.winner_team_id && (
                        <button
                          onClick={() => handleSetWinner(matchup.id, null)}
                          disabled={saving}
                          style={{ padding: '8px 12px', background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '12px' }}
                        >
                          Clear
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteMatchup(matchup.id)}
                        style={{ padding: '8px 12px', background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, cursor: 'pointer', fontSize: '12px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))
      )}

      {/* Summary */}
      {matchups.length > 0 && (
        <div style={{ marginTop: 32, padding: 16, background: '#f0fdf4', borderRadius: 8, textAlign: 'center' }}>
          <strong>{matchups.length}</strong> matchups created • 
          <strong> {matchups.filter(m => m.winner_team_id).length}</strong> results entered
        </div>
      )}

      {/* Create Pool Link */}
      {matchups.length > 0 && (
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ color: '#666', marginBottom: 16 }}>
            Done setting up? Create a pool for users to make their picks.
          </p>
          <Link
            href={`/admin/pools/new?eventId=${eventId}`}
            style={{ display: 'inline-block', padding: '12px 24px', background: '#7c3aed', color: 'white', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}
          >
            Create Pool for This Event
          </Link>
        </div>
      )}
    </div>
  )
}
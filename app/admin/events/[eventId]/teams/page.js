'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Expanded presets for common bracket formats
const TEAM_PRESETS = {
  nfl: {
    name: 'NFL Playoffs (14 teams)',
    teams: [
      { name: 'AFC #1 Seed', seed: 1, conference: 'AFC' },
      { name: 'AFC #2 Seed', seed: 2, conference: 'AFC' },
      { name: 'AFC #3 Seed', seed: 3, conference: 'AFC' },
      { name: 'AFC #4 Seed', seed: 4, conference: 'AFC' },
      { name: 'AFC #5 Seed', seed: 5, conference: 'AFC' },
      { name: 'AFC #6 Seed', seed: 6, conference: 'AFC' },
      { name: 'AFC #7 Seed', seed: 7, conference: 'AFC' },
      { name: 'NFC #1 Seed', seed: 1, conference: 'NFC' },
      { name: 'NFC #2 Seed', seed: 2, conference: 'NFC' },
      { name: 'NFC #3 Seed', seed: 3, conference: 'NFC' },
      { name: 'NFC #4 Seed', seed: 4, conference: 'NFC' },
      { name: 'NFC #5 Seed', seed: 5, conference: 'NFC' },
      { name: 'NFC #6 Seed', seed: 6, conference: 'NFC' },
      { name: 'NFC #7 Seed', seed: 7, conference: 'NFC' },
    ]
  },
  nba: {
    name: 'NBA Playoffs (16 teams)',
    teams: [
      ...Array.from({ length: 8 }, (_, i) => ({ name: `East #${i+1} Seed`, seed: i+1, conference: 'East' })),
      ...Array.from({ length: 8 }, (_, i) => ({ name: `West #${i+1} Seed`, seed: i+1, conference: 'West' })),
    ]
  },
  ncaa_mens: {
    name: 'NCAA Men\'s Basketball (64 teams)',
    teams: [
      ...Array.from({ length: 16 }, (_, i) => ({ name: `South #${i+1}`, seed: i+1, conference: 'South' })),
      ...Array.from({ length: 16 }, (_, i) => ({ name: `East #${i+1}`, seed: i+1, conference: 'East' })),
      ...Array.from({ length: 16 }, (_, i) => ({ name: `Midwest #${i+1}`, seed: i+1, conference: 'Midwest' })),
      ...Array.from({ length: 16 }, (_, i) => ({ name: `West #${i+1}`, seed: i+1, conference: 'West' })),
    ]
  },
  ncaa_womens: {
    name: 'NCAA Women\'s Basketball (64 teams)',
    teams: [
      ...Array.from({ length: 16 }, (_, i) => ({ name: `Albany #${i+1}`, seed: i+1, conference: 'Albany' })),
      ...Array.from({ length: 16 }, (_, i) => ({ name: `Portland #${i+1}`, seed: i+1, conference: 'Portland' })),
      ...Array.from({ length: 16 }, (_, i) => ({ name: `Spokane #${i+1}`, seed: i+1, conference: 'Spokane' })),
      ...Array.from({ length: 16 }, (_, i) => ({ name: `Tampa #${i+1}`, seed: i+1, conference: 'Tampa' })),
    ]
  },
  cfb: {
    name: 'CFB Playoffs (12 teams)',
    teams: Array.from({ length: 12 }, (_, i) => ({ 
      name: `#${i+1} Seed`, 
      seed: i+1, 
      conference: null 
    }))
  },
  nhl: {
    name: 'NHL Playoffs (16 teams)',
    teams: [
      ...Array.from({ length: 8 }, (_, i) => ({ name: `East #${i+1} Seed`, seed: i+1, conference: 'Eastern' })),
      ...Array.from({ length: 8 }, (_, i) => ({ name: `West #${i+1} Seed`, seed: i+1, conference: 'Western' })),
    ]
  },
  mlb: {
    name: 'MLB Playoffs (12 teams)',
    teams: [
      ...Array.from({ length: 6 }, (_, i) => ({ name: `AL #${i+1} Seed`, seed: i+1, conference: 'AL' })),
      ...Array.from({ length: 6 }, (_, i) => ({ name: `NL #${i+1} Seed`, seed: i+1, conference: 'NL' })),
    ]
  },
  worldcup: {
    name: 'World Cup Knockout (16 teams)',
    teams: Array.from({ length: 16 }, (_, i) => ({
      name: `Team ${i + 1}`,
      seed: i + 1,
      conference: null
    }))
  },
  simple_4: {
    name: 'Simple 4-Team',
    teams: Array.from({ length: 4 }, (_, i) => ({
      name: `Team ${i + 1}`,
      seed: i + 1,
      conference: null
    }))
  },
  simple_8: {
    name: 'Simple 8-Team',
    teams: Array.from({ length: 8 }, (_, i) => ({
      name: `Team ${i + 1}`,
      seed: i + 1,
      conference: null
    }))
  }
}

export default function TeamsAdminPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [teamName, setTeamName] = useState('')
  const [seed, setSeed] = useState('')
  const [conference, setConference] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadData()
  }, [eventId])

  async function loadData() {
    setLoading(true)
    
    // Load event
const eventRes = await fetch(`/api/events?id=${eventId}`)

// Debug: Check what's coming back
console.log('Status:', eventRes.status)
console.log('OK:', eventRes.ok)

// Only parse if we got a valid response
if (!eventRes.ok) {
  console.error('API error:', eventRes.status)
  return
}



    const eventData = await eventRes.json()
    setEvent(Array.isArray(eventData) ? eventData[0] : eventData)

    // Load teams
    const teamsRes = await fetch(`/api/teams?eventId=${eventId}`)
    const teamsData = await teamsRes.json()
    setTeams(Array.isArray(teamsData) ? teamsData : [])
    
    setLoading(false)
  }

  async function handleAddTeam(e) {
    e.preventDefault()
    if (!teamName.trim()) return

    setSaving(true)

    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        name: teamName.trim(),
        seed: seed || null,
        conference: conference || null
      })
    })

    const data = await res.json()

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      setTeamName('')
      setSeed('')
      setConference('')
      await loadData()
    }

    setSaving(false)
  }

  async function handleDeleteTeam(teamId) {
    if (!confirm('Delete this team?')) return

    const res = await fetch(`/api/teams?id=${teamId}`, { method: 'DELETE' })
    const data = await res.json()

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      await loadData()
    }
  }

  async function handleApplyPreset(presetKey) {
    const preset = TEAM_PRESETS[presetKey]
    if (!preset) return
    
    if (!confirm(`Add ${preset.teams.length} placeholder teams for ${preset.name}? You can rename them later.`)) return

    setSaving(true)

    for (const team of preset.teams) {
      await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name: team.name,
          seed: team.seed,
          conference: team.conference
        })
      })
    }

    await loadData()
    setSaving(false)
  }

  async function handleUpdateTeamName(teamId, newName) {
    if (!newName.trim()) return

    const res = await fetch('/api/teams', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: teamId, name: newName.trim() })
    })

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

  // Group teams by conference
  const conferences = [...new Set(teams.map(t => t.conference).filter(Boolean))]
  const teamsWithoutConference = teams.filter(t => !t.conference)

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Link href="/admin" style={{ color: '#3b82f6', fontSize: '14px' }}>
        ← Back to Admin
      </Link>

      <h1 style={{ marginTop: 16 }}>Teams</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>{event.name} {event.year}</p>

      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 24,
        padding: 16,
        background: '#f3f4f6',
        borderRadius: 8,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 600, color: '#3b82f6' }}>1. Teams</span>
        <span style={{ color: '#9ca3af' }}>→</span>
        <Link href={`/admin/events/${eventId}/rounds`} style={{ color: '#6b7280', textDecoration: 'none' }}>
          2. Rounds
        </Link>
        <span style={{ color: '#9ca3af' }}>→</span>
        <Link href={`/admin/events/${eventId}/matchups`} style={{ color: '#6b7280', textDecoration: 'none' }}>
          3. Matchups
        </Link>
      </div>

      {/* Add Team Form */}
      <div style={{ padding: 20, background: '#f9fafb', borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Add Team</h3>
        <form onSubmit={handleAddTeam} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name"
            required
            style={{ flex: 2, minWidth: 200, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '14px' }}
          />
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Seed"
            min="1"
            style={{ width: 80, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '14px' }}
          />
          <input
            type="text"
            value={conference}
            onChange={(e) => setConference(e.target.value)}
            placeholder="Group/Conference"
            style={{ width: 140, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '14px' }}
          />
          <button
            type="submit"
            disabled={saving || !teamName.trim()}
            style={{ padding: '10px 24px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
          >
            {saving ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      {/* Quick Start Presets */}
      {teams.length === 0 && (
        <div style={{ padding: 20, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, color: '#0369a1' }}>🚀 Quick Start Presets</h3>
          <p style={{ color: '#0c4a6e', fontSize: '14px', marginBottom: 16 }}>
            Add placeholder teams, then rename them with actual team names.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(TEAM_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handleApplyPreset(key)}
                disabled={saving}
                style={{
                  padding: '8px 14px',
                  background: 'white',
                  color: '#0369a1',
                  border: '1px solid #0369a1',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Teams List */}
      {teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#666' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🏆</p>
          <p>No teams yet</p>
          <p style={{ fontSize: '14px' }}>Add teams above or use a Quick Start preset</p>
        </div>
      ) : (
        <>
          {/* Teams grouped by conference */}
          {conferences.map(conf => {
            const confTeams = teams.filter(t => t.conference === conf).sort((a, b) => (a.seed || 99) - (b.seed || 99))
            return (
              <div key={conf} style={{ marginBottom: 32 }}>
                <h3 style={{ marginBottom: 12 }}>{conf} ({confTeams.length})</h3>
                <TeamTable teams={confTeams} onDelete={handleDeleteTeam} onUpdate={handleUpdateTeamName} />
              </div>
            )
          })}
          
          {/* Teams without conference */}
          {teamsWithoutConference.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              {conferences.length > 0 && <h3 style={{ marginBottom: 12 }}>Other Teams ({teamsWithoutConference.length})</h3>}
              <TeamTable teams={teamsWithoutConference} onDelete={handleDeleteTeam} onUpdate={handleUpdateTeamName} />
            </div>
          )}

          <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8, textAlign: 'center' }}>
            <strong>{teams.length}</strong> teams total
          </div>
        </>
      )}

      {/* Next Step */}
      {teams.length > 0 && (
        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <Link
            href={`/admin/events/${eventId}/rounds`}
            style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}
          >
            Next: Add Rounds →
          </Link>
        </div>
      )}
    </div>
  )
}

// Editable Team Table Component
function TeamTable({ teams, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  function startEdit(team) {
    setEditingId(team.id)
    setEditName(team.name)
  }

  function saveEdit(teamId) {
    if (editName.trim()) {
      onUpdate(teamId, editName.trim())
    }
    setEditingId(null)
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
      <thead>
        <tr style={{ background: '#f3f4f6' }}>
          <th style={{ padding: 10, textAlign: 'left', width: 60 }}>Seed</th>
          <th style={{ padding: 10, textAlign: 'left' }}>Team Name</th>
          <th style={{ padding: 10, width: 120 }}></th>
        </tr>
      </thead>
      <tbody>
        {teams.map(team => (
          <tr key={team.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: 10 }}>{team.seed ? `#${team.seed}` : '—'}</td>
            <td style={{ padding: 10 }}>
              {editingId === team.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => saveEdit(team.id)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(team.id)}
                  autoFocus
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #3b82f6', borderRadius: 4, fontSize: '14px' }}
                />
              ) : (
                <span onClick={() => startEdit(team)} style={{ cursor: 'pointer' }} title="Click to edit">
                  {team.name}
                </span>
              )}
            </td>
            <td style={{ padding: 10, textAlign: 'right' }}>
              <button onClick={() => startEdit(team)} style={{ padding: '4px 8px', marginRight: 8, background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: 4, cursor: 'pointer', fontSize: '12px' }}>
                Edit
              </button>
              <button onClick={() => onDelete(team.id)} style={{ padding: '4px 8px', background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 4, cursor: 'pointer', fontSize: '12px' }}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
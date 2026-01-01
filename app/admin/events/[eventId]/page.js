'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Presets for common round structures
const PRESETS = {
  nfl: {
    name: 'NFL Playoffs',
    rounds: [
      { name: 'Wild Card', round_order: 1, points: 1 },
      { name: 'Divisional', round_order: 2, points: 2 },
      { name: 'Conference Championship', round_order: 3, points: 4 },
      { name: 'Super Bowl', round_order: 4, points: 8 },
    ]
  },
  nba: {
    name: 'NBA Playoffs',
    rounds: [
      { name: 'First Round', round_order: 1, points: 1 },
      { name: 'Conference Semifinals', round_order: 2, points: 2 },
      { name: 'Conference Finals', round_order: 3, points: 4 },
      { name: 'NBA Finals', round_order: 4, points: 8 },
    ]
  },
  march_madness: {
    name: 'March Madness',
    rounds: [
      { name: 'Round of 64', round_order: 1, points: 1 },
      { name: 'Round of 32', round_order: 2, points: 2 },
      { name: 'Sweet 16', round_order: 3, points: 4 },
      { name: 'Elite 8', round_order: 4, points: 8 },
      { name: 'Final Four', round_order: 5, points: 16 },
      { name: 'Championship', round_order: 6, points: 32 },
    ]
  },
  worldcup: {
    name: 'World Cup Knockout',
    rounds: [
      { name: 'Round of 16', round_order: 1, points: 1 },
      { name: 'Quarterfinals', round_order: 2, points: 2 },
      { name: 'Semifinals', round_order: 3, points: 4 },
      { name: 'Final', round_order: 4, points: 8 },
    ]
  },
  simple_4: {
    name: 'Simple 4-Team',
    rounds: [
      { name: 'Semifinals', round_order: 1, points: 1 },
      { name: 'Final', round_order: 2, points: 2 },
    ]
  }
}

export default function RoundsAdminPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [rounds, setRounds] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [roundName, setRoundName] = useState('')
  const [roundOrder, setRoundOrder] = useState('')
  const [points, setPoints] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadData()
  }, [eventId])

  async function loadData() {
    setLoading(true)
    
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
    
    setEvent(eventData)

    const { data: roundsData } = await supabase
      .from('rounds')
      .select('*')
      .eq('event_id', eventId)
      .order('round_order')

    setRounds(roundsData || [])

    const { data: teamsData } = await supabase
      .from('teams')
      .select('id')
      .eq('event_id', eventId)

    setTeams(teamsData || [])
    setLoading(false)
  }

  async function handleAddRound(e) {
    e.preventDefault()
    if (!roundName.trim() || !roundOrder || !points) return

    setSaving(true)

    const { error } = await supabase
      .from('rounds')
      .insert({
        event_id: eventId,
        name: roundName.trim(),
        round_order: parseInt(roundOrder),
        points: parseInt(points)
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setRoundName('')
      setRoundOrder((parseInt(roundOrder) + 1).toString())
      setPoints('')
      await loadData()
    }

    setSaving(false)
  }

  async function handleDeleteRound(roundId) {
    if (!confirm('Delete this round? This will also delete all matchups in this round.')) return

    const { error } = await supabase
      .from('rounds')
      .delete()
      .eq('id', roundId)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      await loadData()
    }
  }

  async function handleApplyPreset(presetKey) {
    const preset = PRESETS[presetKey]
    if (!preset) return
    
    if (!confirm(`Add ${preset.rounds.length} rounds for ${preset.name}?`)) return

    setSaving(true)

    for (const round of preset.rounds) {
      await supabase.from('rounds').insert({
        event_id: eventId,
        ...round
      })
    }

    await loadData()
    setSaving(false)
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!event) {
    return <div style={{ padding: 24 }}>Event not found</div>
  }

  const totalPoints = rounds.reduce((sum, r) => sum + r.points, 0)

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <Link href="/admin" style={{ color: '#3b82f6', fontSize: '14px' }}>
        ← Back to Admin
      </Link>

      <h1 style={{ marginTop: 16 }}>Rounds</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>{event.name}</p>

      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 24,
        padding: 16,
        background: '#f3f4f6',
        borderRadius: 8,
        flexWrap: 'wrap'
      }}>
        <Link
          href={`/admin/events/${eventId}/teams`}
          style={{ color: '#6b7280', textDecoration: 'none' }}
        >
          1. Teams ({teams.length})
        </Link>
        <span style={{ alignSelf: 'center', color: '#9ca3af' }}>→</span>
        <span style={{ fontWeight: 600, color: '#3b82f6' }}>
          2. Rounds
        </span>
        <span style={{ alignSelf: 'center', color: '#9ca3af' }}>→</span>
        <Link
          href={`/admin/events/${eventId}/matchups`}
          style={{ color: '#6b7280', textDecoration: 'none' }}
        >
          3. Matchups
        </Link>
      </div>

      {/* Shortcuts */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        <Link
          href={`/admin/events/${eventId}/clone`}
          style={{
            padding: '8px 16px',
            background: '#dbeafe',
            color: '#1d4ed8',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: 14
          }}
        >
          📋 Clone Event
        </Link>
        <Link
          href={`/admin/events/${eventId}/import-bracket`}
          style={{
            padding: '8px 16px',
            background: '#dcfce7',
            color: '#166534',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: 14
          }}
        >
          📥 Import Teams (CSV)
        </Link>
        <Link
          href={`/admin/events/${eventId}/categories`}
          style={{
            padding: '8px 16px',
            background: '#fef3c7',
            color: '#92400e',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: 14
          }}
        >
          📝 Categories
        </Link>
        <Link
          href={`/admin/events/${eventId}/results`}
          style={{
            padding: '8px 16px',
            background: '#fee2e2',
            color: '#b91c1c',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: 14
          }}
        >
          🏆 Results
        </Link>
      </div>

      {/* Add Round Form */}
      <div style={{ 
        padding: 20, 
        background: '#f9fafb', 
        borderRadius: 8,
        marginBottom: 24
      }}>
        <h3 style={{ marginTop: 0 }}>Add Round</h3>
        <form onSubmit={handleAddRound} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={roundName}
            onChange={(e) => setRoundName(e.target.value)}
            placeholder="Round name"
            required
            style={{
              flex: 2,
              minWidth: 150,
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: '14px'
            }}
          />
          <input
            type="number"
            value={roundOrder}
            onChange={(e) => setRoundOrder(e.target.value)}
            placeholder="Order"
            min="1"
            required
            style={{
              width: 80,
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: '14px'
            }}
          />
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="Points"
            min="1"
            required
            style={{
              width: 80,
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: '14px'
            }}
          />
          <button
            type="submit"
            disabled={saving || !roundName.trim()}
            style={{
              padding: '10px 24px',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {saving ? 'Adding...' : 'Add'}
          </button>
        </form>
        <p style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
          💡 Tip: Use Fibonacci points (1, 2, 4, 8, 16...) so later rounds are worth more
        </p>
      </div>

      {/* Quick Start Presets */}
      {rounds.length === 0 && (
        <div style={{ 
          padding: 20, 
          background: '#f0f9ff', 
          border: '1px solid #bae6fd',
          borderRadius: 8,
          marginBottom: 24
        }}>
          <h3 style={{ marginTop: 0, color: '#0369a1' }}>🚀 Quick Start</h3>
          <p style={{ color: '#0c4a6e', fontSize: '14px', marginBottom: 16 }}>
            Use a preset for common tournament structures.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handleApplyPreset(key)}
                disabled={saving}
                style={{
                  padding: '10px 16px',
                  background: 'white',
                  color: '#0369a1',
                  border: '1px solid #0369a1',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rounds List */}
      {rounds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#666' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🏆</p>
          <p>No rounds yet</p>
          <p style={{ fontSize: '14px' }}>Add rounds above or use a Quick Start preset</p>
        </div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: 12, textAlign: 'left', width: 60 }}>Order</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Round Name</th>
                <th style={{ padding: 12, textAlign: 'center', width: 100 }}>Points</th>
                <th style={{ padding: 12, width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {rounds.map(round => (
                <tr key={round.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 12 }}>{round.round_order}</td>
                  <td style={{ padding: 12, fontWeight: 500 }}>{round.name}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: '#dcfce7',
                      color: '#166534',
                      borderRadius: 12,
                      fontWeight: 600
                    }}>
                      {round.points} pt{round.points !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteRound(round.id)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        color: '#dc2626',
                        border: '1px solid #dc2626',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Points */}
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            background: '#f0fdf4', 
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <strong>Total possible points per entry:</strong> {totalPoints}
          </div>
        </>
      )}

      {/* Next Step */}
      {rounds.length > 0 && (
        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <Link
            href={`/admin/events/${eventId}/matchups`}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Next: Create Matchups →
          </Link>
        </div>
      )}
    </div>
  )
}
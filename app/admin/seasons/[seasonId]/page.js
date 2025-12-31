'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ManageSeasonPage({ params }) {
  const [seasonId, setSeasonId] = useState(null)
  const [season, setSeason] = useState(null)
  const [seasonEvents, setSeasonEvents] = useState([])
  const [availableEvents, setAvailableEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    params.then(p => setSeasonId(p.seasonId))
  }, [params])

  useEffect(() => {
    if (seasonId) loadData()
  }, [seasonId])

  async function loadData() {
    setLoading(true)

    // Get season
    const { data: seasonData } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', seasonId)
      .single()

    setSeason(seasonData)

    // Get events in this season
    const { data: inSeason } = await supabase
      .from('events')
      .select('*')
      .eq('season_id', seasonId)
      .order('start_time', { ascending: true })

    setSeasonEvents(inSeason || [])

    // Get events NOT in any season (available to add)
    const { data: available } = await supabase
      .from('events')
      .select('*')
      .is('season_id', null)
      .order('start_time', { ascending: false })

    setAvailableEvents(available || [])

    setLoading(false)
  }

  async function addEventToSeason(eventId) {
    setSaving(true)
    
    const res = await fetch('/api/seasons/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seasonId, eventId })
    })

    if (res.ok) {
      await loadData()
    } else {
      alert('Failed to add event')
    }
    
    setSaving(false)
  }

  async function removeEventFromSeason(eventId) {
    if (!confirm('Remove this event from the season?')) return
    
    setSaving(true)
    
    const res = await fetch('/api/seasons/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId })
    })

    if (res.ok) {
      await loadData()
    } else {
      alert('Failed to remove event')
    }
    
    setSaving(false)
  }

  async function deleteSeason() {
    if (!confirm(`Delete "${season.name}"? This will remove the season but keep all events.`)) return
    
    const res = await fetch(`/api/seasons?id=${seasonId}`, {
      method: 'DELETE'
    })

    if (res.ok) {
      window.location.href = '/admin/seasons'
    } else {
      alert('Failed to delete season')
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!season) {
    return <div style={{ padding: 24 }}>Season not found</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Link href="/admin/seasons" style={{ color: '#3b82f6', fontSize: 14 }}>
        ← Back to Seasons
      </Link>

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginTop: 16,
        marginBottom: 32
      }}>
        <div>
          <h1 style={{ margin: '0 0 4px' }}>{season.name}</h1>
          {season.description && (
            <p style={{ margin: 0, color: '#666' }}>{season.description}</p>
          )}
        </div>
        <Link
          href={`/season/${seasonId}/standings`}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          View Standings
        </Link>
      </div>

      {/* Events in Season */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>
          📊 Events in This Season ({seasonEvents.length})
        </h2>

        {seasonEvents.length === 0 ? (
          <div style={{
            padding: 32,
            background: '#f9fafb',
            borderRadius: 8,
            textAlign: 'center',
            color: '#666'
          }}>
            No events added yet. Add events below.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {seasonEvents.map(event => (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: 'white',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{event.name}</span>
                  <span style={{ color: '#666', marginLeft: 8 }}>({event.year})</span>
                  <span style={{
                    marginLeft: 12,
                    padding: '2px 8px',
                    background: event.status === 'completed' ? '#dcfce7' : '#fef3c7',
                    color: event.status === 'completed' ? '#166534' : '#92400e',
                    borderRadius: 12,
                    fontSize: 12
                  }}>
                    {event.status || 'upcoming'}
                  </span>
                </div>
                <button
                  onClick={() => removeEventFromSeason(event.id)}
                  disabled={saving}
                  style={{
                    padding: '6px 12px',
                    background: 'white',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Events */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>
          ➕ Add Events ({availableEvents.length} available)
        </h2>

        {availableEvents.length === 0 ? (
          <div style={{
            padding: 32,
            background: '#f9fafb',
            borderRadius: 8,
            textAlign: 'center',
            color: '#666'
          }}>
            All events are already in a season.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {availableEvents.map(event => (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{event.name}</span>
                  <span style={{ color: '#666', marginLeft: 8 }}>({event.year})</span>
                  <span style={{ color: '#999', marginLeft: 8, fontSize: 13 }}>
                    {event.event_type}
                  </span>
                </div>
                <button
                  onClick={() => addEventToSeason(event.id)}
                  disabled={saving}
                  style={{
                    padding: '6px 16px',
                    background: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div style={{
        marginTop: 48,
        padding: 20,
        background: '#fef2f2',
        borderRadius: 8,
        border: '1px solid #fecaca'
      }}>
        <h3 style={{ margin: '0 0 12px', color: '#dc2626' }}>⚠️ Danger Zone</h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#991b1b' }}>
          Delete this season. Events will be preserved but removed from the season.
        </p>
        <button
          onClick={deleteSeason}
          style={{
            padding: '10px 20px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Delete Season
        </button>
      </div>
    </div>
  )
}

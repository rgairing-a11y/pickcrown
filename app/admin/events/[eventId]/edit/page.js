'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditEventPage({ params }) {
  const router = useRouter()
  const [eventId, setEventId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [eventType, setEventType] = useState('bracket')
  const [startTime, setStartTime] = useState('')
  const [status, setStatus] = useState('upcoming')

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadEvent()
  }, [eventId])

  async function loadEvent() {
    setLoading(true)
    
   const res = await fetch(`/api/events?id=${eventId}`)
    const data = await res.json()
    const event = Array.isArray(data) ? data[0] : data

    if (event) {
      setName(event.name || '')
      setYear(event.year?.toString() || '')
      setEventType(event.event_type || 'bracket')
      setStatus(event.status || 'upcoming')
      
      if (event.start_time) {
        const dt = new Date(event.start_time)
        setStartTime(dt.toISOString().slice(0, 16))
      }
    }
    
    setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim() || !year || !startTime) return

    setSaving(true)

    const res = await fetch('/api/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: eventId,
        name: name.trim(),
        year: parseInt(year),
        event_type: eventType,
        start_time: new Date(startTime).toISOString(),
        status
      })
    })

    const data = await res.json()

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      alert('Event saved!')
    }

    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this event? This will delete all teams, rounds, matchups, categories, and picks!')) return
    if (!confirm('Are you REALLY sure? This cannot be undone.')) return

    const res = await fetch(`/api/events?id=${eventId}`, { method: 'DELETE' })
    const data = await res.json()

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      router.push('/admin')
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  const isBracket = eventType === 'bracket'

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Link href="/admin" style={{ color: '#3b82f6', fontSize: '14px' }}>
        ← Back to Admin
      </Link>

      <h1 style={{ marginTop: 16 }}>Edit Event</h1>

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Event Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., NFL Playoffs 2025"
            required
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Year *</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2025"
              required
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '16px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Event Type *</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '16px' }}
            >
              <option value="bracket">Bracket</option>
              <option value="pick_one">Pick One (Categories)</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Start Time (Picks Lock) *</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '16px' }}
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>Picks lock at this time</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '16px' }}
          >
            <option value="upcoming">Upcoming</option>
            <option value="locked">Locked (In Progress)</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim() || !year || !startTime}
          style={{ width: '100%', padding: '14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, fontSize: '16px', fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}
        >
          {saving ? 'Saving...' : 'Save Event'}
        </button>
      </form>

      {/* Setup Links */}
      <div style={{ padding: 20, background: '#f0f9ff', borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, color: '#0369a1' }}>Setup</h3>
        
        {isBracket ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href={`/admin/events/${eventId}/teams`} style={{ color: '#3b82f6' }}>
              1. Teams →
            </Link>
            <Link href={`/admin/events/${eventId}/rounds`} style={{ color: '#3b82f6' }}>
              2. Rounds →
            </Link>
            <Link href={`/admin/events/${eventId}/matchups`} style={{ color: '#3b82f6' }}>
              3. Matchups →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href={`/admin/events/${eventId}/categories`} style={{ color: '#3b82f6' }}>
              Categories →
            </Link>
          </div>
        )}
        
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #bae6fd' }}>
          <Link href={`/admin/events/${eventId}/results`} style={{ color: '#3b82f6' }}>
            Enter Results →
          </Link>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ padding: 20, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
        <h3 style={{ marginTop: 0, color: '#dc2626' }}>Danger Zone</h3>
        <p style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: 16 }}>
          Deleting this event will remove all teams, rounds, matchups, categories, pools, and picks.
        </p>
        <button
          onClick={handleDelete}
          style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
        >
          Delete Event
        </button>
      </div>
    </div>
  )
}
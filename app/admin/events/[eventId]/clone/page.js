'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase client missing env vars')
  }

  return createClient(url, key)
}

export default function CloneEventPage({ params }) {
  const router = useRouter()
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cloning, setCloning] = useState(false)
  const [result, setResult] = useState(null)

  // Form state
  const [newName, setNewName] = useState('')
  const [newYear, setNewYear] = useState('')
  const [newStartTime, setNewStartTime] = useState('')

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadEvent()
  }, [eventId])

  async function loadEvent() {
    setLoading(true)
    
    const { data } = await supabase
      .from('events')
      .select('*, categories(id), rounds:rounds(id), teams:teams(id), matchups:matchups(id)')
      .eq('id', eventId)
      .single()
    
    if (data) {
      setEvent(data)
      setNewName(data.name)
      setNewYear((data.year + 1).toString())
    }
    setLoading(false)
  }

  async function handleClone(e) {
    e.preventDefault()
    setCloning(true)
    setResult(null)

    try {
      const res = await fetch('/api/events/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          newName: newName.trim(),
          newYear: parseInt(newYear),
          newStartTime: newStartTime || null
        })
      })

      const data = await res.json()

      if (data.success) {
        setResult({
          success: true,
          event: data.event,
          cloned: data.cloned
        })
      } else {
        setResult({ error: data.error })
      }
    } catch (err) {
      setResult({ error: err.message })
    }

    setCloning(false)
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!event) {
    return <div style={{ padding: 24 }}>Event not found</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Link href={`/admin/events/${eventId}`} style={{ color: '#3b82f6', fontSize: 14 }}>
        ← Back to Event
      </Link>

      <h1 style={{ marginTop: 16 }}>📋 Clone Event</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Create a copy of "{event.name}" for a new year or instance.
      </p>

      {/* Source Event Info */}
      <div style={{
        padding: 16,
        background: '#f3f4f6',
        borderRadius: 8,
        marginBottom: 24
      }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#6b7280' }}>Source Event</h3>
        <div style={{ fontWeight: 600, fontSize: 18 }}>{event.name} {event.year}</div>
        <div style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>
          <span style={{ marginRight: 16 }}>📊 {event.categories?.length || 0} categories</span>
          <span style={{ marginRight: 16 }}>🏆 {event.rounds?.length || 0} rounds</span>
          <span style={{ marginRight: 16 }}>👥 {event.teams?.length || 0} teams</span>
          <span>⚔️ {event.matchups?.length || 0} matchups</span>
        </div>
      </div>

      {/* Clone Form */}
      {!result?.success && (
        <form onSubmit={handleClone}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              New Event Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Year
            </label>
            <input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              required
              style={{
                width: 120,
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Start Time (optional)
            </label>
            <input
              type="datetime-local"
              value={newStartTime}
              onChange={(e) => setNewStartTime(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            />
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              Leave blank to set later
            </p>
          </div>

          {result?.error && (
            <div style={{
              padding: 12,
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: 8,
              marginBottom: 16
            }}>
              {result.error}
            </div>
          )}

          <button
            type="submit"
            disabled={cloning}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: cloning ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            {cloning ? 'Cloning...' : '📋 Clone Event'}
          </button>
        </form>
      )}

      {/* Success */}
      {result?.success && (
        <div style={{
          padding: 20,
          background: '#dcfce7',
          borderRadius: 12,
          border: '2px solid #22c55e'
        }}>
          <h3 style={{ margin: '0 0 16px', color: '#166534' }}>✅ Event Cloned!</h3>
          
          <div style={{ marginBottom: 16 }}>
            <strong>{result.event.name} {result.event.year}</strong>
          </div>

          <div style={{ fontSize: 14, color: '#166534', marginBottom: 16 }}>
            Cloned:
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li>{result.cloned.categories} categories</li>
              <li>{result.cloned.rounds} rounds</li>
              <li>{result.cloned.teams} teams</li>
              <li>{result.cloned.matchups} matchups</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              href={`/admin/events/${result.event.id}`}
              style={{
                padding: '10px 20px',
                background: '#22c55e',
                color: 'white',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Edit New Event →
            </Link>
            <Link
              href="/admin"
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#374151',
                borderRadius: 6,
                textDecoration: 'none',
                border: '1px solid #d1d5db'
              }}
            >
              Back to Admin
            </Link>
          </div>
        </div>
      )}

      {/* What Gets Cloned */}
      <div style={{
        marginTop: 32,
        padding: 16,
        background: '#f0f9ff',
        borderRadius: 8,
        border: '1px solid #bae6fd'
      }}>
        <h4 style={{ margin: '0 0 8px', color: '#0369a1' }}>What gets cloned:</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#0c4a6e', fontSize: 14 }}>
          <li>Categories and options (without correct answers)</li>
          <li>Rounds with point values</li>
          <li>Teams with seeds and regions</li>
          <li>Matchup structure (without results)</li>
        </ul>
        
        <h4 style={{ margin: '16px 0 8px', color: '#0369a1' }}>What doesn't get cloned:</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#0c4a6e', fontSize: 14 }}>
          <li>Season assignment</li>
          <li>Results and winners</li>
          <li>Pools and entries</li>
          <li>Phases (need manual setup)</li>
        </ul>
      </div>
    </div>
  )
}

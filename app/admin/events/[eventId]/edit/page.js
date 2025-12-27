'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditEventPage({ params }) {
  const router = useRouter()
  const [eventId, setEventId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [eventType, setEventType] = useState('pick_one')
  const [startTime, setStartTime] = useState('')

  useEffect(() => {
    params.then(p => {
      setEventId(p.eventId)
    })
  }, [params])

  useEffect(() => {
    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  async function loadEvent() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (data) {
      setName(data.name)
      setYear(data.year)
      setEventType(data.event_type || 'pick_one')
      // Convert to datetime-local format
      const dt = new Date(data.start_time)
      const localDateTime = dt.toISOString().slice(0, 16)
      setStartTime(localDateTime)
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('events')
      .update({
        name,
        year: parseInt(year),
        event_type: eventType,
        start_time: new Date(startTime).toISOString()
      })
      .eq('id', eventId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push('/admin')
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin" style={{ color: '#0070f3' }}>
          ← Back to Admin
        </Link>
      </div>

      <h1>Edit Event</h1>

      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: 24
      }}>
        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Event Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '1px solid #ccc',
              borderRadius: 6,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Year *
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '1px solid #ccc',
              borderRadius: 6,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Event Type *
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '1px solid #ccc',
              borderRadius: 6
            }}
          >
            <option value="pick_one">Pick One (Oscars style)</option>
            <option value="bracket">Bracket (NFL Playoffs style)</option>
            <option value="hybrid">Hybrid (WrestleMania style)</option>
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Start Time (picks lock at this time) *
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '1px solid #ccc',
              borderRadius: 6,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1,
              padding: 14,
              fontSize: 16,
              fontWeight: 'bold',
              background: saving ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/admin"
            style={{
              padding: 14,
              fontSize: 16,
              color: '#666',
              textDecoration: 'none',
              borderRadius: 6,
              border: '1px solid #ccc',
              textAlign: 'center'
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
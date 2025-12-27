'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function NewPoolPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedEventId = searchParams.get('eventId')

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [eventId, setEventId] = useState(preselectedEventId || '')

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    if (preselectedEventId) {
      setEventId(preselectedEventId)
    }
  }, [preselectedEventId])

  async function loadEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: false })

    setEvents(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !eventId) return

    setSaving(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('pools')
      .insert({
        name: name.trim(),
        event_id: eventId
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    // Redirect to admin with success
    router.push('/admin')
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin" style={{ color: '#0070f3' }}>
          ← Back to Admin
        </Link>
      </div>

      <h1>Create New Pool</h1>

      {events.length === 0 ? (
        <div style={{
          background: '#fff3cd',
          padding: 16,
          borderRadius: 8,
          marginTop: 24
        }}>
          <p style={{ margin: 0 }}>
            You need to create an event first before creating a pool.
          </p>
          <Link 
            href="/admin/events/new"
            style={{ 
              display: 'inline-block',
              marginTop: 12,
              color: '#0070f3',
              fontWeight: 'bold'
            }}
          >
            Create an Event →
          </Link>
        </div>
      ) : (
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
              Pool Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Family Oscar Pool, Office WrestleMania"
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

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Event *
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: 12,
                fontSize: 16,
                border: '1px solid #ccc',
                borderRadius: 6
              }}
            >
              <option value="">-- Select an Event --</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} ({event.year})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving || !name.trim() || !eventId}
            style={{
              width: '100%',
              padding: 14,
              fontSize: 16,
              fontWeight: 'bold',
              background: (saving || !name.trim() || !eventId) ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: (saving || !name.trim() || !eventId) ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Creating...' : 'Create Pool'}
          </button>
        </form>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewSeasonPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          year: parseInt(year)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create season')
        setSaving(false)
        return
      }

      // Redirect to manage page
      router.push(`/admin/seasons/${data.id}`)
    } catch (err) {
      setError('Error: ' + err.message)
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 500, margin: '0 auto' }}>
      <Link href="/admin/seasons" style={{ color: '#3b82f6', fontSize: 14 }}>
        ← Back to Seasons
      </Link>
      
      <h1 style={{ marginTop: 16, marginBottom: 8 }}>Create New Season</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>
        Group multiple events together for cumulative standings.
      </p>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            padding: 12,
            marginBottom: 20,
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#dc2626',
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
            Season Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Entertainment Awards 2025"
            required
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '2px solid #e5e7eb',
              borderRadius: 8
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Oscars, Grammys, Emmys, Golden Globes, and more"
            rows={3}
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '2px solid #e5e7eb',
              borderRadius: 8
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
            Year *
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="2020"
            max="2030"
            required
            style={{
              width: 120,
              padding: 12,
              fontSize: 16,
              border: '2px solid #e5e7eb',
              borderRadius: 8
            }}
          />
        </div>

        <div style={{ 
          padding: 16, 
          background: '#f0f9ff', 
          borderRadius: 8, 
          marginBottom: 24,
          fontSize: 14,
          color: '#0369a1'
        }}>
          <strong>What happens next:</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            <li>Create the season</li>
            <li>Add events to the season</li>
            <li>Participants accumulate points across all events</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          style={{
            width: '100%',
            padding: 14,
            fontSize: 16,
            fontWeight: 600,
            background: saving ? '#9ca3af' : '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Creating...' : 'Create Season'}
        </button>
      </form>
    </div>
  )
}

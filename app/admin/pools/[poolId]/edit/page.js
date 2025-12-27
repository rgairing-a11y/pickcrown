'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditPoolPage({ params }) {
  const router = useRouter()
  const [poolId, setPoolId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [eventName, setEventName] = useState('')

  useEffect(() => {
    params.then(p => {
      setPoolId(p.poolId)
    })
  }, [params])

  useEffect(() => {
    if (poolId) {
      loadPool()
    }
  }, [poolId])

  async function loadPool() {
    const { data } = await supabase
      .from('pools')
      .select('*, event:events(name, year)')
      .eq('id', poolId)
      .single()

    if (data) {
      setName(data.name)
      setEventName(`${data.event?.name} (${data.event?.year})`)
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('pools')
      .update({ name })
      .eq('id', poolId)

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

      <h1>Edit Pool</h1>

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
            Event
          </label>
          <div style={{
            padding: 12,
            background: '#f5f5f5',
            borderRadius: 6,
            color: '#666'
          }}>
            {eventName}
          </div>
          <small style={{ color: '#999' }}>Event cannot be changed</small>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Pool Name *
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

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1,
              padding: 14,
              fontSize: 16,
              fontWeight: 'bold',
              background: saving ? '#ccc' : '#0070f3',
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
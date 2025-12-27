'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditPoolPage({ params }) {
  const router = useRouter()
  const [poolId, setPoolId] = useState(null)
  const [pool, setPool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')

  useEffect(() => {
    params.then(p => setPoolId(p.poolId))
  }, [params])

  useEffect(() => {
    if (poolId) loadPool()
  }, [poolId])

  async function loadPool() {
    const { data } = await supabase
      .from('pools')
      .select('*, event:events(name)')
      .eq('id', poolId)
      .single()

    if (data) {
      setPool(data)
      setName(data.name)
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
    return <div style={{ padding: 'var(--spacing-xl)' }}>Loading...</div>
  }

  if (!pool) {
    return <div style={{ padding: 'var(--spacing-xl)' }}>Pool not found</div>
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Link href="/admin" style={{ color: 'var(--color-primary)' }}>
          ← Back to Admin
        </Link>
      </div>

      <h1>Edit Pool</h1>

      <form onSubmit={handleSubmit} style={{
        background: 'var(--color-white)',
        padding: 'var(--spacing-xl)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        marginTop: 'var(--spacing-xl)'
      }}>
        {error && (
          <div style={{
            background: 'var(--color-danger-light)',
            color: 'var(--color-danger-dark)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
            Event
          </label>
          <input
            type="text"
            value={pool.event?.name || 'Unknown'}
            disabled
            style={{ 
              background: 'var(--color-background-dark)', 
              color: 'var(--color-text-light)' 
            }}
          />
          <small style={{ color: 'var(--color-text-muted)' }}>Event cannot be changed</small>
        </div>

        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
            Pool Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1,
              padding: 'var(--spacing-md)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'bold',
              background: saving ? 'var(--color-border)' : 'var(--color-success)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/admin"
            style={{
              padding: 'var(--spacing-md)',
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
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
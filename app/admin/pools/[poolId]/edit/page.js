'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, PageHeader, Button, Alert, FormField, LoadingState, EmptyState } from '../../../../../components/ui'
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

    const res = await fetch('/api/pools', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: poolId,
        name
      })
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error)
      setSaving(false)
      return
    }

    router.push('/admin')
  }

  if (loading) {
    return <LoadingState message="Loading pool..." />
  }

  if (!pool) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <PageHeader title="Pool Not Found" />
        <Card>
          <EmptyState
            icon="❌"
            title="Pool not found"
            actionLabel="Back to Admin"
            actionHref="/admin"
          />
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <PageHeader title="Edit Pool" />

      <Card>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="danger" style={{ marginBottom: 'var(--spacing-lg)' }}>
              {error}
            </Alert>
          )}

          <FormField label="Event" hint="Event cannot be changed">
            <input
              type="text"
              value={pool.event?.name || 'Unknown'}
              disabled
              style={{
                background: 'var(--color-background-dark)',
                color: 'var(--color-text-light)'
              }}
            />
          </FormField>

          <FormField label="Pool Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <Button
              type="submit"
              variant="success"
              loading={saving}
              style={{ flex: 1 }}
            >
              Save Changes
            </Button>
            <Button href="/admin" variant="ghost">
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {/* Email Management */}
      <Card style={{ marginTop: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>📧 Email Management</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
              Send reminders and results to participants
            </p>
          </div>
          <Link
            href={`/admin/pools/${poolId}/emails`}
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            Manage Emails →
          </Link>
        </div>
      </Card>
    </div>
  )
}
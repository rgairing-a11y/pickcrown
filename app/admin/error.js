'use client'

import { Card, Button, PageHeader } from '../../components/ui'

export default function AdminError({ error, reset }) {
  return (
    <div style={{ maxWidth: 500, margin: '40px auto' }}>
      <PageHeader title="Admin Error" />
      <Card style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>
          {error?.message || 'Something went wrong in the admin area'}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button onClick={reset} variant="primary">
            Try Again
          </Button>
          <Button href="/admin" variant="ghost">
            Back to Admin
          </Button>
        </div>
      </Card>
    </div>
  )
}
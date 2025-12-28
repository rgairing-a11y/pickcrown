'use client'

import { Card, Button, PageHeader } from '../../components/ui'

export default function PoolError({ error, reset }) {
  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: '0 20px' }}>
      <PageHeader title="Pool Error" />
      <Card style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏈</div>
        <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>
          {error?.message || 'Could not load this pool'}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button onClick={reset} variant="primary">
            Try Again
          </Button>
          <Button href="/" variant="ghost">
            Go Home
          </Button>
        </div>
      </Card>
    </div>
  )
}
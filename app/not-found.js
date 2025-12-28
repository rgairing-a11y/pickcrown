'use client'

import { Card, Button, PageHeader } from '../components/ui'

export default function NotFound() {
  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: '0 20px' }}>
      <PageHeader title="Page Not Found" />
      <Card style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>
          The page you are looking for does not exist.
        </p>
        <Button href="/" variant="primary">
          Go Home
        </Button>
      </Card>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function FindMyPicksPage() {
  const [email, setEmail] = useState('')
  const [entries, setEntries] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setSearched(true)

    const { data, error } = await supabase
      .from('pool_entries')
      .select(`
        id,
        entry_name,
        created_at,
        pool:pools(
          id,
          name,
          event:events(
            id,
            name,
            start_time,
            status
          )
        )
      `)
      .ilike('email', email.trim())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error:', error)
      setEntries([])
    } else {
      setEntries(data || [])
    }

    setLoading(false)
  }

  const getStatusBadge = (event) => {
    const now = new Date()
    const startTime = new Date(event.start_time)
    
    if (event.status === 'completed') {
      return <span style={{ background: '#6b7280', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>Completed</span>
    }
    if (now >= startTime) {
      return <span style={{ background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>In Progress</span>
    }
    return <span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>Open</span>
  }

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>🔍 Find My Picks</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Enter your email to see all pools you've joined.
      </p>

      <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '8px'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {searched && entries !== null && (
        <>
          {entries.length === 0 ? (
            <div style={{ 
              background: '#fef3c7', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #fcd34d'
            }}>
              <p style={{ margin: 0, color: '#92400e' }}>
                No pools found for <strong>{email}</strong>
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#a16207' }}>
                Make sure you're using the same email you signed up with.
              </p>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>
                Found {entries.length} pool{entries.length !== 1 ? 's' : ''}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px' }}>{entry.pool.name}</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
                          {entry.pool.event.name}
                        </p>
                      </div>
                      {getStatusBadge(entry.pool.event)}
                    </div>
                    
                    <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                      Entry: <strong>{entry.entry_name}</strong>
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <Link
                        href={`/pool/${entry.pool.id}`}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          background: '#3b82f6',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none'
                        }}
                      >
                        View Pool
                      </Link>
                      <Link
                        href={`/pool/${entry.pool.id}/standings`}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          background: 'white',
                          color: '#3b82f6',
                          border: '1px solid #3b82f6',
                          borderRadius: '6px',
                          textDecoration: 'none'
                        }}
                      >
                        Standings
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
        <Link href="/" style={{ color: '#3b82f6', fontSize: '14px' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
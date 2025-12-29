'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function HomePage() {
  const [email, setEmail] = useState('')
  const [storedEmail, setStoredEmail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState([])
  const [managedPools, setManagedPools] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])

  // Check localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pickcrown_email')
    if (saved) {
      setStoredEmail(saved)
      loadUserData(saved)
    } else {
      setLoading(false)
    }
  }, [])

  async function loadUserData(userEmail) {
    setLoading(true)

    // 1. Get user's entries
    const { data: entriesData } = await supabase
      .from('pool_entries')
      .select(`
        *,
        pool:pools(
          id,
          name,
          owner_email,
          event:events(id, name, year, start_time, status)
        )
      `)
      .ilike('email', userEmail)
      .order('created_at', { ascending: false })

    setEntries(entriesData || [])

    // 2. Get pools user manages
    const { data: poolsData } = await supabase
      .from('pools')
      .select(`
        *,
        event:events(id, name, year, start_time, status)
      `)
      .ilike('owner_email', userEmail)
      .order('created_at', { ascending: false })

    setManagedPools(poolsData || [])

    // 3. Get upcoming events
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(5)

    setUpcomingEvents(eventsData || [])

    setLoading(false)
  }

  function handleContinue(e) {
    e.preventDefault()
    if (!email.trim()) return
    
    const normalizedEmail = email.toLowerCase().trim()
    localStorage.setItem('pickcrown_email', normalizedEmail)
    setStoredEmail(normalizedEmail)
    loadUserData(normalizedEmail)
  }

  function handleLogout() {
    localStorage.removeItem('pickcrown_email')
    setStoredEmail(null)
    setEntries([])
    setManagedPools([])
  }

  const isLocked = (startTime) => new Date(startTime) < new Date()

  // ==========================================
  // ENTRY GATE (No email yet)
  // ==========================================
  if (!storedEmail) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          maxWidth: 440,
          width: '100%',
          background: 'white',
          borderRadius: 16,
          padding: 40,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: 48, marginBottom: 8 }}>👑</h1>
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>PickCrown</h2>
          <p style={{ color: '#555', fontSize: 16, lineHeight: 1.6, marginBottom: 8 }}>
            Friendly prediction pools for groups — sports, wrestling, and more.
          </p>
          <p style={{ color: '#777', fontSize: 14, marginBottom: 32 }}>
            No accounts to manage. No clutter.<br/>
            Just pick, play, and see how you stack up.
          </p>

          <form onSubmit={handleContinue}>
            <p style={{ fontSize: 14, color: '#333', marginBottom: 12, textAlign: 'left' }}>
              Enter your email to see your pools or get started.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: 14,
                fontSize: 16,
                border: '2px solid #e5e7eb',
                borderRadius: 8,
                marginBottom: 16
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 14,
                fontSize: 16,
                fontWeight: 600,
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
          </form>

          <p style={{ fontSize: 12, color: '#999', marginTop: 20 }}>
            We only use your email to show your pools and send game updates.
          </p>
        </div>
      </div>
    )
  }

  // ==========================================
  // HOMEPAGE (Email known)
  // ==========================================
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Loading your pools...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32
      }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>👑 PickCrown</h1>
          <p style={{ color: '#666', fontSize: 14 }}>
            Welcome back, {storedEmail}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: 'white',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          Switch Email
        </button>
      </div>

      {/* ==========================================
          SECTION 1: Your Entries
          ========================================== */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>🎯 Your Entries</h2>
        
        {entries.length === 0 ? (
          <div style={{
            padding: 24,
            background: '#f9fafb',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <p style={{ color: '#666', marginBottom: 8 }}>
              You're not in any pools yet.
            </p>
            <p style={{ color: '#999', fontSize: 14 }}>
              If someone invited you, check your link — or start one below.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entries.map(entry => {
              const locked = isLocked(entry.pool?.event?.start_time)
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                    background: locked ? '#f8fafc' : '#f0fdf4',
                    borderRadius: 8,
                    border: `1px solid ${locked ? '#e2e8f0' : '#bbf7d0'}`
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{entry.pool?.name}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
                      {entry.pool?.event?.name} ({entry.pool?.event?.year})
                      <span style={{ marginLeft: 8, color: locked ? '#dc2626' : '#16a34a' }}>
                        {locked ? '🔒 Locked' : '🟢 Open'}
                      </span>
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999' }}>
                      Entry: {entry.entry_name}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!locked && (
                      <Link
                        href={`/pool/${entry.pool?.id}`}
                        style={{
                          padding: '8px 16px',
                          background: '#16a34a',
                          color: 'white',
                          borderRadius: 6,
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: 14
                        }}
                      >
                        Enter Picks
                      </Link>
                    )}
                    <Link
                      href={`/pool/${entry.pool?.id}/standings`}
                      style={{
                        padding: '8px 16px',
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: 6,
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: 14
                      }}
                    >
                      Standings
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ==========================================
          SECTION 2: Pools You Manage (Conditional)
          ========================================== */}
      {managedPools.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>🛠️ Pools You Manage</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {managedPools.map(pool => {
              const locked = isLocked(pool.event?.start_time)
              return (
                <div
                  key={pool.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                    background: '#faf5ff',
                    borderRadius: 8,
                    border: '1px solid #e9d5ff'
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{pool.name}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
                      {pool.event?.name} ({pool.event?.year})
                      <span style={{ marginLeft: 8, color: locked ? '#dc2626' : '#16a34a' }}>
                        {locked ? '🔒 Locked' : '🟢 Open'}
                      </span>
                    </p>
                  </div>
                  <Link
                    href={`/pool/${pool.id}/manage`}
                    style={{
                      padding: '8px 16px',
                      background: '#7c3aed',
                      color: 'white',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    Manage
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ==========================================
          SECTION 3: What's Starting Soon
          ========================================== */}
      {upcomingEvents.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>📅 What's Starting Soon</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
            Coming up next on PickCrown.<br/>
            Get your gang together and start a pool before the games begin.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcomingEvents.map(event => (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: '#fffbeb',
                  borderRadius: 8,
                  border: '1px solid #fde68a'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>
                    {event.event_type === 'hybrid' ? '🎉' : '🏈'} {event.name}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
                    {new Date(event.start_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 16 }}>
            Want to run a pool? Contact the admin to get one set up for your group.
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', fontSize: 14 }}>
          <Link href="/feedback" style={{ color: '#3b82f6' }}>
            💡 Feedback
          </Link>
          <Link href="/admin" style={{ color: '#64748b' }}>
            Admin
          </Link>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
          © 2025 PickCrown • Built for fun, not profit
        </p>
      </div>
    </div>
  )
}
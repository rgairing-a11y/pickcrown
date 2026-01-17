'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import UserAvatar from '../../../components/UserAvatar'

export default function CommissionerDashboardPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.error('Missing Supabase environment variables')
      return null
    }
    return createClient(url, key)
  }, [])

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState(null)
  const [commissioner, setCommissioner] = useState(null)
  const [profile, setProfile] = useState(null)
  const [pools, setPools] = useState([])
  const [stats, setStats] = useState({ totalEntries: 0, activeEvents: 0 })

  useEffect(() => {
    const saved = localStorage.getItem('pickcrown_email')
    if (saved) {
      setEmail(saved)
      loadData(saved)
    } else {
      setLoading(false)
    }
  }, [])

  async function loadData(userEmail) {
    setLoading(true)

    // Get commissioner data
    const commRes = await fetch(`/api/commissioners?email=${encodeURIComponent(userEmail)}`)
    if (commRes.ok) {
      const commData = await commRes.json()
      if (commData.id) {
        setCommissioner(commData)
      }
    }

    // Get profile data
    const profRes = await fetch(`/api/profiles?email=${encodeURIComponent(userEmail)}`)
    if (profRes.ok) {
      const profData = await profRes.json()
      setProfile(profData)
    }

    // Get managed pools
    const { data: poolsData } = await supabase
      .from('pools')
      .select(`
        *,
        event:events(id, name, year, start_time, status),
        entries:pool_entries(count)
      `)
      .ilike('owner_email', userEmail)
      .order('created_at', { ascending: false })

    setPools(poolsData || [])

    // Calculate stats
    const totalEntries = poolsData?.reduce((sum, p) => sum + (p.entries?.[0]?.count || 0), 0) || 0
    const activeEvents = poolsData?.filter(p => p.event?.status !== 'completed').length || 0
    setStats({ totalEntries, activeEvents })

    setLoading(false)
  }

  // Not logged in
  if (!email) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6)'
      }}>
        <div style={{
          maxWidth: 400,
          textAlign: 'center',
          padding: 'var(--spacing-8)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-4)' }}>👑</div>
          <h1 style={{ marginBottom: 'var(--spacing-4)' }}>Commissioner Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-6)' }}>
            Please enter your email on the homepage to access your dashboard.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: 'var(--spacing-3) var(--spacing-6)',
              background: 'var(--color-primary)',
              color: 'white',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              fontWeight: 'var(--font-semibold)'
            }}
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--spacing-6)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--spacing-8)',
        flexWrap: 'wrap',
        gap: 'var(--spacing-4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
          <UserAvatar
            email={email}
            emoji={profile?.avatar_emoji}
            color={profile?.avatar_color}
            size="xl"
            showBadge
            isCommissioner={!!commissioner}
          />
          <div>
            <h1 style={{ 
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-bold)',
              marginBottom: 'var(--spacing-1)'
            }}>
              {commissioner?.name || profile?.display_name || 'Commissioner Dashboard'}
            </h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {commissioner ? '👑 Verified Commissioner' : email}
            </p>
          </div>
        </div>
        <Link
          href="/"
          style={{
            padding: 'var(--spacing-2) var(--spacing-4)',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            fontSize: 'var(--font-size-sm)'
          }}
        >
          ← Back to Home
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-8)'
      }}>
        <div style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-5)',
          border: '1px solid var(--color-border-light)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: 'var(--font-size-4xl)', 
            fontWeight: 'var(--font-bold)',
            color: '#7c3aed'
          }}>
            {pools.length}
          </div>
          <div style={{ 
            fontSize: 'var(--font-size-sm)', 
            color: 'var(--color-text-muted)' 
          }}>
            Pools Created
          </div>
        </div>

        <div style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-5)',
          border: '1px solid var(--color-border-light)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: 'var(--font-size-4xl)', 
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-success)'
          }}>
            {stats.activeEvents}
          </div>
          <div style={{ 
            fontSize: 'var(--font-size-sm)', 
            color: 'var(--color-text-muted)' 
          }}>
            Active Pools
          </div>
        </div>

        <div style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-5)',
          border: '1px solid var(--color-border-light)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: 'var(--font-size-4xl)', 
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-warning)'
          }}>
            {stats.totalEntries}
          </div>
          <div style={{ 
            fontSize: 'var(--font-size-sm)', 
            color: 'var(--color-text-muted)' 
          }}>
            Total Entries
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-6)',
        marginBottom: 'var(--spacing-8)',
        color: 'white'
      }}>
        <h2 style={{ 
          fontSize: 'var(--font-size-xl)', 
          fontWeight: 'var(--font-semibold)',
          marginBottom: 'var(--spacing-4)'
        }}>
          🚀 Quick Actions
        </h2>
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-3)',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              padding: 'var(--spacing-3) var(--spacing-5)',
              background: 'white',
              color: '#7c3aed',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            ➕ Start New Pool
          </Link>
          <Link
            href="/admin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              padding: 'var(--spacing-3) var(--spacing-5)',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              fontWeight: 'var(--font-medium)',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            ⚙️ Admin Panel
          </Link>
        </div>
      </div>

      {/* Your Pools */}
      <div>
        <h2 style={{ 
          fontSize: 'var(--font-size-xl)', 
          fontWeight: 'var(--font-semibold)',
          marginBottom: 'var(--spacing-4)'
        }}>
          Your Pools
        </h2>

        {pools.length === 0 ? (
          <div style={{
            background: 'var(--color-background)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-8)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-4)' }}>🎯</div>
            <h3 style={{ marginBottom: 'var(--spacing-2)' }}>No pools yet</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>
              Start your first pool from the homepage!
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                padding: 'var(--spacing-3) var(--spacing-5)',
                background: '#7c3aed',
                color: 'white',
                borderRadius: 'var(--radius-lg)',
                textDecoration: 'none',
                fontWeight: 'var(--font-semibold)'
              }}
            >
              Create Your First Pool
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {pools.map(pool => {
              const isLocked = new Date(pool.event?.start_time) < new Date()
              const isCompleted = pool.event?.status === 'completed'
              const entryCount = pool.entries?.[0]?.count || 0

              return (
                <div
                  key={pool.id}
                  style={{
                    background: 'var(--color-white)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--spacing-5)',
                    border: '1px solid var(--color-border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-4)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)',
                      marginBottom: 'var(--spacing-1)'
                    }}>
                      <h3 style={{ 
                        margin: 0,
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 'var(--font-semibold)'
                      }}>
                        {pool.name}
                      </h3>
                      <span style={{
                        padding: 'var(--spacing-1) var(--spacing-2)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-medium)',
                        background: isCompleted 
                          ? 'var(--color-background-alt)'
                          : isLocked 
                            ? 'var(--color-warning-light)' 
                            : 'var(--color-success-light)',
                        color: isCompleted
                          ? 'var(--color-text-muted)'
                          : isLocked
                            ? 'var(--color-warning-dark)'
                            : 'var(--color-success-dark)'
                      }}>
                        {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Open'}
                      </span>
                    </div>
                    <p style={{ 
                      margin: 0,
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {pool.event?.name} ({pool.event?.year}) • {entryCount} entries
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-2)'
                  }}>
                    <Link
                      href={`/pool/${pool.id}/standings`}
                      style={{
                        padding: 'var(--spacing-2) var(--spacing-4)',
                        background: 'var(--color-background)',
                        color: 'var(--color-text-secondary)',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-medium)'
                      }}
                    >
                      Standings
                    </Link>
                    <Link
                      href={`/pool/${pool.id}/manage`}
                      style={{
                        padding: 'var(--spacing-2) var(--spacing-4)',
                        background: '#7c3aed',
                        color: 'white',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-semibold)'
                      }}
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Not a commissioner yet */}
      {!commissioner && (
        <div style={{
          marginTop: 'var(--spacing-8)',
          background: 'var(--color-gold-light)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-6)',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: 'var(--spacing-2)' }}>
            👑 Want commissioner perks?
          </h3>
          <p style={{ 
            color: 'var(--color-text-secondary)', 
            marginBottom: 'var(--spacing-4)',
            fontSize: 'var(--font-size-sm)'
          }}>
            Get a custom avatar, verified badge, and priority support!
          </p>
          <Link
            href="/commissioner/signup"
            style={{
              display: 'inline-block',
              padding: 'var(--spacing-3) var(--spacing-5)',
              background: '#7c3aed',
              color: 'white',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              fontWeight: 'var(--font-semibold)'
            }}
          >
            Upgrade to Commissioner
          </Link>
        </div>
      )}
    </div>
  )
}
